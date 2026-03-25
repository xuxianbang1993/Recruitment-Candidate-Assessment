import type { ScoreDimension } from '$lib/types/assessment'

export function cloneWeights(weights: ScoreDimension[]): ScoreDimension[] {
  return weights.map((weight) => ({ ...weight }))
}

export function weightsMatch(left: ScoreDimension[], right: ScoreDimension[]): boolean {
  if (left.length !== right.length) return false

  return left.every((weight, index) => {
    const other = right[index]
    return other !== undefined && weight.name === other.name && weight.weight === other.weight
  })
}
