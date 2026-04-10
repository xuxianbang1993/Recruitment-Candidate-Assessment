import type {
  EducationRecord,
  ProjectExperience,
  ResumeProfile,
  WorkExperience
} from '$lib/types'
import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import {
  candidateDAO,
  educationHistoryDAO,
  projectExperienceDAO,
  resumeProfileDAO,
  workExperienceDAO
} from '$lib/server/db'
import getDatabase from '$lib/server/db/database'

type EditableProfileFields = Partial<
  Pick<
    ResumeProfile,
    | 'jobTitle'
    | 'name'
    | 'gender'
    | 'birthDate'
    | 'phone'
    | 'email'
    | 'city'
    | 'highestEducation'
    | 'school'
    | 'major'
    | 'workYears'
    | 'expectedSalary'
    | 'skills'
    | 'certificates'
    | 'languages'
    | 'selfEvaluation'
    | 'rawText'
  >
>

type WorkExperienceInput = Omit<WorkExperience, 'id' | 'profileId' | 'sortOrder'>
type EducationRecordInput = Omit<EducationRecord, 'id' | 'profileId' | 'sortOrder'>
type ProjectExperienceInput = Omit<ProjectExperience, 'id' | 'profileId' | 'sortOrder'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function expectString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }

  return value
}

function expectNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number`)
  }

  return value
}

function expectStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`)
  }

  return value.map((item, index) => expectString(item, `${fieldName}[${index}]`))
}

function expectLanguages(value: unknown): ResumeProfile['languages'] {
  if (!Array.isArray(value)) {
    throw new Error('basicInfo.languages must be an array')
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`basicInfo.languages[${index}] must be an object`)
    }

    return {
      language: expectString(item.language, `basicInfo.languages[${index}].language`),
      level: expectString(item.level, `basicInfo.languages[${index}].level`)
    }
  })
}

function parseBasicInfo(value: unknown): EditableProfileFields {
  if (!isRecord(value)) {
    throw new Error('basicInfo must be an object')
  }

  const update: EditableProfileFields = {}

  if ('jobTitle' in value) update.jobTitle = expectString(value.jobTitle, 'basicInfo.jobTitle')
  if ('name' in value) update.name = expectString(value.name, 'basicInfo.name')
  if ('gender' in value) update.gender = expectString(value.gender, 'basicInfo.gender')
  if ('birthDate' in value) update.birthDate = expectString(value.birthDate, 'basicInfo.birthDate')
  if ('phone' in value) update.phone = expectString(value.phone, 'basicInfo.phone')
  if ('email' in value) update.email = expectString(value.email, 'basicInfo.email')
  if ('city' in value) update.city = expectString(value.city, 'basicInfo.city')
  if ('highestEducation' in value) {
    update.highestEducation = expectString(value.highestEducation, 'basicInfo.highestEducation')
  }
  if ('school' in value) update.school = expectString(value.school, 'basicInfo.school')
  if ('major' in value) update.major = expectString(value.major, 'basicInfo.major')
  if ('workYears' in value) update.workYears = expectNumber(value.workYears, 'basicInfo.workYears')
  if ('expectedSalary' in value) {
    update.expectedSalary = expectString(value.expectedSalary, 'basicInfo.expectedSalary')
  }
  if ('skills' in value) update.skills = expectStringArray(value.skills, 'basicInfo.skills')
  if ('certificates' in value) {
    update.certificates = expectStringArray(value.certificates, 'basicInfo.certificates')
  }
  if ('languages' in value) update.languages = expectLanguages(value.languages)
  if ('selfEvaluation' in value) {
    update.selfEvaluation = expectString(value.selfEvaluation, 'basicInfo.selfEvaluation')
  }
  if ('rawText' in value) update.rawText = expectString(value.rawText, 'basicInfo.rawText')

  return update
}

function parseWorkExperiences(value: unknown): WorkExperienceInput[] {
  if (!Array.isArray(value)) {
    throw new Error('workExperiences must be an array')
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`workExperiences[${index}] must be an object`)
    }

    return {
      company: expectString(item.company, `workExperiences[${index}].company`),
      position: expectString(item.position, `workExperiences[${index}].position`),
      startDate: expectString(item.startDate, `workExperiences[${index}].startDate`),
      endDate: expectString(item.endDate, `workExperiences[${index}].endDate`),
      description: expectString(item.description, `workExperiences[${index}].description`)
    }
  })
}

