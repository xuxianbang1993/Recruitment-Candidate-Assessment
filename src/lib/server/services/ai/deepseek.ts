import OpenAI from 'openai'
import type { AIStrategy } from './ai-strategy'
import type { Message } from '$lib/types/ai'
import type { Candidate } from '$lib/types/candidate'
import type { Assessment, Job, ScoreDimension } from '$lib/types/assessment'

interface DeepSeekConfig {
  apiKey: string
  model?: string
  baseURL?: string
}

interface EvaluationResult {
  scores: ScoreDimension[]
  totalScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export class DeepSeekStrategy implements AIStrategy {
  readonly name = 'deepseek'
  private client: OpenAI
  private model: string

  constructor(config: DeepSeekConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.deepseek.com'
    })
    this.model = config.model || 'deepseek-chat'
  }

  async chat(messages: Message[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
    return completion.choices[0].message.content || ''
  }

  async evaluate(
    candidate: Candidate,
    job: Job
  ): Promise<Omit<Assessment, 'id' | 'createdAt'>> {
    const prompt = buildEvaluationPrompt(candidate, job)

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            '你是一位专业的HR招聘评估专家。请严格按照JSON格式返回评估结果，不要添加任何额外说明。直接输出JSON对象，不要用markdown代码块包裹。'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })

    const raw = completion.choices[0].message.content || '{}'
    const result = safeParseEvaluation(raw, job)

    return {
      candidateId: candidate.id,
      jobId: job.id,
      scores: result.scores,
      totalScore: result.totalScore,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.suggestions,
      aiProvider: this.name
    }
  }

  async generateReport(
    assessment: Assessment,
    candidate: Candidate,
    job: Job
  ): Promise<string> {
    const prompt = buildReportPrompt(assessment, candidate, job)

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            '你是一位专业的HR招聘评估专家。请生成结构清晰、内容专业的评估报告（Markdown格式）。'
        },
        { role: 'user', content: prompt }
      ]
    })

    return completion.choices[0].message.content || ''
  }
}

function buildEvaluationPrompt(candidate: Candidate, job: Job): string {
  const dimensionsList = job.weights
    .map(d => `- ${d.name}（权重${d.weight}%）`)
    .join('\n')

  return `请对以下候选人进行招聘评估，返回JSON格式结果。

## 候选人信息
- 姓名：${candidate.name}
- 应聘职位：${candidate.position}
- 教育背景：${candidate.education}
- 工作年限：${candidate.experience}年
- 技能：${candidate.skills.join('、')}
- 简历内容：
${candidate.resumeText}

## 岗位要求
- 职位名称：${job.title}
- 所属部门：${job.department}
- 岗位描述：${job.description}
- 任职要求：
${job.requirements.map(r => '  - ' + r).join('\n')}
- 期望技能：${job.skills.join('、')}

## 评分维度（满分100）
${dimensionsList}

## 返回格式（严格JSON，直接输出对象）
{
  "scores": [
    { "name": "维度名称", "weight": 权重数字, "score": 0-100分 }
  ],
  "totalScore": 加权总分,
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["建议1", "建议2"]
}`
}

function buildReportPrompt(
  assessment: Assessment,
  candidate: Candidate,
  job: Job
): string {
  const scoresSummary = assessment.scores
    .map(s => `- ${s.name}：${s.score}分（权重${s.weight}%）`)
    .join('\n')

  return `请根据以下评估数据，生成一份专业的招聘评估报告（Markdown格式）。

## 候选人
- 姓名：${candidate.name}
- 应聘职位：${job.title}（${job.department}）

## 评分结果
- 综合得分：${assessment.totalScore}分
${scoresSummary}

## 优势
${assessment.strengths.map(s => '- ' + s).join('\n')}

## 不足
${assessment.weaknesses.map(w => '- ' + w).join('\n')}

## 建议
${assessment.suggestions.map(s => '- ' + s).join('\n')}

请输出完整报告，包含：执行摘要、各维度详细分析、综合结论、用人建议。`
}

function safeParseEvaluation(raw: string, job: Job): EvaluationResult {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<EvaluationResult>

    const scores: ScoreDimension[] = Array.isArray(parsed.scores)
      ? parsed.scores
          .filter(
            s =>
              s &&
              typeof s.name === 'string' &&
              typeof s.weight === 'number' &&
              typeof s.score === 'number'
          )
          .map(s => ({
            name: s.name,
            weight: Math.min(100, Math.max(0, s.weight)),
            score: Math.min(100, Math.max(0, s.score))
          }))
      : job.weights.map(d => ({ name: d.name, weight: d.weight, score: 0 }))

    const totalScore =
      typeof parsed.totalScore === 'number'
        ? Math.min(100, Math.max(0, parsed.totalScore))
        : calcWeightedScore(scores)

    return {
      scores,
      totalScore,
      strengths: toStringArray(parsed.strengths),
      weaknesses: toStringArray(parsed.weaknesses),
      suggestions: toStringArray(parsed.suggestions)
    }
  } catch {
    const defaultScores = job.weights.map(d => ({
      name: d.name,
      weight: d.weight,
      score: 0
    }))
    return {
      scores: defaultScores,
      totalScore: 0,
      strengths: [],
      weaknesses: ['AI解析失败，请重新评估'],
      suggestions: ['请手动填写评估结果']
    }
  }
}

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter(s => typeof s === 'string')
}

function calcWeightedScore(scores: ScoreDimension[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
  if (totalWeight === 0) return 0
  const weighted = scores.reduce((sum, s) => sum + (s.score * s.weight) / totalWeight, 0)
  return Math.round(weighted)
}
