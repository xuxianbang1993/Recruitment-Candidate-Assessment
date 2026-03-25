import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { jobDAO } from '$lib/server/db'

export const GET: RequestHandler = ({ url }) => {
  try {
    const keyword = url.searchParams.get('keyword')
    const jobs = keyword ? jobDAO.search(keyword) : jobDAO.getAll()
    return json({ success: true, data: jobs })
  } catch (e) {
    console.error('GET /api/jobs error:', e)
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
    !('title' in body) ||
    !('department' in body) ||
    !('description' in body)
  ) {
    return json(
      { success: false, error: 'Missing required fields: title, department, description' },
      { status: 400 }
    )
  }

  const data = body as Record<string, unknown>

  try {
    const job = jobDAO.create({
      title: String(data.title),
      department: String(data.department),
      category: typeof data.category === 'string' ? data.category : '',
      description: String(data.description),
      requirements: Array.isArray(data.requirements) ? (data.requirements as unknown[]).map(String) : [],
      skills: Array.isArray(data.skills) ? (data.skills as unknown[]).map(String) : [],
      weights: Array.isArray(data.weights)
        ? (data.weights as Array<{ name: unknown; weight: unknown; score: unknown }>).map((w) => ({
            name: String(w.name),
            weight: Number(w.weight),
            score: Number(w.score)
          }))
        : []
    })
    return json({ success: true, data: job }, { status: 201 })
  } catch (e) {
    console.error('POST /api/jobs error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
