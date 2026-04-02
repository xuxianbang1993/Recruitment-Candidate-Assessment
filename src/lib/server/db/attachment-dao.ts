import { getDatabase } from './database.js'
import { randomUUID } from 'crypto'

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

interface AttachmentRow {
  id: string
  assessment_id: string
  filename: string
  original_name: string
  file_path: string
  file_type: string
  file_size: number
  text_content: string | null
  created_at: string
}

function rowToAttachment(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    filename: row.filename,
    originalName: row.original_name,
    filePath: row.file_path,
    fileType: row.file_type,
    fileSize: row.file_size,
    textContent: row.text_content,
    createdAt: row.created_at,
  }
}

export class AttachmentDAO {
  getByAssessmentId(assessmentId: string): Attachment[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM attachments WHERE assessment_id = ? ORDER BY created_at ASC')
      .all(assessmentId) as AttachmentRow[]
    return rows.map(rowToAttachment)
  }

  create(data: Omit<Attachment, 'id' | 'createdAt'>): Attachment {
    const db = getDatabase()
    const id = randomUUID()
    db.prepare(
      `INSERT INTO attachments (id, assessment_id, filename, original_name, file_path, file_type, file_size, text_content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.assessmentId, data.filename, data.originalName, data.filePath, data.fileType, data.fileSize, data.textContent)
    const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as AttachmentRow
    return rowToAttachment(row)
  }

  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM attachments WHERE id = ?').run(id)
  }
}

export const attachmentDAO = new AttachmentDAO()
