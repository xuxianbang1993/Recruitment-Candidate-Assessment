import Anthropic from '@anthropic-ai/sdk'
import type { AIStrategy } from './ai-strategy'
import type { Message } from '$lib/types/ai'
import type { Candidate } from '$lib/types/candidate'
import type { Assessment, Job } from '$lib/types/assessment'
import { AIServiceError } from './errors'
import { buildEvaluationPrompt, buildReportPrompt } from './prompts'
import { safeParseEvaluation } from './evaluation-parser'

interface ClaudeConfig {
  apiKey: string
  model?: string
  baseURL?: string
}

export class ClaudeStrategy implements AIStrategy {
  readonly name = 'claude'
  private client: Anthropic
  private model: string

  constructor(config: ClaudeConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    })
    this.model = config.model || 'claude-sonnet-4-20250514'
  }

  async chat(messages: Message[]): Promise<string> {
    const systemMessages = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n')

    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

    if (chatMessages.length === 0) {
      throw new AIServiceError('至少需要一条用户消息', this.name)
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemMessages || undefined,
        messages: chatMessages
      })

      const block = response.content[0]
      return block.type === 'text' ? block.text : ''
    } catch (err) {
      if (err instanceof AIServiceError) throw err
      throw new AIServiceError('Claude chat 请求失败', this.name, err)
    }
  }

  async evaluate(
    candidate: Candidate,
    job: Job
  ): Promise<Omit<Assessment, 'id' | 'createdAt'>> {
    const prompt = buildEvaluationPrompt(candidate, job)

    let raw: string
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system:
          '你是一位专业的HR招聘评估专家。请严格按照JSON格式返回评估结果，不要添加任何额外说明。直接输出JSON对象，不要用markdown代码块包裹。',
        messages: [{ role: 'user', content: prompt }]
      })

      const block = response.content[0]
      raw = block.type === 'text' ? block.text : '{}'
    } catch (err) {
      throw new AIServiceError('Claude evaluate 请求失败', this.name, err)
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
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system:
          '你是一位专业的HR招聘评估专家。请生成结构清晰、内容专业的评估报告（Markdown格式）。',
        messages: [{ role: 'user', content: prompt }]
      })

      const block = response.content[0]
      return block.type === 'text' ? block.text : ''
    } catch (err) {
      throw new AIServiceError('Claude generateReport 请求失败', this.name, err)
    }
  }
}
