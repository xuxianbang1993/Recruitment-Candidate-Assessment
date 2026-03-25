import assert from 'node:assert/strict'

import type { ScoreDimension } from '../../types/assessment.ts'
import { cloneWeights, weightsMatch } from '../job-form-helpers.ts'

function run(): void {
  const base: ScoreDimension[] = [
    { name: 'Leadership', weight: 60, score: 0 },
    { name: 'Execution', weight: 40, score: 0 },
  ]

  const copied = cloneWeights(base)
  assert.deepEqual(copied, base)
  assert.notEqual(copied, base)
  assert.equal(weightsMatch(base, copied), true)
  assert.equal(
    weightsMatch(base, [
      { name: 'Leadership', weight: 55, score: 0 },
      { name: 'Execution', weight: 40, score: 0 },
    ]),
    false,
  )
  assert.equal(
    weightsMatch(base, [
      { name: 'Execution', weight: 40, score: 0 },
      { name: 'Leadership', weight: 60, score: 0 },
    ]),
    false,
  )
}

run()
