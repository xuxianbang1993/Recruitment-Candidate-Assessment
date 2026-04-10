/**
 * DAO integration test - runs against :memory: SQLite
 * Usage: NODE_ENV=test npx tsx src/lib/server/db/__test__/dao-test.ts
 */

process.env['NODE_ENV'] = 'test'

import { randomUUID } from 'crypto'
import { resetDatabase } from '../database.js'
import { CandidateDAO } from '../candidate-dao.js'
import { JobDAO } from '../job-dao.js'
import { AssessmentDAO } from '../assessment-dao.js'
import { AttachmentDAO } from '../attachment-dao.js'
import { SettingsDAO } from '../settings-dao.js'
import { ChatHistoryDAO } from '../chat-history-dao.js'
import { ResumeProfileDAO } from '../resume-profile-dao.js'
import { WorkExperienceDAO } from '../work-experience-dao.js'
import { EducationHistoryDAO } from '../education-history-dao.js'
import { ProjectExperienceDAO } from '../project-experience-dao.js'

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

// Test getByJobId
const byJobCandidates = candidateDAO.getByJobId(testJob.id)
assert(byJobCandidates.length >= 1, 'getByJobId: returns candidates for job')
assert(byJobCandidates[0]?.jobId === testJob.id, 'getByJobId: jobId matches')

// Test search with jobId filter
const scopedSearch = candidateDAO.search('Alice', testJob.id)
assert(scopedSearch.length >= 1, 'search(jobId): found by name within job')

// Test deleteByJobId
const tempJob = jobDAO.create({
  title: 'Temp Position',
  department: 'Test',
  category: '',
  description: '',
  requirements: [],
  skills: [],
  weights: [],
})
const tempCandidate = candidateDAO.create({
  jobId: tempJob.id,
  name: 'Temp Candidate',
  phone: '',
  email: '',
  resumeText: '',
  skills: [],
  experience: 0,
  education: '',
})
const deleteCount = candidateDAO.deleteByJobId(tempJob.id)
assert(deleteCount === 1, 'deleteByJobId: deleted 1 candidate')
assert(candidateDAO.getById(tempCandidate.id) === undefined, 'deleteByJobId: candidate removed')
jobDAO.delete(tempJob.id)

// Test FK cascade delete: deleting a job should cascade delete its candidates
const cascadeJob = jobDAO.create({
  title: 'Cascade Test Job',
  department: 'Test',
  category: '',
  description: '',
  requirements: [],
  skills: [],
  weights: [],
})
const cascadeCandidate = candidateDAO.create({
  jobId: cascadeJob.id,
  name: 'CascadeTestCandidate',
  phone: '',
  email: '',
  resumeText: '',
  skills: [],
  experience: 0,
  education: '',
})
jobDAO.delete(cascadeJob.id)
assert(candidateDAO.getById(cascadeCandidate.id) === undefined, 'FK cascade: deleting job removes its candidates')

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

section('Resume Profile DAOs')
const resumeProfileDAO = new ResumeProfileDAO()
const workExperienceDAO = new WorkExperienceDAO()
const educationHistoryDAO = new EducationHistoryDAO()
const projectExperienceDAO = new ProjectExperienceDAO()

const resumeJob = jobDAO.create({
  title: 'Resume Parsing Engineer',
  department: 'Platform',
  category: '',
  description: '',
  requirements: [],
  skills: [],
  weights: [],
})

const resumeCandidate = candidateDAO.create({
  jobId: resumeJob.id,
  name: 'Carol Resume',
  phone: '13900139000',
  email: 'carol@example.com',
  resumeText: '10 years of experience building hiring systems',
  skills: ['Parsing'],
  experience: 10,
  education: 'Master',
})

const createdProfile = resumeProfileDAO.create({
  id: randomUUID(),
  candidateId: resumeCandidate.id,
  jobId: resumeJob.id,
  jobTitle: resumeJob.title,
  rawText: 'Carol Resume raw profile text',
  parseStatus: 'pending',
})
assert(createdProfile.id.length > 0, 'create: returns resume profile with id')
assert(createdProfile.candidateId === resumeCandidate.id, 'create: candidateId matches')
assert(createdProfile.skills.length === 0, 'create: default skills parsed')
assert(createdProfile.languages.length === 0, 'create: default languages parsed')

resumeProfileDAO.update(createdProfile.id, {
  name: 'Carol Resume',
  gender: 'female',
  phone: '13900139000',
  email: 'carol@example.com',
  city: 'Shenzhen',
  highestEducation: 'Master',
  school: 'Tsinghua University',
  major: 'Computer Science',
  workYears: 10,
  expectedSalary: '35k-45k',
  skills: ['Svelte', 'TypeScript', 'SQLite'],
  certificates: ['PMP'],
  languages: [
    { language: 'English', level: 'C1' },
    { language: 'Chinese', level: 'Native' },
  ],
  selfEvaluation: 'Built multiple recruiting systems',
  parseStatus: 'completed',
})

const updatedProfile = resumeProfileDAO.getById(createdProfile.id)
assert(updatedProfile?.name === 'Carol Resume', 'update: name updated')
assert(updatedProfile?.skills.length === 3, 'update: skills updated')
assert(updatedProfile?.languages[0]?.language === 'English', 'update: languages updated')
assert(updatedProfile?.parseStatus === 'completed', 'update: parseStatus updated')

workExperienceDAO.batchCreate(createdProfile.id, [
  {
    company: 'Alpha Inc',
    position: 'Senior Engineer',
    startDate: '2020-01',
    endDate: '2022-12',
    description: 'Built parsing services',
  },
  {
    company: 'Beta Labs',
    position: 'Tech Lead',
    startDate: '2023-01',
    endDate: '2025-12',
    description: 'Led hiring platform development',
  },
])

