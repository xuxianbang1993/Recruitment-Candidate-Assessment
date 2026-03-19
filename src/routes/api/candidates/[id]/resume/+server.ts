import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { candidateDAO } from '$lib/server/db'

export const DELETE: RequestHandler = ({ params }) => {
  try {
    const existing = candidateDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }
    candidateDAO.update(params.id, { resumeText: '' })
    return new Response(null, { status: 204 })
  } catch (e) {
    console.error('DELETE /api/candidates/[id]/resume error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
