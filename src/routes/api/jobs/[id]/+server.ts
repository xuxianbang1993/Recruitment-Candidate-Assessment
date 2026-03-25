import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { jobDAO } from '$lib/server/db'

export const GET: RequestHandler = ({ params }) => {
  try {
    const job = jobDAO.getById(params.id)
    if (!job) {
      return json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    return json({ success: true, data: job })
  } catch (e) {
    console.error('GET /api/jobs/[id] error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
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
    const existing = jobDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const data = body as Record<string, unknown>
    const update: Partial<Omit<typeof existing, 'id' | 'createdAt'>> = {}

    if ('title' in data) update.title = String(data.title)
    if ('department' in data) update.department = String(data.department)
    if ('category' in data) update.category = String(data.category)
    if ('description' in data) update.description = String(data.description)
    if ('requirements' in data && Array.isArray(data.requirements)) {
      update.requirements = (data.requirements as unknown[]).map(String)
    }
    if ('skills' in data && Array.isArray(data.skills)) {
      update.skills = (data.skills as unknown[]).map(String)
    }
    if ('weights' in data && Array.isArray(data.weights)) {
      update.weights = (data.weights as Array<{ name: unknown; weight: unknown; score: unknown }>).map((w) => ({
        name: String(w.name),
        weight: Number(w.weight),
        score: Number(w.score)
      }))
    }

    jobDAO.update(params.id, update)
    const updated = jobDAO.getById(params.id)
    return json({ success: true, data: updated })
  } catch (e) {
    console.error('PUT /api/jobs/[id] error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export const DELETE: RequestHandler = ({ params }) => {
  try {
    const existing = jobDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    jobDAO.delete(params.id)
    return new Response(null, { status: 204 })
  } catch (e) {
    console.error('DELETE /api/jobs/[id] error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
