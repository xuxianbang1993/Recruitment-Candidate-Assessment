export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIConfig {
  provider: 'openai' | 'claude' | 'deepseek'
  apiKey: string
  model: string
  baseUrl?: string
}
