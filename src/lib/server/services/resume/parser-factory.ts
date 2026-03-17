import path from 'path'
import type { ResumeParser } from './resume-parser.js'
import { PdfResumeParser } from './pdf-parser.js'
import { DocxResumeParser } from './docx-parser.js'
import { TextResumeParser } from './text-parser.js'

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
  const ext = path.extname(filename).toLowerCase()
  if (!ext) {
    throw new Error(`无法确定文件类型: "${filename}"（文件名缺少扩展名）`)
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
  const parser = getParser(filename)
  return parser.parse(buffer, filename)
}
