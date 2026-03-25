import { json } from '@sveltejs/kit'

export async function parseRequestBody(request: Request): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  try {
    const data = await request.json()
    return { ok: true, data }
  } catch {
    return { ok: false, response: json({ success: false, error: 'Invalid JSON body' }, { status: 400 }) }
  }
}

export function errorResponse(message: string, status: number): Response {
  return json({ success: false, error: message }, { status })
}
