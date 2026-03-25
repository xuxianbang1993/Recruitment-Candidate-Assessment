import type { AIConfig } from '$lib/types/ai'
import type { AIStrategy } from './ai-strategy'
import { OpenAIStrategy } from './openai'
import { ClaudeStrategy } from './claude'
import { DeepSeekStrategy } from './deepseek'

export function createAI(config: AIConfig): AIStrategy {
  switch (config.provider) {
    case 'openai':
      return new OpenAIStrategy({
        apiKey: config.apiKey,
        model: config.model,
        baseURL: config.baseUrl
      })
    case 'claude':
      return new ClaudeStrategy({
        apiKey: config.apiKey,
        model: config.model,
        baseURL: config.baseUrl
      })
    case 'deepseek':
      return new DeepSeekStrategy({
        apiKey: config.apiKey,
        model: config.model,
        baseURL: config.baseUrl
      })
    default:
      throw new Error(`Unknown AI provider: ${(config as AIConfig).provider}`)
  }
}