educationHistoryDAO.batchCreate(createdProfile.id, [
  {
    school: 'Tsinghua University',
    major: 'Computer Science',
    degree: 'Bachelor',
    startDate: '2010-09',
    endDate: '2014-06',
  },
  {
    school: 'Peking University',
    major: 'Software Engineering',
    degree: 'Master',
    startDate: '2014-09',
    endDate: '2017-06',
  },
])

projectExperienceDAO.batchCreate(createdProfile.id, [
  {
    projectName: 'Resume Parser',
    role: 'Architect',
    startDate: '2022-01',
    endDate: '2023-06',
    description: 'Designed resume extraction workflows',
  },
  {
    projectName: 'Interview Platform',
    role: 'Lead Developer',
    startDate: '2023-07',
    endDate: '2025-02',
    description: 'Built structured candidate review tooling',
  },
])

const workItems = workExperienceDAO.getByProfileId(createdProfile.id)
assert(workItems.length === 2, 'work batchCreate: inserted all items')
assert(workItems[0]?.sortOrder === 0 && workItems[1]?.sortOrder === 1, 'work getByProfileId: assigns sort order')
assert(workItems[0]?.company === 'Alpha Inc' && workItems[1]?.company === 'Beta Labs', 'work getByProfileId: sorted ASC')

const educationItems = educationHistoryDAO.getByProfileId(createdProfile.id)
assert(educationItems.length === 2, 'education batchCreate: inserted all items')
assert(educationItems[0]?.sortOrder === 0 && educationItems[1]?.sortOrder === 1, 'education getByProfileId: assigns sort order')
assert(educationItems[0]?.school === 'Tsinghua University', 'education getByProfileId: sorted ASC')

const projectItems = projectExperienceDAO.getByProfileId(createdProfile.id)
assert(projectItems.length === 2, 'project batchCreate: inserted all items')
assert(projectItems[0]?.sortOrder === 0 && projectItems[1]?.sortOrder === 1, 'project getByProfileId: assigns sort order')
assert(projectItems[1]?.projectName === 'Interview Platform', 'project getByProfileId: sorted ASC')

const fullProfile = resumeProfileDAO.getFullById(createdProfile.id)
assert(fullProfile !== undefined, 'getFullById: found resume profile')
assert(fullProfile?.workExperiences.length === 2, 'getFullById: includes work experiences')
assert(fullProfile?.educationHistory.length === 2, 'getFullById: includes education history')
assert(fullProfile?.projectExperiences.length === 2, 'getFullById: includes project experiences')

const byCandidateProfile = resumeProfileDAO.getByCandidateId(resumeCandidate.id)
assert(byCandidateProfile?.id === createdProfile.id, 'getByCandidateId: returns matching profile')

const byJobProfiles = resumeProfileDAO.getByJobId(resumeJob.id)
assert(byJobProfiles.some((profile) => profile.id === createdProfile.id), 'getByJobId: returns profiles for job')

const deleteCandidate = candidateDAO.create({
  jobId: resumeJob.id,
  name: 'Delete By Candidate',
  phone: '',
  email: 'delete-candidate@example.com',
  resumeText: '',
  skills: [],
  experience: 1,
  education: '',
})

const deleteCandidateProfile = resumeProfileDAO.create({
  id: randomUUID(),
  candidateId: deleteCandidate.id,
  jobId: resumeJob.id,
  jobTitle: resumeJob.title,
  rawText: 'Candidate delete profile',
  parseStatus: 'pending',
})

const deletedByCandidate = resumeProfileDAO.deleteByCandidateId(deleteCandidate.id)
assert(deletedByCandidate === 1, 'deleteByCandidateId: deleted one profile')
assert(resumeProfileDAO.getById(deleteCandidateProfile.id) === undefined, 'deleteByCandidateId: profile removed')

const deleteJob = jobDAO.create({
  title: 'Delete Profile Job',
  department: 'QA',
  category: '',
  description: '',
  requirements: [],
  skills: [],
  weights: [],
})

const deleteJobCandidate = candidateDAO.create({
  jobId: deleteJob.id,
  name: 'Delete By Job',
  phone: '',
  email: 'delete-job@example.com',
  resumeText: '',
  skills: [],
  experience: 1,
  education: '',
})

const deleteJobProfile = resumeProfileDAO.create({
  id: randomUUID(),
  candidateId: deleteJobCandidate.id,
  jobId: deleteJob.id,
  jobTitle: deleteJob.title,
  rawText: 'Job delete profile',
  parseStatus: 'pending',
})

const deletedByJob = resumeProfileDAO.deleteByJobId(deleteJob.id)
assert(deletedByJob === 1, 'deleteByJobId: deleted one profile')
assert(resumeProfileDAO.getById(deleteJobProfile.id) === undefined, 'deleteByJobId: profile removed')

resumeProfileDAO.delete(createdProfile.id)
assert(resumeProfileDAO.getById(createdProfile.id) === undefined, 'delete: profile removed')
assert(workExperienceDAO.getByProfileId(createdProfile.id).length === 0, 'delete: cascades work experiences')
assert(educationHistoryDAO.getByProfileId(createdProfile.id).length === 0, 'delete: cascades education history')
assert(projectExperienceDAO.getByProfileId(createdProfile.id).length === 0, 'delete: cascades project experiences')

console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} PASS, ${failed} FAIL`)
resetDatabase()
if (failed > 0) {
  process.exit(1)
}
