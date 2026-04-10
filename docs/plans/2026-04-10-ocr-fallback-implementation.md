# PDF 扫描件 OCR 降级 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 当 PDF 简历为扫描件（图片型）时，自动使用 PaddleOCR 识别中文文字，消除 500 错误。

**Architecture:** 在 `PdfResumeParser.parse()` 内部增加 OCR 降级分支。新建 `OcrService` 单例封装 `multilingual-purejs-ocr` + `unpdf renderPageAsImage`。对上层 upload endpoint 透明。

**Tech Stack:** `multilingual-purejs-ocr` (PaddleOCR v4 ONNX)、`@napi-rs/canvas` (PDF 渲染)、`onnxruntime-node`

**已验证：** 端到端测试通过 — 扫描 PDF → 渲染图片 (1190x1683 PNG) → OCR 识别 44 个文本块、994 字符中文内容，精度极高。

---

### Task 1: ParsedResume metadata 增加 ocrUsed 字段

**Files:**
- Modify: `src/lib/server/services/resume/resume-parser.ts:10` (metadata 接口)

**Step 1: 修改 metadata 接口**

在 `ParsedResume.metadata` 中增加可选字段：

```typescript
export interface ParsedResume {
  text: string
  metadata: {
    filename: string
    fileType: string
    pageCount?: number
    fileSize: number
    ocrUsed?: boolean
  }
}
```

**Step 2: 验证类型编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 无新增错误（ocrUsed 是可选字段，不影响现有代码）

**Step 3: Commit**

```bash
git add src/lib/server/services/resume/resume-parser.ts
git commit -m "feat(resume): add ocrUsed field to ParsedResume metadata"
```

---

### Task 2: 创建 OcrService 单例

**Files:**
- Create: `src/lib/server/services/resume/ocr-service.ts`
- Modify: `src/lib/server/services/resume/index.ts` (增加导出)

**Step 1: 创建 ocr-service.ts**

```typescript
import type { Ocr as OcrType } from 'multilingual-purejs-ocr'
import path from 'path'
import { renderPageAsImage, getDocumentProxy } from 'unpdf'

// Resolve ONNX model paths relative to the installed package
const modelsDir = path.join(
  path.dirname(require.resolve('multilingual-purejs-ocr')),
  'models'
)

/**
 * Singleton OCR service backed by PaddleOCR v4 ONNX models.
 * Lazily initializes the engine on first use to avoid startup overhead.
 */
class OcrService {
  private ocr: OcrType | null = null

  /**
   * Lazily creates the OCR engine with Chinese model.
   */
  private async ensureInitialized(): Promise<OcrType> {
    if (this.ocr) return this.ocr

    const { Ocr } = await import('multilingual-purejs-ocr')
    this.ocr = await Ocr.create({
      lang: 'ch',
      detectionModelPath: path.join(modelsDir, 'ch_PP-OCRv4_det_infer.onnx'),
      recognitionModelPath: path.join(modelsDir, 'ch_PP-OCRv4_rec_infer.onnx'),
      dictionaryPath: path.join(modelsDir, 'ch_dict.txt')
    })

    return this.ocr
  }

  /**
   * Renders each page of a PDF buffer to an image and runs OCR.
   * Returns the concatenated text from all pages.
   */
  async recognizeFromPdf(buffer: Buffer): Promise<string> {
    const pdfData = new Uint8Array(buffer)
    const doc = await getDocumentProxy(pdfData)
    const pageCount = doc.numPages
    const pageTexts: string[] = []

    try {
      for (let page = 1; page <= pageCount; page++) {
        const imageData = await renderPageAsImage(pdfData, page, {
          scale: 2,
          canvasImport: () => import('@napi-rs/canvas')
        })
        const imageBuffer = Buffer.from(imageData as ArrayBuffer)
        const text = await this.recognizeFromImage(imageBuffer)
        if (text.length > 0) {
          pageTexts.push(text)
        }
      }
    } finally {
      await doc.destroy()
    }

    return pageTexts.join('\n\n')
  }

  /**
   * Runs OCR on a single image buffer (PNG/JPEG).
   * Returns extracted text lines joined by newlines.
   */
  async recognizeFromImage(imageBuffer: Buffer): Promise<string> {
    const ocr = await this.ensureInitialized()
    const result = await ocr.detect(imageBuffer)

    if (!result?.data || result.data.length === 0) {
      return ''
    }

    return result.data.map((item: { text: string }) => item.text).join('\n')
  }
}

export const ocrService = new OcrService()
```