function parseEducationHistory(value: unknown): EducationRecordInput[] {
  if (!Array.isArray(value)) {
    throw new Error('educationHistory must be an array')
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`educationHistory[${index}] must be an object`)
    }

    return {
      school: expectString(item.school, `educationHistory[${index}].school`),
      major: expectString(item.major, `educationHistory[${index}].major`),
      degree: expectString(item.degree, `educationHistory[${index}].degree`),
      startDate: expectString(item.startDate, `educationHistory[${index}].startDate`),
      endDate: expectString(item.endDate, `educationHistory[${index}].endDate`)
    }
  })
}

function parseProjectExperiences(value: unknown): ProjectExperienceInput[] {
  if (!Array.isArray(value)) {
    throw new Error('projectExperiences must be an array')
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`projectExperiences[${index}] must be an object`)
    }

    return {
      projectName: expectString(item.projectName, `projectExperiences[${index}].projectName`),
      role: expectString(item.role, `projectExperiences[${index}].role`),
      startDate: expectString(item.startDate, `projectExperiences[${index}].startDate`),
      endDate: expectString(item.endDate, `projectExperiences[${index}].endDate`),
      description: expectString(item.description, `projectExperiences[${index}].description`)
    }
  })
}

/**
 * Returns a single structured resume profile.
 */
export const GET: RequestHandler = ({ params }) => {
  try {
    const profile = resumeProfileDAO.getFullById(params.id)
    if (!profile) {
      return json({ success: false, error: 'Resume profile not found' }, { status: 404 })
    }

    return json({ success: true, data: profile })
  } catch (error) {
    console.error('GET /api/resume-profiles/[id] error:', error)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}

/**
 * Updates a resume profile and optionally replaces its child table records.
 */
export const PUT: RequestHandler = async ({ params, request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isRecord(body)) {
    return json({ success: false, error: 'Request body must be an object' }, { status: 400 })
  }

  const existing = resumeProfileDAO.getFullById(params.id)
  if (!existing) {
    return json({ success: false, error: 'Resume profile not found' }, { status: 404 })
  }

  try {
    const basicInfo = 'basicInfo' in body ? parseBasicInfo(body.basicInfo) : {}
    const workExperiences = 'workExperiences' in body ? parseWorkExperiences(body.workExperiences) : undefined
    const educationHistory = 'educationHistory' in body ? parseEducationHistory(body.educationHistory) : undefined
    const projectExperiences = 'projectExperiences' in body
      ? parseProjectExperiences(body.projectExperiences)
      : undefined

    const db = getDatabase()
    const transaction = db.transaction((): void => {
      if (Object.keys(basicInfo).length > 0) {
        resumeProfileDAO.update(params.id, basicInfo)
      }

      if (workExperiences) {
        workExperienceDAO.deleteByProfileId(params.id)
        workExperienceDAO.batchCreate(params.id, workExperiences)
      }

      if (educationHistory) {
        educationHistoryDAO.deleteByProfileId(params.id)
        educationHistoryDAO.batchCreate(params.id, educationHistory)
      }

      if (projectExperiences) {
        projectExperienceDAO.deleteByProfileId(params.id)
        projectExperienceDAO.batchCreate(params.id, projectExperiences)
      }

      candidateDAO.update(existing.candidateId, {
        name: basicInfo.name ?? existing.name,
        phone: basicInfo.phone ?? existing.phone,
        email: basicInfo.email ?? existing.email,
        skills: basicInfo.skills ?? existing.skills,
        experience: basicInfo.workYears ?? existing.workYears,
        education: basicInfo.highestEducation ?? existing.highestEducation
      })
    })

    transaction()

    return json({ success: true, data: resumeProfileDAO.getFullById(params.id) })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器内部错误'
    const status = error instanceof Error ? 400 : 500
    if (status === 500) {
      console.error('PUT /api/resume-profiles/[id] error:', error)
    }
    return json({ success: false, error: message }, { status })
  }
}

/**
 * Deletes a resume profile and its child records via cascade rules.
 */
export const DELETE: RequestHandler = ({ params }) => {
  try {
    const existing = resumeProfileDAO.getById(params.id)
    if (!existing) {
      return json({ success: false, error: 'Resume profile not found' }, { status: 404 })
    }

    resumeProfileDAO.delete(params.id)
    return json({ success: true })
  } catch (error) {
    console.error('DELETE /api/resume-profiles/[id] error:', error)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }
}
