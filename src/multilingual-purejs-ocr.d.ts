declare module 'multilingual-purejs-ocr' {
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

	interface OcrCreateOptions {
		lang: string
		detectionModelPath: string
		recognitionModelPath: string
		dictionaryPath: string
	}

	export class Ocr {
		static create(options: OcrCreateOptions): Promise<OcrEngine>
	}
}
