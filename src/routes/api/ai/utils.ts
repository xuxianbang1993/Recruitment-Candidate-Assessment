import { settingsDAO } from '$lib/server/db'
import type { AIConfig } from '$lib/types'

export function getAIConfig(): AIConfig {
  const provider = settingsDAO.get('ai_provider') as AIConfig['provider'] | undefined
  const apiKey = settingsDAO.get('ai_api_key')
  const model = settingsDAO.get('ai_model')
  const baseUrl = settingsDAO.get('ai_base_url')

  if (!provider || !apiKey) {
    throw new Error('请先在设置中配置 AI 服务商和 API Key')
  }

  return { provider, apiKey, model: model ?? '', baseUrl: baseUrl || undefined }
}
