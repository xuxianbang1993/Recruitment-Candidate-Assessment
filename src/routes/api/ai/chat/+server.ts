import type { RequestHandler } from './$types'
import type { Message } from '$lib/types'
import { json } from '@sveltejs/kit'
import { chatHistoryDAO } from '$lib/server/db'
import { createAI, AIServiceError } from '$lib/server/services/ai'
import { buildChatContext } from '$lib/server/services/ai/chat-context'
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
  let sessionId = typeof data.sessionId === 'string' ? data.sessionId : 'default'
  if (sessionId) sessionId = sessionId.slice(0, 128)
  // Filter to only allowed roles — prevent client-injected 'system' messages
  const allowedRoles = new Set<Message['role']>(['user', 'assistant'])
  const allMessages = (data.messages as Array<{ role: unknown; content: unknown }>)
    .filter((m) => allowedRoles.has(m.role as Message['role']))
    .map((m) => ({
      role: m.role as Message['role'],
      content: String(m.content)
    }))
  // Truncate to most recent 50 messages to avoid token overflow
  const messages = allMessages.slice(-50)

  try {
    const config = getAIConfig()
    const ai = createAI(config)

    // Inject system prompt with database context
    const systemPrompt = buildChatContext()
    const messagesWithContext: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    const reply = await ai.chat(messagesWithContext)

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
