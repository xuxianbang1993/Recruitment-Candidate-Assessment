import type { ResumeParser, ParsedResume } from './resume-parser.js'
import { truncateResumeText } from './resume-parser.js'

export class TextResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.txt', '.text']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    if (buffer.length === 0) {
      throw new Error(`文本文件 "${filename}" 为空，无法解析`)
    }

    // Attempt UTF-8 first; fall back to latin1 to avoid Buffer decode errors.
    let rawText: string
    try {
      rawText = buffer.toString('utf-8')
    } catch {
      rawText = buffer.toString('latin1')
    }

    // Replace common Windows line endings for uniform handling downstream.
    const normalised = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    if (normalised.trim().length === 0) {
      throw new Error(`文本文件 "${filename}" 内容为空`)
    }

    return {
      text: truncateResumeText(normalised),
      metadata: {
        filename,
        fileType: 'txt',
        fileSize: buffer.length
      }
    }
  }
}
