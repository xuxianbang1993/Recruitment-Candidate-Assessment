import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { parseResume } from '$lib/server/services/resume'
import { candidateDAO } from '$lib/server/db'
import path from 'path'

const MAX_FILE_SIZE = 11 * 1024 * 1024 // 11MB

export const POST: RequestHandler = async ({ request }) => {
  // Content-Length pre-check
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
    return json({ success: false, error: '文件大小超出限制（最大 10MB）' }, { status: 413 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return json(
      { success: false, error: 'Content-Type must be multipart/form-data' },
      { status: 400 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return json({ success: false, error: 'Failed to parse form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return json({ success: false, error: '请上传简历文件' }, { status: 400 })
  }

  if (file.size === 0) {
    return json({ success: false, error: '上传的文件为空' }, { status: 400 })
  }

  const candidateId = formData.get('candidateId')
  const createCandidateRaw = formData.get('createCandidate')
  const createCandidate = createCandidateRaw === 'true' || createCandidateRaw === '1'
  const jobId = formData.get('jobId')

  let parsed
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    parsed = await parseResume(buffer, file.name)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    const isUnsupported =
      message.includes('不支持的文件格式') || message.includes('无法确定文件类型')
    const isTooLarge = message.includes('超出限制')
    if (isTooLarge) {
      return json({ success: false, error: message }, { status: 413 })
    }
    if (isUnsupported) {
      return json({ success: false, error: message }, { status: 400 })
    }
    console.error('POST /api/resume/upload parseResume error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }

  let resolvedCandidateId: string | undefined

  try {
    if (typeof candidateId === 'string' && candidateId) {
      const existing = candidateDAO.getById(candidateId)
      if (!existing) {
        return json({ success: false, error: 'Candidate not found' }, { status: 404 })
      }
      candidateDAO.update(candidateId, { resumeText: parsed.text })
      resolvedCandidateId = candidateId
    } else if (createCandidate) {
      if (typeof jobId !== 'string' || !jobId) {
        return json({ success: false, error: 'jobId is required when creating a candidate' }, { status: 400 })
      }
      const basename = path.basename(file.name, path.extname(file.name))
      const candidate = candidateDAO.create({
        jobId,
        name: basename || '未命名候选人',
        phone: '',
        email: '',
        resumeText: parsed.text,
        skills: [],
        experience: 0,
        education: ''
      })
      resolvedCandidateId = candidate.id
    }
  } catch (e) {
    console.error('POST /api/resume/upload candidate create/update error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }

  const status = createCandidate && resolvedCandidateId ? 201 : 200
  return json(
    {
      success: true,
      data: {
        text: parsed.text,
        metadata: parsed.metadata,
        ...(resolvedCandidateId !== undefined ? { candidateId: resolvedCandidateId } : {})
      }
    },
    { status }
  )
}
