import type { ParsedResumeData, ResumeProfileFull } from '$lib/types'
import type { AIChatFunction } from './resume-parse-chain.js'
import { randomUUID } from 'crypto'
import { PARSE_STATUS } from '$lib/types'
import {
  candidateDAO,
  educationHistoryDAO,
  projectExperienceDAO,
  resumeProfileDAO,
  workExperienceDAO
} from '$lib/server/db'
import getDatabase from '$lib/server/db/database'
import { buildParseChain } from './resume-parse-chain.js'

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function toProfileString(value: string | null): string {
  return value ?? ''
}

/**
 * Creates a resume profile, runs AI parsing, and persists the result.
 */
export async function createAndParseProfile(params: {
  candidateId: string
  jobId: string
  jobTitle: string
  rawText: string
  aiChat: AIChatFunction
}): Promise<ResumeProfileFull> {
  const profile = resumeProfileDAO.create({
    id: randomUUID(),
    candidateId: params.candidateId,
    jobId: params.jobId,
    jobTitle: params.jobTitle,
    rawText: params.rawText,
    parseStatus: PARSE_STATUS.PARSING
  })

  try {
    const context = await buildParseChain(params.aiChat).execute(params.rawText)
    if (context.error || !context.parsedData) {
      resumeProfileDAO.update(profile.id, {
        parseStatus: PARSE_STATUS.FAILED,
        parseError: context.error ?? 'AI 简历解析失败'
      })
    } else {
      saveParseResult(profile.id, params.candidateId, context.parsedData)
    }
  } catch (error: unknown) {
    resumeProfileDAO.update(profile.id, {
      parseStatus: PARSE_STATUS.FAILED,
      parseError: toErrorMessage(error)
    })
  }

  return resumeProfileDAO.getFullById(profile.id)!
}

/**
 * Re-runs AI parsing for an existing resume profile and replaces persisted child records.
 */
export async function reparseProfile(
  profileId: string,
  aiChat: AIChatFunction
): Promise<ResumeProfileFull> {
  const profile = resumeProfileDAO.getById(profileId)
  if (!profile) {
    throw new Error(`未找到简历档案: ${profileId}`)
  }

  resumeProfileDAO.update(profileId, {
    parseStatus: PARSE_STATUS.PARSING,
    parseError: ''
  })

  try {
    const context = await buildParseChain(aiChat).execute(profile.rawText)
    if (context.error || !context.parsedData) {
      resumeProfileDAO.update(profileId, {
        parseStatus: PARSE_STATUS.FAILED,
        parseError: context.error ?? 'AI 简历解析失败'
      })
    } else {
      saveParseResult(profileId, profile.candidateId, context.parsedData)
    }
  } catch (error: unknown) {
    resumeProfileDAO.update(profileId, {
      parseStatus: PARSE_STATUS.FAILED,
      parseError: toErrorMessage(error)
    })
  }

  return resumeProfileDAO.getFullById(profileId)!
}

function saveParseResult(profileId: string, candidateId: string, data: ParsedResumeData): void {
  const db = getDatabase()
  const transaction = db.transaction((parsedData: ParsedResumeData): void => {
    const candidate = candidateDAO.getById(candidateId)

    workExperienceDAO.deleteByProfileId(profileId)
    educationHistoryDAO.deleteByProfileId(profileId)
    projectExperienceDAO.deleteByProfileId(profileId)

    resumeProfileDAO.update(profileId, {
      name: toProfileString(parsedData.name),
      gender: toProfileString(parsedData.gender),
      birthDate: toProfileString(parsedData.birthDate),
      phone: toProfileString(parsedData.phone),
      email: toProfileString(parsedData.email),
      city: toProfileString(parsedData.city),
      highestEducation: toProfileString(parsedData.highestEducation),
      school: toProfileString(parsedData.school),
      major: toProfileString(parsedData.major),
      workYears: parsedData.workYears ?? 0,
      expectedSalary: toProfileString(parsedData.expectedSalary),
      skills: parsedData.skills,
      certificates: parsedData.certificates,
      languages: parsedData.languages,
      selfEvaluation: toProfileString(parsedData.selfEvaluation),
      parseStatus: PARSE_STATUS.COMPLETED,
      parseError: ''
    })

    workExperienceDAO.batchCreate(profileId, parsedData.workExperiences)
    educationHistoryDAO.batchCreate(profileId, parsedData.educationHistory)
    projectExperienceDAO.batchCreate(profileId, parsedData.projectExperiences)

    candidateDAO.update(candidateId, {
      name: parsedData.name ?? candidate?.name ?? '',
      phone: parsedData.phone ?? candidate?.phone ?? '',
      email: parsedData.email ?? candidate?.email ?? '',
      skills: parsedData.skills,
      experience: parsedData.workYears ?? candidate?.experience ?? 0,
      education: parsedData.highestEducation ?? candidate?.education ?? ''
    })
  })

  transaction(data)
}
