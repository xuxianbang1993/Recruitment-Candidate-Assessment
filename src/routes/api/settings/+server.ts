import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { settingsDAO } from '$lib/server/db'

function maskSensitive(key: string, value: string): string {
  if ((key.includes('key') || key.includes('secret')) && value.length > 8) {
    return value.slice(0, 4) + '****' + value.slice(-4)
  }
  return value
}

export const GET: RequestHandler = () => {
  try {
    const all = settingsDAO.getAll()
    const masked: Record<string, string> = {}
    for (const [k, v] of Object.entries(all)) {
      masked[k] = maskSensitive(k, v)
    }
    return json({ success: true, data: masked })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }
}

export const PUT: RequestHandler = async ({ request }) => {
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
    const updates = body as Record<string, unknown>
    for (const [key, value] of Object.entries(updates)) {
      const strValue = String(value)
      // Skip masked values (user did not change the key)
      if (strValue.includes('****')) continue
      settingsDAO.set(key, strValue)
    }

    const all = settingsDAO.getAll()
    const masked: Record<string, string> = {}
    for (const [k, v] of Object.entries(all)) {
      masked[k] = maskSensitive(k, v)
    }
    return json({ success: true, data: masked })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return json({ success: false, error: message }, { status: 500 })
  }
}
