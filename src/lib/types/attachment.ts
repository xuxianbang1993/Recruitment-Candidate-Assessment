export interface Attachment {
  id: string
  assessmentId: string
  filename: string
  originalName: string
  filePath: string
  fileType: string
  fileSize: number
  textContent: string | null
  createdAt: string
}
