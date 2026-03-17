import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { settingsDAO } from '$lib/server/db'

const ALLOWED_KEYS = new Set(['ai_provider', 'ai_api_key', 'ai_model', 'ai_base_url'])

function maskSensitive(key: string, value: string): string {
  if ((key.includes('key') || key.includes('secret')) && value.length > 4) {
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
    console.error('GET /api/settings error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
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
      if (!ALLOWED_KEYS.has(key)) continue
      const strValue = String(value)
      // Skip masked values: read current value, mask it, compare with submitted
      const currentValue = settingsDAO.get(key)
      if (currentValue !== undefined && maskSensitive(key, currentValue) === strValue) continue
      settingsDAO.set(key, strValue)
    }

    const all = settingsDAO.getAll()
    const masked: Record<string, string> = {}
    for (const [k, v] of Object.entries(all)) {
      masked[k] = maskSensitive(k, v)
    }
    return json({ success: true, data: masked })
  } catch (e) {
    console.error('PUT /api/settings error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
