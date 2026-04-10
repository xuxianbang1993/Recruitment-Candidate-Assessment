import type { AIConfig, ResumeProfileFull } from '$lib/types'
import { resumeProfileDAO, settingsDAO } from '$lib/server/db'

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AIConfigError'
  }
}

export function getAIConfig(): AIConfig {
  const provider = settingsDAO.get('ai_provider') as AIConfig['provider'] | undefined
  const apiKey = settingsDAO.get('ai_api_key')
  const model = settingsDAO.get('ai_model')
  const baseUrl = settingsDAO.get('ai_base_url')

  if (!provider || !apiKey) {
    throw new AIConfigError('请先在设置中配置 AI 服务商和 API Key')
  }

  return { provider, apiKey, model: model ?? '', baseUrl: baseUrl || undefined }
}

/**
 * Loads the latest structured resume profile for a candidate within a specific job.
 */
export function getResumeProfileByCandidateAndJob(
  candidateId: string,
  jobId: string
): ResumeProfileFull | undefined {
  const profile = resumeProfileDAO
    .getByJobId(jobId)
    .find((item) => item.candidateId === candidateId)

  return profile ? resumeProfileDAO.getFullById(profile.id) : undefined
}
