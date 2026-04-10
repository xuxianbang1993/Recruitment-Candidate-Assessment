# PDF 扫描件 OCR 降级设计

## 背景

当前 `PdfResumeParser` 使用 `unpdf` 提取 PDF 文字。对于扫描件（图片型 PDF），`extractText` 返回空字符串，导致上传流程返回 500 服务器内部错误。

需要增加 OCR 降级能力：当文字提取为空时，自动将 PDF 页面转为图片，使用 PaddleOCR 模型识别中文文字。

## 技术选型

- **OCR 引擎**: `multilingual-purejs-ocr`（基于 PaddleOCR v4 ONNX 模型）
- **推理运行时**: `onnxruntime-node`（Electron 原生支持）
- **PDF 转图片**: `unpdf` 的 `renderPageAsImage()` API
- **模型**: PP-OCRv4 中文模型，随包内置，离线可用

## 方案：PdfResumeParser 内部 OCR 降级

### 架构

```
PDF buffer → PdfResumeParser.parse()
               → unpdf extractText()
               ├─ 有文字 → truncate → 返回（现有逻辑，不变）
               └─ 文字为空 → OcrService.recognizeFromPdf(buffer)
                              ├─ 有文字 → truncate → 返回（ocrUsed: true）
                              └─ 也为空 → throw 友好错误（400，非 500）
```

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/lib/server/services/resume/ocr-service.ts` | OCR 服务单例，封装模型加载和识别逻辑 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/lib/server/services/resume/pdf-parser.ts` | 增加 OCR 降级分支 |
| `src/lib/server/services/resume/resume-parser.ts` | `ParsedResume.metadata` 增加 `ocrUsed` 可选字段 |
| `src/lib/server/services/resume/index.ts` | 导出 `ocrService` |
| `src/routes/api/resume/upload/+server.ts` | 修复错误分类：扫描件错误 → 400 |
| `package.json` | 添加 `multilingual-purejs-ocr` 依赖 |

### OcrService 设计

```typescript
class OcrService {
  private ocr: Ocr | null = null

  // 懒加载：首次调用时初始化 OCR 引擎（加载 ONNX 模型）
  private async ensureInitialized(): Promise<Ocr>

  // PDF → 逐页渲染为图片 → OCR 识别 → 拼接文字
  async recognizeFromPdf(buffer: Buffer): Promise<string>

  // 单张图片 OCR
  async recognizeFromImage(imageBuffer: Buffer): Promise<string>
}

export const ocrService = new OcrService()
```

### PdfResumeParser 改动

在 `rawText.trim().length === 0` 分支中，不再直接 throw，而是：
1. 调用 `ocrService.recognizeFromPdf(buffer)` 尝试 OCR
2. OCR 有结果 → 返回，metadata 标记 `ocrUsed: true`
3. OCR 也为空 → throw 友好错误

### 错误处理修复

`+server.ts` catch 块增加对 `'扫描件'` 和 `'未提取到'` 关键词的识别，返回 400。

### 依赖变更

```json
{
  "multilingual-purejs-ocr": "^latest"
}
```

模型随包内置，离线可用。预计增加包体积 ~30-50MB。

## OCR 失败策略

当 OCR 也无法识别文字时，返回 400 + 友好错误提示：
- 消息：`PDF 文件 "xxx" 为扫描件且 OCR 无法识别文字内容，请上传文字版简历`
- 不创建候选人记录

## 性能考虑

- ONNX 模型懒加载（首次 OCR 时初始化，后续复用）
- 单页 PDF 识别预计 1-3 秒
- 多页 PDF 串行处理，每页额外 1-2 秒
