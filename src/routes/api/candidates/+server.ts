import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { unlinkSync } from 'fs'
import { candidateDAO, getDatabase } from '$lib/server/db'

export const GET: RequestHandler = ({ url }) => {
  try {
    const keyword = url.searchParams.get('keyword')
    const jobId = url.searchParams.get('jobId')

    let candidates
    if (keyword) {
      candidates = candidateDAO.search(keyword, jobId ?? undefined)
    } else if (jobId) {
      candidates = candidateDAO.getByJobId(jobId)
    } else {
      candidates = candidateDAO.getAll()
    }

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
    !('jobId' in body) ||
    !('resumeText' in body)
  ) {
    return json(
      { success: false, error: 'Missing required fields: name, jobId, resumeText' },
      { status: 400 }
    )
  }

  const data = body as Record<string, unknown>

  const email = String(data.email ?? '')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: '邮箱格式不正确' }, { status: 400 })
  }

  try {
    const candidate = candidateDAO.create({
      jobId: String(data.jobId),
      name: String(data.name),
      phone: String(data.phone ?? ''),
      email,
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

export const DELETE: RequestHandler = ({ url }) => {
  try {
    const jobId = url.searchParams.get('jobId')
    const db = getDatabase()

    // 1. 查询附件文件路径（在 CASCADE 删除前），按 jobId 过滤
    const attachmentQuery = jobId
      ? `SELECT a.file_path FROM attachments a
         JOIN assessments ass ON a.assessment_id = ass.id
         JOIN candidates c ON ass.candidate_id = c.id
         WHERE c.job_id = ?`
      : `SELECT a.file_path FROM attachments a
         JOIN assessments ass ON a.assessment_id = ass.id
         JOIN candidates c ON ass.candidate_id = c.id`
    const filePaths = (jobId
      ? db.prepare(attachmentQuery).all(jobId)
      : db.prepare(attachmentQuery).all()
    ) as { file_path: string }[]

    // 2. 删除候选人（CASCADE 自动清理 assessments + attachments 记录）
    const count = jobId
      ? candidateDAO.deleteByJobId(jobId)
      : candidateDAO.deleteAll()

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
