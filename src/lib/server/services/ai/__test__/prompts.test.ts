import assert from 'node:assert/strict'

import { JOB_TEMPLATES } from '../../../../config/job-templates.ts'
import type { Candidate } from '../../../../types/candidate.ts'
import type { Assessment, Job } from '../../../../types/assessment.ts'
import { buildEvaluationPrompt, buildReportPrompt } from '../prompts.ts'

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
  title: 'Manager',
  department: 'Operations',
  category: 'management',
  description: 'Lead a team and deliver results.',
  requirements: ['Own outcomes'],
  skills: ['Leadership'],
  weights: JOB_TEMPLATES.management.dimensions.slice(0, 2).map((dimension) => ({
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
  assert.ok(
    evaluationPrompt.includes(JOB_TEMPLATES.management.dimensions[0].positive),
    'evaluation prompt includes positive behavioral anchor',
  )
  assert.ok(
    evaluationPrompt.includes(JOB_TEMPLATES.management.dimensions[0].negative),
    'evaluation prompt includes negative behavioral anchor',
  )

  const reportPrompt = buildReportPrompt(assessment, candidate, job)
  assert.ok(
    reportPrompt.includes(JOB_TEMPLATES.management.dimensions[0].definition),
    'report prompt includes dimension definition context',
  )
  assert.ok(
    reportPrompt.includes(JOB_TEMPLATES.management.dimensions[0].positive),
    'report prompt includes positive behavioral anchor context',
  )
}

run()
