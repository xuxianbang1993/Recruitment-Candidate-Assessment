import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { parseResume } from '$lib/server/services/resume'
import { candidateDAO } from '$lib/server/db'
import path from 'path'

export const POST: RequestHandler = async ({ request }) => {
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

  const candidateId = formData.get('candidateId')
  const createCandidateRaw = formData.get('createCandidate')
  const createCandidate = createCandidateRaw === 'true' || createCandidateRaw === '1'

  let parsed
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    parsed = await parseResume(buffer, file.name)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    // parseResume throws for size limit and unsupported formats with descriptive messages
    const isUnsupported =
      message.includes('不支持的文件格式') || message.includes('无法确定文件类型')
    const isTooLarge = message.includes('超出限制')
    if (isTooLarge) {
      return json({ success: false, error: message }, { status: 413 })
    }
    if (isUnsupported) {
      return json({ success: false, error: message }, { status: 400 })
    }
    return json({ success: false, error: message }, { status: 500 })
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
      // Extract a name from the filename (strip extension)
      const basename = path.basename(file.name, path.extname(file.name))
      const candidate = candidateDAO.create({
        name: basename || '未命名候选人',
        phone: '',
        email: '',
        position: '',
        resumeText: parsed.text,
        skills: [],
        experience: 0,
        education: ''
      })
      resolvedCandidateId = candidate.id
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }

  return json({
    success: true,
    data: {
      text: parsed.text,
      metadata: parsed.metadata,
      ...(resolvedCandidateId !== undefined ? { candidateId: resolvedCandidateId } : {})
    }
  })
}
