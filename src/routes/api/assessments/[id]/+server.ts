import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { assessmentDAO } from '$lib/server/db'

export const GET: RequestHandler = ({ params }) => {
  try {
    const assessment = assessmentDAO.getById(params.id)
    if (!assessment) {
      return json({ success: false, error: 'Assessment not found' }, { status: 404 })
    }
    return json({ success: true, data: assessment })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }
}

export const PUT: RequestHandler = async ({ params, request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return json({ success: false, error: 'Request body must be an object' }, { status: 400 })
  }

  try {
    const existing = assessmentDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Assessment not found' }, { status: 404 })
    }

    const data = body as Record<string, unknown>
    const update: Partial<Omit<typeof existing, 'id' | 'createdAt'>> = {}

    if ('candidateId' in data) update.candidateId = String(data.candidateId)
    if ('jobId' in data) update.jobId = String(data.jobId)
    if ('totalScore' in data) update.totalScore = Number(data.totalScore)
    if ('aiProvider' in data) update.aiProvider = String(data.aiProvider)
    if ('scores' in data && Array.isArray(data.scores)) {
      update.scores = (data.scores as Array<{ name: unknown; weight: unknown; score: unknown }>).map((s) => ({
        name: String(s.name),
        weight: Number(s.weight),
        score: Number(s.score)
      }))
    }
    if ('strengths' in data && Array.isArray(data.strengths)) {
      update.strengths = (data.strengths as unknown[]).map(String)
    }
    if ('weaknesses' in data && Array.isArray(data.weaknesses)) {
      update.weaknesses = (data.weaknesses as unknown[]).map(String)
    }
    if ('suggestions' in data && Array.isArray(data.suggestions)) {
      update.suggestions = (data.suggestions as unknown[]).map(String)
    }

    assessmentDAO.update(params.id, update)
    const updated = assessmentDAO.getById(params.id)
    return json({ success: true, data: updated })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }
}

export const DELETE: RequestHandler = ({ params }) => {
  try {
    const existing = assessmentDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Assessment not found' }, { status: 404 })
    }
    assessmentDAO.delete(params.id)
    return json({ success: true, data: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }
}
