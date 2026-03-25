import path from 'path'
import mammoth from 'mammoth'
import type { ResumeParser, ParsedResume } from './resume-parser.js'
import { truncateResumeText } from './resume-parser.js'

export class DocxResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.docx', '.doc']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    if (buffer.length === 0) {
      throw new Error(`Word 文件 "${filename}" 为空，无法解析`)
    }

    // Warn about limited .doc support — mammoth is optimised for .docx
    if (path.extname(filename).toLowerCase() === '.doc') {
      console.warn(
        `注意: "${filename}" 是旧版 .doc 格式，mammoth 对 .doc 支持有限，建议转换为 .docx`
      )
    }

    let result: Awaited<ReturnType<typeof mammoth.extractRawText>>
    try {
      result = await mammoth.extractRawText({ buffer })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`Word 文档解析失败 "${filename}": ${message}`)
    }

    const rawText = result.value ?? ''
    if (rawText.trim().length === 0) {
      throw new Error(`Word 文件 "${filename}" 未提取到任何文本内容`)
    }

    // mammoth may include conversion warnings; log them but do not fail
    if (result.messages.length > 0) {
      const warnings = result.messages
        .filter((m) => m.type === 'warning')
        .map((m) => m.message)
        .join('; ')
      if (warnings) {
        console.warn(`[DocxResumeParser] "${filename}" 解析警告: ${warnings}`)
      }
    }

    const ext = filename.toLowerCase().endsWith('.doc') ? 'doc' : 'docx'

    return {
      text: truncateResumeText(rawText),
      metadata: {
        filename,
        fileType: ext,
        fileSize: buffer.length
      }
    }
  }
}
