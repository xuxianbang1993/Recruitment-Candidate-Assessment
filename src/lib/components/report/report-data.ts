import { JOB_TEMPLATES, type JobCategory } from '$lib/config/job-templates'
import type { ScoreDimension } from '$lib/types/assessment'

export interface InterviewTip {
  name: string
  score: number
  questions: string[]
  highlight: boolean
}

function getTemplate(category?: string) {
  if (!category) return undefined
  return JOB_TEMPLATES[category as JobCategory]
}

export function getDimensionDefinition(category: string | undefined, dimName: string): string {
  return getTemplate(category)?.dimensions.find((dimension) => dimension.name === dimName)?.definition ?? ''
}

export function getInterviewTips(
  category: string | undefined,
  scores: ScoreDimension[] | undefined,
): InterviewTip[] {
  const template = getTemplate(category)
  if (!template || !scores) return []

  return scores
    .map((score) => {
      const dimension = template.dimensions.find((item) => item.name === score.name)
      if (!dimension) return null

      return {
        name: score.name,
        score: score.score,
        questions: dimension.questions,
        highlight: score.score <= 60,
      }
    })
    .filter((tip): tip is InterviewTip => tip !== null)
    .sort((left, right) => left.score - right.score)
}
