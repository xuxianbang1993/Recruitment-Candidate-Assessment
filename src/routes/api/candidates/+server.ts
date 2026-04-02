import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { candidateDAO, getDatabase } from '$lib/server/db'
import { unlinkSync } from 'fs'

export const GET: RequestHandler = ({ url }) => {
  try {
    const keyword = url.searchParams.get('keyword')
    const candidates = keyword ? candidateDAO.search(keyword) : candidateDAO.getAll()
    return json({ success: true, data: candidates })
  } catch (e) {
    console.error('GET /api/candidates error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

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
    !('name' in body) ||
    !('phone' in body) ||
    !('email' in body) ||
    !('position' in body) ||
    !('resumeText' in body)
  ) {
    return json(
      { success: false, error: 'Missing required fields: name, phone, email, position, resumeText' },
      { status: 400 }
    )
  }

  const data = body as Record<string, unknown>

  const email = String(data.email)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: '邮箱格式不正确' }, { status: 400 })
  }

  try {
    const candidate = candidateDAO.create({
      name: String(data.name),
      phone: String(data.phone),
      email: String(data.email),
      position: String(data.position),
      resumeText: String(data.resumeText),
      skills: Array.isArray(data.skills) ? (data.skills as string[]).map(String) : [],
      experience: typeof data.experience === 'number' ? data.experience : 0,
      education: typeof data.education === 'string' ? data.education : ''
    })
    return json({ success: true, data: candidate }, { status: 201 })
  } catch (e) {
    console.error('POST /api/candidates error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

export const DELETE: RequestHandler = () => {
  try {
    const db = getDatabase()

    // 1. 查询所有附件文件路径（在 CASCADE 删除前）
    const filePaths = db
      .prepare(
        `SELECT a.file_path FROM attachments a
         JOIN assessments ass ON a.assessment_id = ass.id
         JOIN candidates c ON ass.candidate_id = c.id`
      )
      .all() as { file_path: string }[]

    // 2. 删除候选人（CASCADE 自动清理 assessments + attachments 记录）
    const count = candidateDAO.deleteAll()

    // 3. 清理磁盘上的附件文件
    for (const { file_path } of filePaths) {
      try { unlinkSync(file_path) } catch { /* 文件可能已不存在 */ }
    }

    return json({ success: true, data: { deleted: count } })
  } catch (e) {
    console.error('DELETE /api/candidates error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
