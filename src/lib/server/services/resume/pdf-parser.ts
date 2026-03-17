import { PDFParse } from 'pdf-parse'
import type { ResumeParser, ParsedResume } from './resume-parser.js'
import { truncateResumeText } from './resume-parser.js'

export class PdfResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.pdf']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    if (buffer.length === 0) {
      throw new Error(`PDF 文件 "${filename}" 为空，无法解析`)
    }

    const parser = new PDFParse({ data: buffer })

    let textResult: Awaited<ReturnType<typeof parser.getText>>
    try {
      // getText() internally loads the PDF document; no need to call load() directly.
      textResult = await parser.getText()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`PDF 解析失败 "${filename}": ${message}`)
    } finally {
      // Always release pdfjs resources
      await parser.destroy().catch(() => undefined)
    }

    const rawText = textResult.text ?? ''
    if (rawText.trim().length === 0) {
      throw new Error(
        `PDF 文件 "${filename}" 未提取到任何文本内容（可能为扫描件或加密 PDF）`
      )
    }

    return {
      text: truncateResumeText(rawText),
      metadata: {
        filename,
        fileType: 'pdf',
        pageCount: textResult.total,
        fileSize: buffer.length
      }
    }
  }
}
