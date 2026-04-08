import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { unlinkSync } from 'fs'
import { candidateDAO, getDatabase } from '$lib/server/db'

export const GET: RequestHandler = ({ params }) => {
  try {
    const candidate = candidateDAO.getById(params.id)
    if (!candidate) {
      return json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }
    return json({ success: true, data: candidate })
  } catch (e) {
    console.error('GET /api/candidates/[id] error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export const PUT: RequestHandler = async ({ params, request }) => {
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
    const existing = candidateDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }

    const data = body as Record<string, unknown>
    const update: Partial<Omit<typeof existing, 'id' | 'createdAt'>> = {}

    if ('name' in data) update.name = String(data.name)
    if ('phone' in data) update.phone = String(data.phone)
    if ('email' in data) update.email = String(data.email)
    if ('jobId' in data) update.jobId = String(data.jobId)
    if ('resumeText' in data) update.resumeText = String(data.resumeText)
    if ('education' in data) update.education = String(data.education)
    if ('experience' in data) update.experience = Number(data.experience)
    if ('skills' in data && Array.isArray(data.skills)) {
      update.skills = (data.skills as unknown[]).map(String)
    }

    candidateDAO.update(params.id, update)
    const updated = candidateDAO.getById(params.id)
    return json({ success: true, data: updated })
  } catch (e) {
    console.error('PUT /api/candidates/[id] error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export const DELETE: RequestHandler = ({ params }) => {
  try {
    const existing = candidateDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }

    // 查询该候选人关联的附件文件路径（在 CASCADE 删除前）
    const db = getDatabase()
    const filePaths = db
      .prepare(
        `SELECT a.file_path FROM attachments a
         JOIN assessments ass ON a.assessment_id = ass.id
         WHERE ass.candidate_id = ?`
      )
      .all(params.id) as { file_path: string }[]

    // 删除候选人（CASCADE 自动清理 assessments + attachments 记录）
    candidateDAO.delete(params.id)

    // 清理磁盘上的附件文件
    for (const { file_path } of filePaths) {
      try { unlinkSync(file_path) } catch { /* 文件可能已不存在 */ }
    }

    return new Response(null, { status: 204 })
  } catch (e) {
    console.error('DELETE /api/candidates/[id] error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
