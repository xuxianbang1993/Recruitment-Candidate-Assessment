import path from 'path'
import type { ResumeParser } from './resume-parser.js'
import { PdfResumeParser } from './pdf-parser.js'
import { DocxResumeParser } from './docx-parser.js'
import { TextResumeParser } from './text-parser.js'

// Maximum allowed file size: 10 MB (Buffer DoS protection)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Lazily instantiate parsers (singletons per process).
const parsers: ResumeParser[] = [
  new PdfResumeParser(),
  new DocxResumeParser(),
  new TextResumeParser()
]

/**
 * Return the appropriate parser for the given filename based on its extension.
 * Throws if no parser supports the extension.
 */
export function getParser(filename: string): ResumeParser {
  // Sanitize: strip any directory components to prevent path traversal
  const safeName = path.basename(filename)

  const ext = path.extname(safeName).toLowerCase()
  if (!ext) {
    throw new Error(`无法确定文件类型: "${safeName}"（文件名缺少扩展名）`)
  }

  const parser = parsers.find((p) => p.supportedExtensions.includes(ext))
  if (!parser) {
    const supported = parsers.flatMap((p) => p.supportedExtensions).join(', ')
    throw new Error(
      `不支持的文件格式 "${ext}"。当前支持的格式: ${supported}`
    )
  }

  return parser
}

/**
 * Convenience function: resolve the parser and immediately parse the buffer.
 */
export async function parseResume(buffer: Buffer, filename: string) {
  // Guard: reject oversized files early to prevent memory exhaustion
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `文件大小 ${(buffer.length / 1024 / 1024).toFixed(1)}MB 超出限制（最大 10MB）`
    )
  }

  // Sanitize: strip any directory components to prevent path traversal
  const safeName = path.basename(filename)

  const parser = getParser(safeName)
  return parser.parse(buffer, safeName)
}
