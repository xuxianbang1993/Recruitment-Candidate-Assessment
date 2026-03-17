import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { candidateDAO, jobDAO, assessmentDAO } from '$lib/server/db'

export const GET: RequestHandler = () => {
  try {
    const candidates = candidateDAO.getAll()
    const jobs = jobDAO.getAll()
    const assessments = assessmentDAO.getAll()

    const totalCandidates = candidates.length
    const totalJobs = jobs.length
    const totalAssessments = assessments.length
    const avgScore =
      assessments.length > 0
        ? assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length
        : 0

    return json({
      success: true,
      data: { totalCandidates, totalJobs, totalAssessments, avgScore },
    })
  } catch (e) {
    console.error('GET /api/stats error:', e)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
