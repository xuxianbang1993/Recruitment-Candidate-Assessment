/**
 * Resume parser interface and shared types.
 * All concrete parsers implement ResumeParser.
 */

export interface ResumeParser {
  readonly supportedExtensions: string[]
  parse(buffer: Buffer, filename: string): Promise<ParsedResume>
}

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

/** Maximum characters to retain from a parsed resume. */
export const MAX_RESUME_TEXT_LENGTH = 20_000

/**
 * Truncate resume text to a reasonable length for downstream AI processing.
 * Truncation appends a notice so downstream code knows the text was cut.
 */
export function truncateResumeText(text: string): string {
  if (text.length <= MAX_RESUME_TEXT_LENGTH) return text
  return text.slice(0, MAX_RESUME_TEXT_LENGTH) + '\n\n[内容已截断，超出最大长度限制]'
}
