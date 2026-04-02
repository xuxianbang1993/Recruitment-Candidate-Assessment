import assert from 'node:assert/strict'

import { JOB_TEMPLATES } from '../../../../config/job-templates.ts'
import type { Candidate } from '../../../../types/candidate.ts'
import type { Assessment, Job } from '../../../../types/assessment.ts'
import { buildEvaluationPrompt, buildReEvaluationPrompt, buildReportPrompt } from '../prompts.ts'

const candidate: Candidate = {
  id: 'candidate-1',
  name: 'Test Candidate',
  phone: '',
  email: 'candidate@example.com',
  position: 'Role',
  resumeText: 'Experienced in product delivery and leadership.',
  skills: ['Planning', 'Execution'],
  experience: 5,
  education: 'Bachelor',
  createdAt: '2026-03-25T00:00:00.000Z',
}

const job = {
  id: 'job-1',
  title: 'Sales Manager',
  department: 'Sales',
  category: 'sales',
  description: 'Drive pipeline growth and close key accounts.',
  requirements: ['Own outcomes'],
  skills: ['Leadership'],
  weights: JOB_TEMPLATES.sales.dimensions.slice(0, 2).map((dimension) => ({
    name: dimension.name,
    weight: dimension.weight,
    score: 0,
  })),
  createdAt: '2026-03-25T00:00:00.000Z',
} as Job & { category: string }

const assessment: Assessment = {
  id: 'assessment-1',
  candidateId: candidate.id,
  jobId: job.id,
  type: 'initial',
  parentId: null,
  scores: job.weights.map((dimension, index) => ({
    ...dimension,
    score: index === 0 ? 58 : 82,
  })),
  totalScore: 70,
  strengths: ['Clear communication'],
  weaknesses: ['Needs stronger follow-through'],
  suggestions: ['Probe leadership examples'],
  aiProvider: 'openai',
  createdAt: '2026-03-25T00:00:00.000Z',
}

function run(): void {
  const evaluationPrompt = buildEvaluationPrompt(candidate, job)
  const firstDimension = JOB_TEMPLATES.sales.dimensions[0]
  const firstIndicator = firstDimension.indicators[0]

  assert.ok(
    evaluationPrompt.includes(firstDimension.positive),
    'evaluation prompt includes positive behavioral anchor',
  )
  assert.ok(
    evaluationPrompt.includes(firstDimension.negative),
    'evaluation prompt includes negative behavioral anchor',
  )
  assert.ok(
    evaluationPrompt.includes(firstIndicator),
    'evaluation prompt includes key indicators',
  )
  assert.ok(
    evaluationPrompt.includes('## 分档标准（必须严格执行）'),
    'evaluation prompt includes grading bands',
  )
  assert.ok(
    evaluationPrompt.includes('## 评分规则（必须遵守）'),
    'evaluation prompt includes scoring rules',
  )
  assert.ok(
    evaluationPrompt.includes('每个维度必须基于关键指标逐条评判，不可笼统给分'),
    'evaluation prompt requires scoring against indicators',
  )

  const reportPrompt = buildReportPrompt(assessment, candidate, job)
  assert.ok(
    reportPrompt.includes(firstDimension.definition),
    'report prompt includes dimension definition context',
  )
  assert.ok(
    reportPrompt.includes(firstDimension.positive),
    'report prompt includes positive behavioral anchor context',
  )
  assert.ok(
    reportPrompt.includes(`关键指标：${firstIndicator}`),
    'report prompt includes key indicator context',
  )

  const reEvaluationPrompt = buildReEvaluationPrompt(candidate, job, assessment, [
    '面试追问中展示了跨部门推进项目的具体案例。',
    '候选人对销售复盘方法回答较弱，缺少量化结果。',
  ])
  assert.ok(
    reEvaluationPrompt.includes('## 初评结果（仅供参考，需根据补充材料调整）'),
    're-evaluation prompt includes initial assessment summary',
  )
  assert.ok(
    reEvaluationPrompt.includes('### 补充材料 1'),
    're-evaluation prompt enumerates attachment content',
  )
  assert.ok(
    reEvaluationPrompt.includes('面试表现证据的权重应高于简历自述'),
    're-evaluation prompt includes interview-first scoring rule',
  )
  assert.ok(
    reEvaluationPrompt.includes('如面试中发现简历内容不实或表现与简历不符，必须大幅调整分数'),
    're-evaluation prompt includes score adjustment rule',
  )
}

run()
