import type { Message } from '$lib/types'
import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { randomUUID } from 'crypto'
import path from 'path'
import { PARSE_STATUS } from '$lib/types'
import { candidateDAO, jobDAO, resumeProfileDAO } from '$lib/server/db'
import { createAI, AIServiceError } from '$lib/server/services/ai'
import { parseResume } from '$lib/server/services/resume'
import {
  createAndParseProfile,
  reparseProfile
} from '$lib/server/services/resume/resume-profile-service'
import { AIConfigError, getAIConfig } from '../../ai/utils'

const MAX_FILE_SIZE = 11 * 1024 * 1024 // 11MB

interface AutoParseResult {
  profileId?: string
  parseStatus?: string
  parseNote?: string
}

function buildAIChat(): (messages: Array<{ role: string; content: string }>) => Promise<string> {
  const config = getAIConfig()
  const ai = createAI(config)

  return async (messages: Array<{ role: string; content: string }>): Promise<string> =>
    ai.chat(
      messages.map(
        (message): Message => ({
          role:
            message.role === 'assistant' || message.role === 'system'
              ? message.role
              : 'user',
          content: message.content
        })
      )
    )
}

function ensureFailedProfile(
  candidateId: string,
  jobId: string,
  jobTitle: string,
  rawText: string,
  parseNote: string
): AutoParseResult {
  const existingProfile = resumeProfileDAO.getByCandidateId(candidateId)

  if (existingProfile) {
    resumeProfileDAO.update(existingProfile.id, {
      rawText,
      parseStatus: PARSE_STATUS.FAILED,
      parseError: parseNote
    })

    return {
      profileId: existingProfile.id,
      parseStatus: PARSE_STATUS.FAILED,
      parseNote
    }
  }

  const profile = resumeProfileDAO.create({
    id: randomUUID(),
    candidateId,
    jobId,
    jobTitle,
    rawText,
    parseStatus: PARSE_STATUS.FAILED
  })
  resumeProfileDAO.update(profile.id, {
    parseError: parseNote
  })

  return {
    profileId: profile.id,
    parseStatus: PARSE_STATUS.FAILED,
    parseNote
  }
}

async function autoParseResumeProfile(params: {
  candidateId: string
  jobId: string
  rawText: string
}): Promise<AutoParseResult> {
  const job = jobDAO.getById(params.jobId)
  const jobTitle = job?.title ?? ''

  try {
    const aiChat = buildAIChat()
    const existingProfile = resumeProfileDAO.getByCandidateId(params.candidateId)

    if (existingProfile) {
      resumeProfileDAO.update(existingProfile.id, {
        rawText: params.rawText
      })

      const profile = await reparseProfile(existingProfile.id, aiChat)
      return {
        profileId: profile.id,
        parseStatus: profile.parseStatus
      }
    }

    const profile = await createAndParseProfile({
      candidateId: params.candidateId,
      jobId: params.jobId,
      jobTitle,
      rawText: params.rawText,
      aiChat
    })

    return {
      profileId: profile.id,
      parseStatus: profile.parseStatus
    }
  } catch (error: unknown) {
    if (error instanceof AIConfigError) {
      return ensureFailedProfile(
        params.candidateId,
        params.jobId,
        jobTitle,
        params.rawText,
        error.message
      )
    }

    const parseNote =
      error instanceof AIServiceError
        ? error.message
        : '简历自动解析失败，请稍后在简历档案中重新触发解析'

    console.error('POST /api/resume/upload auto-parse error:', error)
    return ensureFailedProfile(
      params.candidateId,
      params.jobId,
      jobTitle,
      params.rawText,
      parseNote
    )
  }
}

/**
 * Uploads a resume, extracts text, updates or creates a candidate, and triggers profile auto-parsing.
 */
export const POST: RequestHandler = async ({ request }) => {
  // Content-Length pre-check
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_FILE_SIZE) {
    return json({ success: false, error: '文件大小超出限制（最大 10MB）' }, { status: 413 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return json(
      { success: false, error: 'Content-Type must be multipart/form-data' },
      { status: 400 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return json({ success: false, error: 'Failed to parse form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return json({ success: false, error: '请上传简历文件' }, { status: 400 })
  }

  if (file.size === 0) {
    return json({ success: false, error: '上传的文件为空' }, { status: 400 })
  }

  const candidateId = formData.get('candidateId')
  const createCandidateRaw = formData.get('createCandidate')
  const createCandidate = createCandidateRaw === 'true' || createCandidateRaw === '1'
  const jobId = formData.get('jobId')

  let parsed
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    parsed = await parseResume(buffer, file.name)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isUnsupported =
      message.includes('不支持的文件格式') || message.includes('无法确定文件类型')
    const isTooLarge = message.includes('超出限制')
    if (isTooLarge) {
      return json({ success: false, error: message }, { status: 413 })
    }
    if (isUnsupported) {
      return json({ success: false, error: message }, { status: 400 })
    }
    console.error('POST /api/resume/upload parseResume error:', error)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }

  let resolvedCandidateId: string | undefined
  let resolvedJobId: string | undefined
  let autoParseResult: AutoParseResult = {}

  try {
    if (typeof candidateId === 'string' && candidateId) {
      const existing = candidateDAO.getById(candidateId)
      if (!existing) {
        return json({ success: false, error: 'Candidate not found' }, { status: 404 })
      }

      candidateDAO.update(candidateId, { resumeText: parsed.text })
      resolvedCandidateId = candidateId
      resolvedJobId = existing.jobId
    } else if (createCandidate) {
      if (typeof jobId !== 'string' || !jobId) {
        return json(
          { success: false, error: 'jobId is required when creating a candidate' },
          { status: 400 }
        )
      }

      const basename = path.basename(file.name, path.extname(file.name))
      const candidate = candidateDAO.create({
        jobId,
        name: basename || '未命名候选人',
        phone: '',
        email: '',
        resumeText: parsed.text,
        skills: [],
        experience: 0,
        education: ''
      })
      resolvedCandidateId = candidate.id
      resolvedJobId = jobId
    }
  } catch (error) {
    console.error('POST /api/resume/upload candidate create/update error:', error)
    return json({ success: false, error: '服务器内部错误' }, { status: 500 })
  }

  if (resolvedCandidateId && resolvedJobId && parsed.text) {
    autoParseResult = await autoParseResumeProfile({
      candidateId: resolvedCandidateId,
      jobId: resolvedJobId,
      rawText: parsed.text
    })
  }

  const status = createCandidate && resolvedCandidateId ? 201 : 200
  return json(
    {
      success: true,
      data: {
        text: parsed.text,
        metadata: parsed.metadata,
        ...(resolvedCandidateId !== undefined ? { candidateId: resolvedCandidateId } : {}),
        ...(autoParseResult.profileId !== undefined ? { profileId: autoParseResult.profileId } : {}),
        ...(autoParseResult.parseStatus !== undefined
          ? { parseStatus: autoParseResult.parseStatus }
          : {}),
        ...(autoParseResult.parseNote !== undefined ? { parseNote: autoParseResult.parseNote } : {})
      }
    },
    { status }
  )
}
