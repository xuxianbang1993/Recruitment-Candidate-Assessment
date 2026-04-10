import { createRequire } from 'node:module'
import path from 'node:path'
import { renderPageAsImage, getDocumentProxy } from 'unpdf'

// Resolve ONNX model paths relative to the installed package
const require = createRequire(import.meta.url)
const modelsDir = path.join(
  path.dirname(require.resolve('multilingual-purejs-ocr')),
  'models'
)

interface OcrDetectItem {
  text: string
  confidence: number
}

interface OcrDetectResult {
  totalElements: number
  data: OcrDetectItem[]
}

interface OcrEngine {
  detect(input: Buffer | string): Promise<OcrDetectResult>
}

/**
 * Singleton OCR service backed by PaddleOCR v4 ONNX models.
 * Lazily initializes the engine on first use to avoid startup overhead.
 */
class OcrService {
  private ocr: OcrEngine | null = null

  /**
   * Lazily creates the OCR engine with Chinese model.
   */
  private async ensureInitialized(): Promise<OcrEngine> {
    if (this.ocr) return this.ocr

    const { Ocr } = await import('multilingual-purejs-ocr')
    this.ocr = await Ocr.create({
      lang: 'ch',
      detectionModelPath: path.join(modelsDir, 'ch_PP-OCRv4_det_infer.onnx'),
      recognitionModelPath: path.join(modelsDir, 'ch_PP-OCRv4_rec_infer.onnx'),
      dictionaryPath: path.join(modelsDir, 'ch_dict.txt')
    })

    return this.ocr!
  }

  /**
   * Renders each page of a PDF buffer to an image and runs OCR.
   * Returns the concatenated text from all pages.
   */
  async recognizeFromPdf(buffer: Buffer): Promise<string> {
    const pdfData = new Uint8Array(buffer)
    const doc = await getDocumentProxy(pdfData)
    const pageCount = doc.numPages
    const pageTexts: string[] = []

    try {
      for (let page = 1; page <= pageCount; page++) {
        const imageData = await renderPageAsImage(pdfData, page, {
          scale: 2,
          canvasImport: () => import('@napi-rs/canvas')
        })
        const imageBuffer = Buffer.from(imageData)
        const text = await this.recognizeFromImage(imageBuffer)
        if (text.length > 0) {
          pageTexts.push(text)
        }
      }
    } finally {
      await doc.destroy()
    }

    return pageTexts.join('\n\n')
  }

  /**
   * Runs OCR on a single image buffer (PNG/JPEG).
   * Returns extracted text lines joined by newlines.
   */
  async recognizeFromImage(imageBuffer: Buffer): Promise<string> {
    const ocr = await this.ensureInitialized()
    const result = await ocr.detect(imageBuffer)

    if (!result?.data || result.data.length === 0) {
      return ''
    }

    return result.data.map((item) => item.text).join('\n')
  }
}

export const ocrService = new OcrService()
