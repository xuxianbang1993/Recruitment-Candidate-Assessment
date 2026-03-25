import type { Message } from '$lib/types/ai'
import type { Candidate } from '$lib/types/candidate'
import type { Assessment, Job } from '$lib/types/assessment'

export interface AIStrategy {
  readonly name: string
  chat(messages: Message[]): Promise<string>
  evaluate(candidate: Candidate, job: Job): Promise<Omit<Assessment, 'id' | 'createdAt'>>
  generateReport(assessment: Assessment, candidate: Candidate, job: Job): Promise<string>
}
