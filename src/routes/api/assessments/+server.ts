import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { assessmentDAO, candidateDAO, jobDAO } from '$lib/server/db'

export const GET: RequestHandler = ({ url }) => {
  try {
    const candidateId = url.searchParams.get('candidateId')
    const jobId = url.searchParams.get('jobId')

    let assessments
    if (candidateId && jobId) {
      assessments = assessmentDAO.getAll().filter(
        (a) => a.candidateId === candidateId && a.jobId === jobId
      )
    } else if (candidateId) {
      assessments = assessmentDAO.getByCandidateId(candidateId)
    } else if (jobId) {
      assessments = assessmentDAO.getByJobId(jobId)
    } else {
      assessments = assessmentDAO.getAll()
    }

    return json({ success: true, data: assessments })
  } catch (e) {
    console.error('GET /api/assessments error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

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
    const candidate = candidateDAO.getById(candidateId)
    if (!candidate) {
      return json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }

    const job = jobDAO.getById(jobId)
    if (!job) {
      return json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const assessment = assessmentDAO.create({
      candidateId,
      jobId,
      type: 'initial',
      parentId: null,
      scores: Array.isArray(data.scores)
        ? (data.scores as Array<{ name: unknown; weight: unknown; score: unknown }>).map((s) => ({
            name: String(s.name),
            weight: Number(s.weight),
            score: Number(s.score)
          }))
        : [],
      totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
      strengths: Array.isArray(data.strengths) ? (data.strengths as unknown[]).map(String) : [],
      weaknesses: Array.isArray(data.weaknesses) ? (data.weaknesses as unknown[]).map(String) : [],
      suggestions: Array.isArray(data.suggestions) ? (data.suggestions as unknown[]).map(String) : [],
      aiProvider: typeof data.aiProvider === 'string' ? data.aiProvider : 'manual'
    })
    return json({ success: true, data: assessment }, { status: 201 })
  } catch (e) {
    console.error('POST /api/assessments error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
