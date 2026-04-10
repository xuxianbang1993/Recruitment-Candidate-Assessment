import type { Message } from '$lib/types'
import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { resumeProfileDAO } from '$lib/server/db'
import { createAI, AIServiceError } from '$lib/server/services/ai'
import { reparseProfile } from '$lib/server/services/resume/resume-profile-service'
import { AIConfigError, getAIConfig } from '../../../ai/utils'

/**
 * Re-runs AI parsing for an existing resume profile.
 */
export const POST: RequestHandler = async ({ params }) => {
  try {
    const existing = resumeProfileDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Resume profile not found' }, { status: 404 })
    }

    const config = getAIConfig()
    const ai = createAI(config)
    const aiChat = (messages: Array<{ role: string; content: string }>): Promise<string> =>
      ai.chat(
        messages.map(
          (message): Message => ({
            role:
              message.role === 'assistant' || message.role === 'system'
                ? message.role
                : 'user',
            content: message.content
          })
        )
      )
    const profile = await reparseProfile(params.id, aiChat)

    return json({ success: true, data: profile })
  } catch (error) {
    if (error instanceof AIConfigError) {
      return json({ success: false, error: error.message }, { status: 422 })
    }
    if (error instanceof AIServiceError) {
      return json({ success: false, error: error.message }, { status: 502 })
    }

    console.error('POST /api/resume-profiles/[id]/reparse error:', error)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
