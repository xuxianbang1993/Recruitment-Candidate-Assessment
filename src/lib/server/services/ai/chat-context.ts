import { jobDAO, candidateDAO, assessmentDAO } from '$lib/server/db'
import type { Job, Assessment } from '$lib/types/assessment'
import type { Candidate } from '$lib/types/candidate'

const MAX_RESUME_CHARS = 200
const MAX_ITEMS_PER_LIST = 3

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

function formatScoreSummary(assessment: Assessment): string {
  const dims = assessment.scores
    .map((s) => `${s.name}:${s.score}`)
    .join(', ')
  return `总分${assessment.totalScore}（${dims}）`
}

function formatCandidate(candidate: Candidate, assessments: Assessment[]): string {
  const parts: string[] = []
  parts.push(`  - ${candidate.name}`)
  if (candidate.skills.length > 0) {
    parts.push(`    技能：${candidate.skills.join('、')}`)
  }
  if (candidate.experience > 0) {
    parts.push(`    经验：${candidate.experience}年`)
  }
  if (candidate.education) {
    parts.push(`    学历：${candidate.education}`)
  }
  if (candidate.resumeText) {
    parts.push(`    简历摘要：${truncate(candidate.resumeText, MAX_RESUME_CHARS)}`)
  }

  const candidateAssessments = assessments.filter((a) => a.candidateId === candidate.id)
  for (const a of candidateAssessments) {
    parts.push(`    评估（${a.aiProvider}）：${formatScoreSummary(a)}`)
    if (a.strengths.length > 0) {
      parts.push(`      优势：${a.strengths.slice(0, MAX_ITEMS_PER_LIST).join('；')}`)
    }
    if (a.weaknesses.length > 0) {
      parts.push(`      不足：${a.weaknesses.slice(0, MAX_ITEMS_PER_LIST).join('；')}`)
    }
    if (a.suggestions.length > 0) {
      parts.push(`      建议：${a.suggestions.slice(0, MAX_ITEMS_PER_LIST).join('；')}`)
    }
  }

  return parts.join('\n')
}

function formatJob(job: Job, candidates: Candidate[], assessments: Assessment[]): string {
  const parts: string[] = []
  parts.push(`### ${job.title}（${job.department}）`)
  if (job.description) {
    parts.push(`描述：${truncate(job.description, 100)}`)
  }
  if (job.skills.length > 0) {
    parts.push(`技能要求：${job.skills.join('、')}`)
  }
  if (job.weights.length > 0) {
    parts.push(`评估维度：${job.weights.map((w) => `${w.name}(${w.weight}%)`).join('、')}`)
  }

  const jobCandidates = candidates.filter((c) => c.jobId === job.id)
  if (jobCandidates.length > 0) {
    parts.push(`候选人（${jobCandidates.length}人）：`)
    for (const c of jobCandidates) {
      parts.push(formatCandidate(c, assessments))
    }
  } else {
    parts.push('候选人：暂无')
  }

  return parts.join('\n')
}

/** Build a system prompt containing all DB context for the AI chat assistant */
export function buildChatContext(): string {
  const jobs = jobDAO.getAll()
  const candidates = candidateDAO.getAll()
  const assessments = assessmentDAO.getAll()

  const totalCandidates = candidates.length
  const totalAssessments = assessments.length
  const avgScore = totalAssessments > 0
    ? Math.round(assessments.reduce((s, a) => s + a.totalScore, 0) / totalAssessments)
    : 0
  const maxScore = totalAssessments > 0
    ? Math.max(...assessments.map((a) => a.totalScore))
    : 0

  const sections: string[] = []

  sections.push(`你是"智聘评估"招聘智能评估系统的 AI 助手。你可以访问系统中的所有数据，包括岗位需求、候选人信息、AI评估结果和匹配报告。请基于这些真实数据回答用户问题，提供专业的招聘洞察和建议。回答时使用 Markdown 格式以便阅读。`)

  sections.push(`\n## 数据概览\n- 岗位数量：${jobs.length}\n- 候选人总数：${totalCandidates}\n- 评估记录：${totalAssessments}\n- 平均评分：${avgScore}\n- 最高评分：${maxScore}`)

  if (jobs.length > 0) {
    sections.push('\n## 岗位与候选人详情')
    for (const job of jobs) {
      sections.push(formatJob(job, candidates, assessments))
    }
  }

  // Candidates without a job (edge case)
  const orphanCandidates = candidates.filter((c) => !c.jobId || !jobs.some((j) => j.id === c.jobId))
  if (orphanCandidates.length > 0) {
    sections.push('\n## 未分配岗位的候选人')
    for (const c of orphanCandidates) {
      sections.push(formatCandidate(c, assessments))
    }
  }

  return sections.join('\n')
}
