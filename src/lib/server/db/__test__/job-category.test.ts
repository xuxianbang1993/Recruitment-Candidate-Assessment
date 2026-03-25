import assert from 'node:assert/strict'

process.env['NODE_ENV'] = 'test'

import { resetDatabase } from '../database.js'
import { JobDAO } from '../job-dao.js'

function run(): void {
  const jobDAO = new JobDAO()

  const created = jobDAO.create({
    title: 'Frontend Engineer',
    department: 'Engineering',
    category: 'expert',
    description: 'Build the UI',
    requirements: ['3+ years experience'],
    skills: ['Svelte'],
    weights: [{ name: 'Technical Skill', weight: 100, score: 0 }],
  } as Parameters<JobDAO['create']>[0] & { category: string })

  assert.equal((created as { category?: string }).category, 'expert')

  const fetched = jobDAO.getById(created.id)
  assert.equal((fetched as { category?: string } | undefined)?.category, 'expert')

  jobDAO.update(
    created.id,
    {
      category: 'management',
    } as Partial<Parameters<JobDAO['update']>[1]> & { category: string },
  )

  const updated = jobDAO.getById(created.id)
  assert.equal((updated as { category?: string } | undefined)?.category, 'management')

  resetDatabase()
}

run()
