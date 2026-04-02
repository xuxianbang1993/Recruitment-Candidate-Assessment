import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { assessmentDAO, attachmentDAO, candidateDAO, jobDAO } from '$lib/server/db'
import { createAI, AIServiceError } from '$lib/server/services/ai'
import { buildReEvaluationPrompt } from '$lib/server/services/ai/prompts'
import { safeParseEvaluation } from '$lib/server/services/ai/evaluation-parser'
import { getAIConfig, AIConfigError } from '../../../ai/utils'

export const POST: RequestHandler = async ({ params }) => {
  try {
    const assessment = assessmentDAO.getById(params.id)
    if (!assessment) {
      return json({ success: false, error: 'Assessment not found' }, { status: 404 })
    }

    const candidate = candidateDAO.getById(assessment.candidateId)
    if (!candidate) {
      return json({ success: false, error: 'Candidate not found' }, { status: 404 })
    }

    const job = jobDAO.getById(assessment.jobId)
    if (!job) {
      return json({ success: false, error: 'Job not found' }, { status: 404 })
    }

    const attachments = attachmentDAO.getByAssessmentId(params.id)
    const attachmentTexts = attachments
      .map((attachment) => attachment.textContent)
      .filter((text): text is string => text !== null && text.length > 0)

    if (attachmentTexts.length === 0) {
      return json({ success: false, error: '无可分析的附件文本内容' }, { status: 400 })
    }

    const config = getAIConfig()
    const ai = createAI(config)
    const prompt = buildReEvaluationPrompt(candidate, job, assessment, attachmentTexts)
    const rawResponse = await ai.chat([{ role: 'user', content: prompt }])
    const parsed = safeParseEvaluation(rawResponse, job)

    const comprehensive = assessmentDAO.create({
      candidateId: assessment.candidateId,
      jobId: assessment.jobId,
      scores: parsed.scores,
      totalScore: parsed.totalScore,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      suggestions: parsed.suggestions,
      aiProvider: config.provider,
      type: 'comprehensive',
      parentId: assessment.id,
    })

    return json({ success: true, data: comprehensive }, { status: 201 })
  } catch (e) {
    if (e instanceof AIConfigError) {
      return json({ success: false, error: e.message }, { status: 422 })
    }
    if (e instanceof AIServiceError) {
      return json({ success: false, error: e.message }, { status: 502 })
    }
    console.error('POST re-evaluate error:', e)
    return json({ success: false, error: '综合评估失败' }, { status: 500 })
  }
}
