process.env['NODE_ENV'] = 'test'

import { resetDatabase } from '$lib/server/db'
import { candidateDAO, jobDAO, resumeProfileDAO } from '$lib/server/db'
import { buildParseChain } from '../resume-parse-chain.js'
import { createAndParseProfile, reparseProfile } from '../resume-profile-service.js'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label}`)
    failed++
  }
}

const fakeAIChat = async (): Promise<string> =>
  JSON.stringify({
    name: '张三',
    gender: '男',
    birthDate: '1995-05',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    city: '深圳',
    highestEducation: '本科',
    school: '深圳大学',
    major: '计算机科学',
    workYears: 5,
    expectedSalary: '25k-30k',
    skills: ['TypeScript', 'Svelte'],
    certificates: ['PMP'],
    languages: [{ language: '英语', level: 'CET-6' }],
    selfEvaluation: '具备完整招聘系统开发经验',
    workExperiences: [
      {
        company: 'A公司',
        position: '高级前端工程师',
        startDate: '2023-01',
        endDate: '2025-03',
        description: '负责招聘系统前端开发'
      }
    ],
    educationHistory: [
      {
        school: '深圳大学',
        major: '计算机科学',
        degree: '本科',
        startDate: '2014-09',
        endDate: '2018-06'
      }
    ],
    projectExperiences: [
      {
        projectName: '简历解析平台',
        role: '核心开发',
        startDate: '2024-01',
        endDate: '2024-12',
        description: '实现结构化简历解析与入库'
      }
    ]
  })

console.log('\n[Suite 1] Resume Parse Chain')
{
  const chain = buildParseChain(fakeAIChat)
  const context = await chain.execute('姓名：张三\r\n\r\n\r\n工作经验：5年')
  assert(context.error === null, '1.1 chain completes without error')
  assert(context.cleanedText.includes('\n\n'), '1.2 chain normalizes blank lines')
  assert(context.parsedData?.name === '张三', '1.3 chain returns parsed data')
}

console.log('\n[Suite 2] Resume Profile Service')
const job = jobDAO.create({
  title: 'Frontend Engineer',
  department: 'Engineering',
  category: '',
  description: '',
  requirements: [],
  skills: [],
  weights: []
})

const candidate = candidateDAO.create({
  jobId: job.id,
  name: '待解析候选人',
  phone: '',
  email: '',
  resumeText: '原始简历文本',
  skills: [],
  experience: 0,
  education: ''
})

const profile = await createAndParseProfile({
  candidateId: candidate.id,
  jobId: job.id,
  jobTitle: job.title,
  rawText: '姓名：张三\n工作经验：5年',
  aiChat: fakeAIChat
})

assert(profile.parseStatus === 'completed', '2.1 createAndParseProfile stores completed status')
assert(profile.workExperiences.length === 1, '2.2 createAndParseProfile stores work experiences')
assert(profile.educationHistory.length === 1, '2.3 createAndParseProfile stores education history')
assert(profile.projectExperiences.length === 1, '2.4 createAndParseProfile stores project experiences')

const reparsed = await reparseProfile(profile.id, fakeAIChat)
assert(reparsed.parseStatus === 'completed', '2.5 reparseProfile stores completed status')
assert(reparsed.name === '张三', '2.6 reparseProfile refreshes main profile fields')

const syncedCandidate = candidateDAO.getById(candidate.id)
assert(syncedCandidate?.name === '张三', '2.7 candidate table synced from parsed data')
assert(syncedCandidate?.experience === 5, '2.8 candidate experience synced')

const failedProfile = await createAndParseProfile({
  candidateId: candidate.id,
  jobId: job.id,
  jobTitle: job.title,
  rawText: '无法解析的简历',
  aiChat: async () => 'not-json'
})

assert(failedProfile.parseStatus === 'failed', '2.9 failed parse stores failed status')
assert(failedProfile.parseError.length > 0, '2.10 failed parse stores error message')

const storedProfile = resumeProfileDAO.getFullById(profile.id)
assert(storedProfile?.workExperiences.length === 1, '2.11 stored profile can be loaded with child records')

console.log(`\nResults: ${passed} passed, ${failed} failed`)
resetDatabase()
if (failed > 0) {
  process.exit(1)
}
