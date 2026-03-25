import type { Job, ScoreDimension } from '$lib/types/assessment'

export interface EvaluationResult {
  scores: ScoreDimension[]
  totalScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export function safeParseEvaluation(raw: string, job: Job): EvaluationResult {
  try {
    // Strip possible markdown code block wrapping (e.g. ```json ... ```)
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
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

export function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter(s => typeof s === 'string')
}

export function calcWeightedScore(scores: ScoreDimension[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
  if (totalWeight === 0) return 0
  const weighted = scores.reduce((sum, s) => sum + (s.score * s.weight) / totalWeight, 0)
  return Math.round(weighted)
}
