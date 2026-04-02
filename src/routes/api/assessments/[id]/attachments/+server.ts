import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { assessmentDAO, attachmentDAO } from '$lib/server/db'
import { parseResume } from '$lib/server/services/resume'
import { randomUUID } from 'crypto'
import { writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ATTACHMENTS_DIR = join(process.cwd(), 'data', 'attachments')

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true })
}

export const GET: RequestHandler = ({ params }) => {
  try {
    const assessment = assessmentDAO.getById(params.id)
    if (!assessment) {
      return json({ success: false, error: 'Assessment not found' }, { status: 404 })
    }
    const attachments = attachmentDAO.getByAssessmentId(params.id)
    return json({ success: true, data: attachments })
  } catch (e) {
    console.error('GET attachments error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ params, request }) => {
  const assessment = assessmentDAO.getById(params.id)
  if (!assessment) {
    return json({ success: false, error: 'Assessment not found' }, { status: 404 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return json({ success: false, error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return json({ success: false, error: '请上传文件' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return json({ success: false, error: '文件大小超出限制（最大 10MB）' }, { status: 413 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const storedName = randomUUID() + '.' + ext

    ensureDir(ATTACHMENTS_DIR)
    const filePath = join(ATTACHMENTS_DIR, storedName)
    writeFileSync(filePath, buffer)

    const docExts = ['pdf', 'docx', 'doc', 'txt']
    const audioExts = ['mp3', 'wav', 'm4a']
    const imageExts = ['jpg', 'jpeg', 'png']
    let fileType = 'other'
    if (docExts.includes(ext)) fileType = ext === 'txt' ? 'txt' : ext === 'pdf' ? 'pdf' : 'docx'
    else if (audioExts.includes(ext)) fileType = 'audio'
    else if (imageExts.includes(ext)) fileType = 'image'

    let textContent: string | null = null
    if (docExts.includes(ext)) {
      try {
        const parsed = await parseResume(buffer, file.name)
        textContent = parsed.text
      } catch {
        // Non-fatal: store without text
      }
    }

    const attachment = attachmentDAO.create({
      assessmentId: params.id,
      filename: storedName,
      originalName: file.name,
      filePath,
      fileType,
      fileSize: file.size,
      textContent,
    })

    return json({ success: true, data: attachment }, { status: 201 })
  } catch (e) {
    console.error('POST attachment error:', e)
    return json({ success: false, error: '上传失败' }, { status: 500 })
  }
}

export const DELETE: RequestHandler = ({ params, url }) => {
  const attachmentId = url.searchParams.get('attachmentId')
  if (!attachmentId) {
    return json({ success: false, error: 'Missing attachmentId' }, { status: 400 })
  }
  try {
    attachmentDAO.delete(attachmentId)
    return json({ success: true })
  } catch (e) {
    console.error('DELETE attachment error:', e)
    return json({ success: false, error: '删除失败' }, { status: 500 })
  }
}
