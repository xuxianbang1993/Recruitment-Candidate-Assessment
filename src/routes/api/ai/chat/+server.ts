import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { chatHistoryDAO } from '$lib/server/db'
import { createAI, AIServiceError } from '$lib/server/services/ai'
import type { Message } from '$lib/types'
import { getAIConfig, AIConfigError } from '../utils'

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
    !('messages' in body) ||
    !Array.isArray((body as Record<string, unknown>).messages)
  ) {
    return json({ success: false, error: 'Missing required field: messages (array)' }, { status: 400 })
  }

  const data = body as Record<string, unknown>
  const sessionId = typeof data.sessionId === 'string' ? data.sessionId : 'default'
  const allMessages = (data.messages as Array<{ role: unknown; content: unknown }>).map((m) => ({
    role: m.role as Message['role'],
    content: String(m.content)
  }))
  // Truncate to most recent 50 messages to avoid token overflow
  const messages = allMessages.slice(-50)

  try {
    const config = getAIConfig()
    const ai = createAI(config)
    const reply = await ai.chat(messages)

    // Save the last user message and the AI reply to history
    const lastUserMsg = messages.findLast((m) => m.role === 'user')
    if (lastUserMsg) {
      chatHistoryDAO.create(sessionId, { role: 'user', content: lastUserMsg.content })
    }
    chatHistoryDAO.create(sessionId, { role: 'assistant', content: reply })

    return json({ success: true, data: { reply, sessionId } })
  } catch (e) {
    if (e instanceof AIConfigError) {
      return json({ success: false, error: e.message }, { status: 422 })
    }
    if (e instanceof AIServiceError) {
      return json({ success: false, error: e.message }, { status: 502 })
    }
    console.error('POST /api/ai/chat error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
