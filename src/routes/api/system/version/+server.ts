import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { getVersionInfo } from '$lib/server/services/updater'

export const GET: RequestHandler = async () => {
  try {
    const info = await getVersionInfo()
    return json({ success: true, data: info })
  } catch (e) {
    console.error('GET /api/system/version error:', e)
    return json({ success: false, error: '获取版本信息失败' }, { status: 500 })
  }
}