**Step 2: 在 index.ts 增加导出**

在 `src/lib/server/services/resume/index.ts` 末尾增加：

```typescript
// OCR service
export { ocrService } from './ocr-service.js'
```

**Step 3: 验证类型编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 编译通过

**Step 4: Commit**

```bash
git add src/lib/server/services/resume/ocr-service.ts src/lib/server/services/resume/index.ts
git commit -m "feat(resume): add OcrService singleton with PaddleOCR v4 Chinese model"
```

---

### Task 3: PdfResumeParser 增加 OCR 降级分支

**Files:**
- Modify: `src/lib/server/services/resume/pdf-parser.ts`

**Step 1: 修改 parse 方法**

将现有的"文字为空 → throw"逻辑替换为 OCR 降级：

```typescript
import type { ParsedResume, ResumeParser } from './resume-parser.js'
import { extractText } from 'unpdf'
import { truncateResumeText } from './resume-parser.js'
import { ocrService } from './ocr-service.js'

// ... (ExtractedPdfText, normalizePdfText 不变)

export class PdfResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.pdf']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    if (buffer.length === 0) {
      throw new Error(`PDF 文件 "${filename}" 为空，无法解析`)
    }

    let result: ExtractedPdfText
    try {
      result = await extractText(new Uint8Array(buffer), { mergePages: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`PDF 解析失败 "${filename}": ${message}`)
    }

    const rawText = normalizePdfText(result.text)

    // 文字提取成功 → 直接返回（现有逻辑）
    if (rawText.trim().length > 0) {
      return {
        text: truncateResumeText(rawText),
        metadata: {
          filename,
          fileType: 'pdf',
          pageCount: result.totalPages,
          fileSize: buffer.length
        }
      }
    }

    // OCR 降级：扫描件尝试图片识别
    const ocrText = await ocrService.recognizeFromPdf(buffer)
    if (ocrText.trim().length === 0) {
      throw new Error(
        `PDF 文件 "${filename}" 为扫描件且 OCR 无法识别文字内容，请上传包含可复制文字的简历`
      )
    }

    return {
      text: truncateResumeText(ocrText),
      metadata: {
        filename,
        fileType: 'pdf',
        pageCount: result.totalPages,
        fileSize: buffer.length,
        ocrUsed: true
      }
    }
  }
}
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 编译通过

**Step 3: Commit**

```bash
git add src/lib/server/services/resume/pdf-parser.ts
git commit -m "feat(resume): add OCR fallback for scanned PDF resumes"
```

---

### Task 4: 修复 upload endpoint 错误分类

**Files:**
- Modify: `src/routes/api/resume/upload/+server.ts:191-203`

**Step 1: 增加扫描件错误识别**

在 catch 块中增加对 OCR 失败消息的匹配，将其返回 400 而非 500：

```typescript
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isUnsupported =
      message.includes('不支持的文件格式') || message.includes('无法确定文件类型')
    const isTooLarge = message.includes('超出限制')
    const isEmptyContent =
      message.includes('未提取到') || message.includes('扫描件')
    if (isTooLarge) {
      return json({ success: false, error: message }, { status: 413 })
    }
    if (isUnsupported || isEmptyContent) {
      return json({ success: false, error: message }, { status: 400 })
    }
    console.error('POST /api/resume/upload parseResume error:', error)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 编译通过

**Step 3: Commit**

```bash
git add src/routes/api/resume/upload/+server.ts
git commit -m "fix(api): classify scanned-PDF OCR errors as 400 instead of 500"
```

---

### Task 5: 端到端手动验证

**Step 1: 验证扫描件 PDF 上传**

使用实际的扫描件 PDF `/Users/xuxianbang/Downloads/【国际外贸业务员深圳 8-13K】唐业锋 6年.pdf` 通过应用上传，确认：

- 不再返回 500 错误
- 能正确提取中文文字内容
- 候选人记录正常创建
- 简历档案自动解析正常触发

**Step 2: 验证普通 PDF 上传**

使用一个包含可复制文字的普通 PDF 简历上传，确认：

- 现有流程不受影响
- 不触发 OCR（性能不变）
- metadata 中 ocrUsed 为 undefined（不是 true）

**Step 3: 全量类型检查**

Run: `npx tsc --noEmit --pretty`
Expected: 编译通过，无错误

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(deps): add multilingual-purejs-ocr and @napi-rs/canvas for scanned PDF OCR"
```
