import type { ResumeParser, ParsedResume } from './resume-parser.js'
import { truncateResumeText } from './resume-parser.js'

export class TextResumeParser implements ResumeParser {
  readonly supportedExtensions = ['.txt', '.text']

  async parse(buffer: Buffer, filename: string): Promise<ParsedResume> {
    if (buffer.length === 0) {
      throw new Error(`文本文件 "${filename}" 为空，无法解析`)
    }

    // buffer.toString('utf-8') never throws; detect encoding issues via replacement characters instead.
    let rawText = buffer.toString('utf-8')
    const replacementCount = (rawText.match(/\uFFFD/g) || []).length
    if (replacementCount > rawText.length * 0.05) {
      // More than 5% replacement characters — likely not UTF-8, retry as latin1
      console.warn(`文件 "${filename}" 可能不是 UTF-8 编码，尝试 latin1 解码`)
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
