import type { OcrEngine } from 'multilingual-purejs-ocr'
import { createRequire } from 'node:module'
import path from 'node:path'
import { renderPageAsImage } from 'unpdf'

const MAX_OCR_PAGES = 20

/**
 * Resolves the absolute path to the ONNX models directory.
 * Deferred to first OCR call to avoid crashing the server at startup
 * when the package is not installed (e.g. before npm install).
 */
function resolveModelsDir(): string {
  const esmRequire = createRequire(import.meta.url)
  return path.join(
    path.dirname(esmRequire.resolve('multilingual-purejs-ocr')),
    'models'
  )
}

/**
 * Singleton OCR service backed by PaddleOCR v4 ONNX models.
 * Lazily initializes the engine on first use to avoid startup overhead.
 */
class OcrService {
  private initPromise: Promise<OcrEngine> | null = null

  /**
   * Lazily creates the OCR engine with Chinese model.
   * Stores the in-flight Promise to prevent concurrent init race conditions.
   */
  private ensureInitialized(): Promise<OcrEngine> {
    if (!this.initPromise) {
      this.initPromise = (async (): Promise<OcrEngine> => {
        const modelsDir = resolveModelsDir()
        const { Ocr } = await import('multilingual-purejs-ocr')
        return Ocr.create({
          lang: 'ch',
          detectionModelPath: path.join(modelsDir, 'ch_PP-OCRv4_det_infer.onnx'),
          recognitionModelPath: path.join(modelsDir, 'ch_PP-OCRv4_rec_infer.onnx'),
          dictionaryPath: path.join(modelsDir, 'ch_dict.txt')
        })
      })()
    }

    return this.initPromise
  }

  /**
   * Renders each page of a PDF buffer to an image and runs OCR.
   * Accepts pageCount from the caller to avoid a separate getDocumentProxy call
   * (which conflicts with renderPageAsImage's internal worker).
   */
  async recognizeFromPdf(buffer: Buffer, pageCount: number): Promise<string> {
    const effectivePages = Math.min(pageCount, MAX_OCR_PAGES)
    const pdfData = new Uint8Array(buffer)
    const pageTexts: string[] = []

    for (let page = 1; page <= effectivePages; page++) {
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

    return pageTexts.join('\n\n')
  }

  /**
   * Runs OCR on a single image buffer (PNG).
   * Returns extracted text lines joined by newlines.
   */
  async recognizeFromImage(imageBuffer: Buffer): Promise<string> {
    const ocr = await this.ensureInitialized()
    const result = await ocr.detect(imageBuffer)

    if (!result?.data || result.data.length === 0) {
      return ''
    }

    return result.data.map((item: { text: string }) => item.text).join('\n')
  }
}

export const ocrService = new OcrService()
