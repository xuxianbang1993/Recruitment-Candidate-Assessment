import type { Message } from '$lib/types/ai'
import type { Assessment, Job } from '$lib/types/assessment'
import type { ResumeProfileFull } from '$lib/types'

export interface AIStrategy {
  readonly name: string
  chat(messages: Message[]): Promise<string>
  evaluate(profile: ResumeProfileFull, job: Job): Promise<Omit<Assessment, 'id' | 'createdAt'>>
  generateReport(assessment: Assessment, profile: ResumeProfileFull, job: Job): Promise<string>
}
