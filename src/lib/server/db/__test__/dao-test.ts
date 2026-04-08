/**
 * DAO integration test - runs against :memory: SQLite
 * Usage: NODE_ENV=test npx tsx src/lib/server/db/__test__/dao-test.ts
 */

process.env['NODE_ENV'] = 'test'

import { resetDatabase } from '../database.js'
import { CandidateDAO } from '../candidate-dao.js'
import { JobDAO } from '../job-dao.js'
import { AssessmentDAO } from '../assessment-dao.js'
import { AttachmentDAO } from '../attachment-dao.js'
import { SettingsDAO } from '../settings-dao.js'
import { ChatHistoryDAO } from '../chat-history-dao.js'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS: ${label}`)
    passed++
  } else {
    console.error(`  FAIL: ${label}`)
    failed++
  }
}

function section(name: string): void {
  console.log(`\n[${name}]`)
}

// Create a job first for FK references
const jobDAO = new JobDAO()
const testJob = jobDAO.create({
  title: 'Frontend Engineer',
  department: 'Engineering',
  category: 'expert',
  description: 'Build and maintain the UI',
  requirements: ['3+ years experience', 'Svelte'],
  skills: ['Svelte', 'TypeScript'],
  weights: [
    { name: 'Technical Skill', weight: 60, score: 0 },
    { name: 'Communication', weight: 40, score: 0 },
  ],
})

section('CandidateDAO')
const candidateDAO = new CandidateDAO()

const newCandidate = candidateDAO.create({
  jobId: testJob.id,
  name: 'Alice',
  phone: '13800138000',
  email: 'alice@example.com',
  resumeText: 'Experienced with Svelte and TypeScript',
  skills: ['Svelte', 'TypeScript', 'CSS'],
  experience: 3,
  education: 'Bachelor',
})
assert(newCandidate.id.length > 0, 'create: returns candidate with id')
assert(newCandidate.name === 'Alice', 'create: name matches')
assert(Array.isArray(newCandidate.skills) && newCandidate.skills.includes('Svelte'), 'create: skills parsed')

const fetched = candidateDAO.getById(newCandidate.id)
assert(fetched !== undefined, 'getById: found candidate')
assert(fetched?.email === 'alice@example.com', 'getById: email matches')

candidateDAO.update(newCandidate.id, {
  experience: 5,
  skills: ['Svelte', 'TypeScript', 'CSS', 'Node.js'],
})
const updated = candidateDAO.getById(newCandidate.id)
assert(updated?.experience === 5, 'update: experience updated')
assert(updated?.skills.length === 4, 'update: skills updated')

const searchResults = candidateDAO.search('Alice')
assert(searchResults.length >= 1, 'search: found by name')
const searchEmail = candidateDAO.search('alice')
assert(searchEmail.length >= 1, 'search: found by email substring')

const all = candidateDAO.getAll()
assert(all.length >= 1, 'getAll: returns at least one')

candidateDAO.delete(newCandidate.id)
const deleted = candidateDAO.getById(newCandidate.id)
assert(deleted === undefined, 'delete: candidate removed')

section('JobDAO')
// jobDAO already created above
const newJob = testJob
assert(newJob.id.length > 0, 'create: returns job with id')
assert(newJob.title === 'Frontend Engineer', 'create: title matches')
assert(newJob.category === 'expert', 'create: category matches')
assert(Array.isArray(newJob.requirements) && newJob.requirements.length === 2, 'create: requirements parsed')
assert(newJob.weights.length === 2, 'create: weights parsed')

const fetchedJob = jobDAO.getById(newJob.id)
assert(fetchedJob !== undefined, 'getById: found job')
assert(fetchedJob?.category === 'expert', 'getById: category persisted')

jobDAO.update(newJob.id, {
  department: 'Product',
  category: 'management',
})
const updatedJob = jobDAO.getById(newJob.id)
assert(updatedJob?.department === 'Product', 'update: department updated')
assert(updatedJob?.category === 'management', 'update: category updated')

const allJobs = jobDAO.getAll()
assert(allJobs.length >= 1, 'getAll: returns at least one')

section('AssessmentDAO')
const assessmentDAO = new AssessmentDAO()

const c2 = candidateDAO.create({
  jobId: testJob.id,
  name: 'Bob',
  phone: '',
  email: 'bob@example.com',
  resumeText: '',
  skills: [],
  experience: 2,
  education: 'Master',
})
const j2 = jobDAO.create({
  title: 'Backend Engineer',
  department: 'Engineering',
  category: '',
  description: '',
  requirements: [],
  skills: [],
  weights: [],
})

const newAssessment = assessmentDAO.create({
  candidateId: c2.id,
  jobId: j2.id,
  type: 'initial',
  parentId: null,
  scores: [{ name: 'Technical Skill', weight: 1, score: 85 }],
  totalScore: 85,
  strengths: ['Strong logic'],
  weaknesses: ['Needs clearer communication'],
  suggestions: ['Ask for more examples'],
  aiProvider: 'openai',
})
assert(newAssessment.id.length > 0, 'create: returns assessment with id')
assert(newAssessment.totalScore === 85, 'create: totalScore matches')
assert(newAssessment.strengths[0] === 'Strong logic', 'create: strengths parsed')

const fetchedAssessment = assessmentDAO.getById(newAssessment.id)
assert(fetchedAssessment !== undefined, 'getById: found assessment')

const byCandidate = assessmentDAO.getByCandidateId(c2.id)
assert(byCandidate.length === 1, 'getByCandidateId: found 1 result')

const byJob = assessmentDAO.getByJobId(j2.id)
assert(byJob.length === 1, 'getByJobId: found 1 result')

assessmentDAO.delete(newAssessment.id)
assert(assessmentDAO.getById(newAssessment.id) === undefined, 'delete: assessment removed')

section('SettingsDAO')
const settingsDAO = new SettingsDAO()

settingsDAO.set('ai_provider', 'openai')
settingsDAO.set('theme', 'light')

assert(settingsDAO.get('ai_provider') === 'openai', 'set/get: ai_provider correct')
assert(settingsDAO.get('theme') === 'light', 'set/get: theme correct')
assert(settingsDAO.get('nonexistent') === undefined, 'get: missing key returns undefined')

settingsDAO.set('ai_provider', 'claude')
assert(settingsDAO.get('ai_provider') === 'claude', 'set: upsert works')

const allSettings = settingsDAO.getAll()
assert(typeof allSettings === 'object' && allSettings['theme'] === 'light', 'getAll: returns map')

section('ChatHistoryDAO')
const chatHistoryDAO = new ChatHistoryDAO()

const sessionId = 'session-001'
const msg1 = chatHistoryDAO.create(sessionId, { role: 'user', content: 'hello' })
const msg2 = chatHistoryDAO.create(sessionId, { role: 'assistant', content: 'hi there' })

assert(msg1.id.length > 0, 'create: user message has id')
assert(msg2.role === 'assistant', 'create: assistant message role correct')

const history = chatHistoryDAO.getBySessionId(sessionId)
assert(history.length === 2, 'getBySessionId: returns 2 messages')
assert(history[0].content === 'hello', 'getBySessionId: order correct (ASC)')

chatHistoryDAO.deleteSession(sessionId)
const afterDelete = chatHistoryDAO.getBySessionId(sessionId)
assert(afterDelete.length === 0, 'deleteSession: messages removed')

section('AttachmentDAO')
const attachmentDAO = new AttachmentDAO()

const assessmentForAttachment = assessmentDAO.create({
  candidateId: c2.id,
  jobId: j2.id,
  type: 'comprehensive',
  parentId: null,
  scores: [],
  totalScore: 0,
  strengths: [],
  weaknesses: [],
  suggestions: [],
  aiProvider: 'openai',
})

const newAttachment = attachmentDAO.create({
  assessmentId: assessmentForAttachment.id,
  filename: 'resume-1.pdf',
  originalName: 'resume.pdf',
  filePath: '/tmp/resume-1.pdf',
  fileType: 'application/pdf',
  fileSize: 2048,
  textContent: 'Resume body text',
})
assert(newAttachment.id.length > 0, 'create: returns attachment with id')
assert(newAttachment.assessmentId === assessmentForAttachment.id, 'create: assessmentId matches')
assert(newAttachment.textContent === 'Resume body text', 'create: textContent matches')

const attachments = attachmentDAO.getByAssessmentId(assessmentForAttachment.id)
assert(attachments.length === 1, 'getByAssessmentId: returns 1 attachment')
assert(attachments[0]?.originalName === 'resume.pdf', 'getByAssessmentId: originalName matches')

attachmentDAO.delete(newAttachment.id)
const afterAttachmentDelete = attachmentDAO.getByAssessmentId(assessmentForAttachment.id)
assert(afterAttachmentDelete.length === 0, 'delete: attachment removed')

console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} PASS, ${failed} FAIL`)
resetDatabase()
if (failed > 0) {
  process.exit(1)
}
