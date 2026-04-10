import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { assessmentDAO, jobDAO } from '$lib/server/db'
import { createAI, AIServiceError } from '$lib/server/services/ai'
import { AIConfigError, getAIConfig, getResumeProfileByCandidateAndJob } from '../utils'

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('candidateId' in body) ||
    !('jobId' in body)
  ) {
    return json(
      { success: false, error: 'Missing required fields: candidateId, jobId' },
      { status: 400 }
    )
  }

  const data = body as Record<string, unknown>
  const candidateId = String(data.candidateId)
  const jobId = String(data.jobId)

  try {
    const job = jobDAO.getById(jobId)
    if (!job) {
      return json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const profile = getResumeProfileByCandidateAndJob(candidateId, jobId)
    if (!profile) {
      return json({ success: false, error: 'Resume profile not found' }, { status: 404 })
    }

    const config = getAIConfig()
    const ai = createAI(config)
    const result = await ai.evaluate(profile, job)

    const assessment = assessmentDAO.create(result)
    return json({ success: true, data: assessment }, { status: 201 })
  } catch (e) {
    if (e instanceof AIConfigError) {
      return json({ success: false, error: e.message }, { status: 422 })
    }
    if (e instanceof AIServiceError) {
      return json({ success: false, error: e.message }, { status: 502 })
    }
    console.error('POST /api/ai/evaluate error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
