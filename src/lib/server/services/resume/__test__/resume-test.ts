/**
 * Manual test script for the resume parsing service.
 * Run with: npx tsx src/lib/server/services/resume/__test__/resume-test.ts
 *
 * Does NOT require a test runner — prints PASS / FAIL to stdout.
 */

import { getParser } from '../parser-factory.js'
import { TextResumeParser } from '../text-parser.js'
import { PdfResumeParser } from '../pdf-parser.js'
import { DocxResumeParser } from '../docx-parser.js'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label}`)
    failed++
  }
}

function assertThrows(fn: () => unknown, label: string): void {
  try {
    fn()
    console.error(`  FAIL  ${label} (expected throw, but did not throw)`)
    failed++
  } catch {
    console.log(`  PASS  ${label}`)
    passed++
  }
}

async function assertThrowsAsync(fn: () => Promise<unknown>, label: string): Promise<void> {
  try {
    await fn()
    console.error(`  FAIL  ${label} (expected throw, but did not throw)`)
    failed++
  } catch {
    console.log(`  PASS  ${label}`)
    passed++
  }
}

// ---------------------------------------------------------------------------
// Suite 1: TextResumeParser
// ---------------------------------------------------------------------------
console.log('\n[Suite 1] TextResumeParser')

const textParser = new TextResumeParser()

// 1.1 Parse plain ASCII text
{
  const buf = Buffer.from('Hello World\nThis is a resume.', 'utf-8')
  const result = await textParser.parse(buf, 'resume.txt')
  assert(result.text.includes('Hello World'), '1.1 plain text content preserved')
  assert(result.metadata.filename === 'resume.txt', '1.1 filename in metadata')
  assert(result.metadata.fileType === 'txt', '1.1 fileType is txt')
  assert(result.metadata.fileSize === buf.length, '1.1 fileSize correct')
}

// 1.2 Parse UTF-8 Chinese text
{
  const buf = Buffer.from('姓名：张三\n工作经历：5年前端开发', 'utf-8')
  const result = await textParser.parse(buf, 'chinese.txt')
  assert(result.text.includes('张三'), '1.2 UTF-8 Chinese text preserved')
}

// 1.3 Windows line endings normalised
{
  const buf = Buffer.from('Line1\r\nLine2\r\nLine3', 'utf-8')
  const result = await textParser.parse(buf, 'windows.txt')
  assert(!result.text.includes('\r'), '1.3 CRLF removed')
  assert(result.text.includes('\n'), '1.3 LF preserved after normalisation')
}

// 1.4 Empty buffer throws
await assertThrowsAsync(
  () => textParser.parse(Buffer.alloc(0), 'empty.txt'),
  '1.4 empty buffer throws'
)

// 1.5 Whitespace-only buffer throws
await assertThrowsAsync(
  () => textParser.parse(Buffer.from('   \n\t  ', 'utf-8'), 'whitespace.txt'),
  '1.5 whitespace-only buffer throws'
)

// ---------------------------------------------------------------------------
// Suite 2: getParser() routing
// ---------------------------------------------------------------------------
console.log('\n[Suite 2] getParser() routing')

// 2.1 .pdf → PdfResumeParser
{
  const parser = getParser('my-resume.pdf')
  assert(parser instanceof PdfResumeParser, '2.1 .pdf routes to PdfResumeParser')
}

// 2.2 .PDF (uppercase) → PdfResumeParser
{
  const parser = getParser('MY-RESUME.PDF')
  assert(parser instanceof PdfResumeParser, '2.2 .PDF (uppercase) routes to PdfResumeParser')
}

// 2.3 .docx → DocxResumeParser
{
  const parser = getParser('resume.docx')
  assert(parser instanceof DocxResumeParser, '2.3 .docx routes to DocxResumeParser')
}

// 2.4 .doc → DocxResumeParser
{
  const parser = getParser('old-resume.doc')
  assert(parser instanceof DocxResumeParser, '2.4 .doc routes to DocxResumeParser')
}

// 2.5 .txt → TextResumeParser
{
  const parser = getParser('resume.txt')
  assert(parser instanceof TextResumeParser, '2.5 .txt routes to TextResumeParser')
}

// 2.6 .text → TextResumeParser
{
  const parser = getParser('resume.text')
  assert(parser instanceof TextResumeParser, '2.6 .text routes to TextResumeParser')
}

// 2.7 Unsupported extension throws
assertThrows(() => getParser('resume.xlsx'), '2.7 .xlsx throws unsupported format error')
assertThrows(() => getParser('resume.png'), '2.8 .png throws unsupported format error')
assertThrows(() => getParser('noextension'), '2.9 no extension throws error')

// ---------------------------------------------------------------------------
// Suite 3: TextResumeParser truncation
// ---------------------------------------------------------------------------
console.log('\n[Suite 3] Truncation')

{
  // Create a string longer than MAX_RESUME_TEXT_LENGTH (20 000 chars)
  const longText = 'A'.repeat(25_000)
  const buf = Buffer.from(longText, 'utf-8')
  const result = await textParser.parse(buf, 'long.txt')
  assert(result.text.length < longText.length, '3.1 long text is truncated')
  assert(result.text.includes('[内容已截断'), '3.2 truncation notice appended')
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('SOME TESTS FAILED')
  process.exit(1)
} else {
  console.log('ALL TESTS PASSED')
}
