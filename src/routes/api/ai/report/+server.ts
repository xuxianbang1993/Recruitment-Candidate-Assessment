import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { assessmentDAO, candidateDAO, jobDAO } from '$lib/server/db'
import { createAI, AIServiceError } from '$lib/server/services/ai'
import { getAIConfig } from '../utils'

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
    !('assessmentId' in body)
  ) {
    return json({ success: false, error: 'Missing required field: assessmentId' }, { status: 400 })
  }

  const data = body as Record<string, unknown>
  const assessmentId = String(data.assessmentId)

  try {
    const assessment = assessmentDAO.getById(assessmentId)
    if (!assessment) {
      return json({ success: false, error: 'Assessment not found' }, { status: 404 })
    }

    const candidate = candidateDAO.getById(assessment.candidateId)
    if (!candidate) {
      return json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }

    const job = jobDAO.getById(assessment.jobId)
    if (!job) {
      return json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const config = getAIConfig()
    const ai = createAI(config)
    const report = await ai.generateReport(assessment, candidate, job)

    return json({ success: true, data: { report, assessmentId } })
  } catch (e) {
    if (e instanceof AIServiceError) {
      return json({ success: false, error: e.message }, { status: 502 })
    }
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }
}
