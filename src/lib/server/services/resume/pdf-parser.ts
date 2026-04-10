import type { ParsedResume, ResumeParser } from './resume-parser.js'
import { extractText } from 'unpdf'
import { truncateResumeText } from './resume-parser.js'

interface ExtractedPdfText {
  totalPages: number
  text: string | string[]
}

function normalizePdfText(text: string | string[]): string {
  if (typeof text === 'string') return text

  return text
    .map((pageText) => pageText.trim())
    .filter((pageText) => pageText.length > 0)
    .join('\n\n')
}

/**
 * PDF resume parser based on unpdf for better Chinese and CJK extraction quality.
 */
export class PdfResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.pdf']

  /**
   * Parses a PDF resume file and returns normalized text plus file metadata.
   */
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
    if (rawText.trim().length === 0) {
      throw new Error(`PDF 文件 "${filename}" 未提取到任何文本内容，请确认文件包含可复制文本`)
    }

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
}
