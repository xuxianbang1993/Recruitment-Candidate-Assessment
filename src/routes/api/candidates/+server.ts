import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { candidateDAO } from '$lib/server/db'

export const GET: RequestHandler = ({ url }) => {
  try {
    const keyword = url.searchParams.get('keyword')
    const candidates = keyword ? candidateDAO.search(keyword) : candidateDAO.getAll()
    return json({ success: true, data: candidates })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
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
    !('name' in body) ||
    !('phone' in body) ||
    !('email' in body) ||
    !('position' in body) ||
    !('resumeText' in body)
  ) {
    return json(
      { success: false, error: 'Missing required fields: name, phone, email, position, resumeText' },
      { status: 400 }
    )
  }

  const data = body as Record<string, unknown>

  try {
    const candidate = candidateDAO.create({
      name: String(data.name),
      phone: String(data.phone),
      email: String(data.email),
      position: String(data.position),
      resumeText: String(data.resumeText),
      skills: Array.isArray(data.skills) ? (data.skills as string[]).map(String) : [],
      experience: typeof data.experience === 'number' ? data.experience : 0,
      education: typeof data.education === 'string' ? data.education : ''
    })
    return json({ success: true, data: candidate }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }
}
