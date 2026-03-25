import assert from 'node:assert/strict'

import { JOB_TEMPLATES } from '../../../config/job-templates.ts'
import type { ScoreDimension } from '../../../types/assessment.ts'
import { getDimensionDefinition, getInterviewTips } from '../report-data.ts'

function run(): void {
  const scores: ScoreDimension[] = [
    {
      name: JOB_TEMPLATES.sales.dimensions[1].name,
      weight: JOB_TEMPLATES.sales.dimensions[1].weight,
      score: 88,
    },
    {
      name: JOB_TEMPLATES.sales.dimensions[0].name,
      weight: JOB_TEMPLATES.sales.dimensions[0].weight,
      score: 55,
    },
  ]

  assert.equal(
    getDimensionDefinition('sales', JOB_TEMPLATES.sales.dimensions[0].name),
    JOB_TEMPLATES.sales.dimensions[0].definition,
  )
  assert.equal(getDimensionDefinition('', JOB_TEMPLATES.sales.dimensions[0].name), '')

  const tips = getInterviewTips('sales', scores)
  assert.equal(tips.length, 2)
  assert.equal(tips[0].name, JOB_TEMPLATES.sales.dimensions[0].name)
  assert.equal(tips[0].highlight, true)
  assert.deepEqual(tips[0].questions, JOB_TEMPLATES.sales.dimensions[0].questions)
  assert.equal(tips[1].highlight, false)
}

run()
