import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { checkForUpdates, applyUpdate } from '$lib/server/services/updater'

/** Check for available updates */
export const GET: RequestHandler = async () => {
  try {
    const info = await checkForUpdates()
    return json({ success: true, data: info })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GET /api/system/update error:', msg)
    return json({ success: false, error: `检查更新失败：${msg}` }, { status: 500 })
  }
}

/** Apply the update */
export const POST: RequestHandler = async () => {
  try {
    const result = await applyUpdate()
    return json({ success: true, data: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('POST /api/system/update error:', msg)
    return json({ success: false, error: `更新失败：${msg}` }, { status: 500 })
  }
}
