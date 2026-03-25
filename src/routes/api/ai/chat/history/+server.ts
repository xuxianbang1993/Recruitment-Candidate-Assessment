import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { chatHistoryDAO } from '$lib/server/db'

export const GET: RequestHandler = ({ url }) => {
  let sessionId = url.searchParams.get('sessionId')
  if (!sessionId) {
    return json({ success: false, error: 'sessionId is required' }, { status: 400 })
  }
  if (sessionId) sessionId = sessionId.slice(0, 128)

  try {
    const history = chatHistoryDAO.getBySessionId(sessionId)
    return json({ success: true, data: history })
  } catch (e) {
    console.error('GET /api/ai/chat/history error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export const DELETE: RequestHandler = ({ url }) => {
  let sessionId = url.searchParams.get('sessionId')
  if (!sessionId) {
    return json({ success: false, error: 'sessionId is required' }, { status: 400 })
  }
  if (sessionId) sessionId = sessionId.slice(0, 128)

  try {
    chatHistoryDAO.deleteSession(sessionId)
    return new Response(null, { status: 204 })
  } catch (e) {
    console.error('DELETE /api/ai/chat/history error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
