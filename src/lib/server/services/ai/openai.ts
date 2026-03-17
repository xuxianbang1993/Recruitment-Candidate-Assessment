import OpenAI from 'openai'
import type { AIStrategy } from './ai-strategy'
import type { Message } from '$lib/types/ai'
import type { Candidate } from '$lib/types/candidate'
import type { Assessment, Job } from '$lib/types/assessment'
import { AIServiceError } from './errors'
import { buildEvaluationPrompt, buildReportPrompt } from './prompts'
import { safeParseEvaluation } from './evaluation-parser'

interface OpenAIConfig {
  apiKey: string
  model?: string
  baseURL?: string
}

export class OpenAIStrategy implements AIStrategy {
  readonly name = 'openai'
  private client: OpenAI
  private model: string

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    })
    this.model = config.model || 'gpt-4o-mini'
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
      return completion.choices[0].message.content || ''
    } catch (err) {
      throw new AIServiceError('OpenAI chat 请求失败', this.name, err)
    }
  }

  async evaluate(
    candidate: Candidate,
    job: Job
  ): Promise<Omit<Assessment, 'id' | 'createdAt'>> {
    const prompt = buildEvaluationPrompt(candidate, job)

    let raw: string
    try {
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
      raw = completion.choices[0].message.content || '{}'
    } catch (err) {
      throw new AIServiceError('OpenAI evaluate 请求失败', this.name, err)
    }

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

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的HR招聘评估专家。请生成结构清晰、内容专业的评估报告（Markdown格式）。'
          },
          { role: 'user', content: prompt }
        ]
      })
      return completion.choices[0].message.content || ''
    } catch (err) {
      throw new AIServiceError('OpenAI generateReport 请求失败', this.name, err)
    }
  }
}
