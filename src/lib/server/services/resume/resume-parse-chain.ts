import type {
  EducationRecord,
  LanguageSkill,
  ParsedResumeData,
  ProjectExperience,
  WorkExperience
} from '$lib/types'

export interface ResumeParseHandler {
  name: string
  setNext(handler: ResumeParseHandler): ResumeParseHandler
  handle(context: ResumeParseContext): Promise<ResumeParseContext>
}

export interface ResumeParseContext {
  rawText: string
  cleanedText: string
  parsedData: ParsedResumeData | null
  error: string | null
}

export type AIChatFunction = (
  messages: Array<{ role: string; content: string }>
) => Promise<string>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function normalizeNullableString(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') {
    throw new Error(`字段 ${fieldName} 必须为字符串或 null`)
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function normalizeStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`字段 ${fieldName} 必须为字符串数组`)
  }

  return value
    .map((item, index) => {
      if (typeof item !== 'string') {
        throw new Error(`字段 ${fieldName}[${index}] 必须为字符串`)
      }

      return item.trim()
    })
    .filter((item) => item.length > 0)
}

function normalizeLanguageSkills(value: unknown): LanguageSkill[] {
  if (!Array.isArray(value)) {
    throw new Error('字段 languages 必须为数组')
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`字段 languages[${index}] 必须为对象`)
    }

    const language = item['language']
    const level = item['level']
    if (typeof language !== 'string' || typeof level !== 'string') {
      throw new Error(`字段 languages[${index}] 的 language 和 level 必须为字符串`)
    }

    return {
      language: language.trim(),
      level: level.trim()
    }
  })
}

function normalizeRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`字段 ${fieldName} 必须为字符串`)
  }

  return value.trim()
}

function isYearMonth(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value)
}

function validateYearMonth(value: string, fieldName: string): string {
  if (value.length === 0) return value
  if (!isYearMonth(value)) {
    throw new Error(`字段 ${fieldName} 必须为 YYYY-MM 格式`)
  }

  return value
}

function toSortValue(date: string): number {
  if (!isYearMonth(date)) return 0
  return Number.parseInt(date.replace('-', ''), 10)
}

function sortByTimeDescending<T extends { startDate: string; endDate: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const rightValue = toSortValue(right.endDate || right.startDate)
    const leftValue = toSortValue(left.endDate || left.startDate)
    return rightValue - leftValue
  })
}

function normalizeWorkExperiences(value: unknown): ParsedResumeData['workExperiences'] {
  if (!Array.isArray(value)) {
    throw new Error('字段 workExperiences 必须为数组')
  }

  const items = value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`字段 workExperiences[${index}] 必须为对象`)
    }

    const normalized: Omit<WorkExperience, 'id' | 'profileId' | 'sortOrder'> = {
      company: normalizeRequiredString(item['company'], `workExperiences[${index}].company`),
      position: normalizeRequiredString(item['position'], `workExperiences[${index}].position`),
      startDate: validateYearMonth(
        normalizeRequiredString(item['startDate'], `workExperiences[${index}].startDate`),
        `workExperiences[${index}].startDate`
      ),
      endDate: validateYearMonth(
        normalizeRequiredString(item['endDate'], `workExperiences[${index}].endDate`),
        `workExperiences[${index}].endDate`
      ),
      description: normalizeRequiredString(
        item['description'],
        `workExperiences[${index}].description`
      )
    }

    return normalized
  })

  return sortByTimeDescending(items)
}

function normalizeEducationHistory(value: unknown): ParsedResumeData['educationHistory'] {
  if (!Array.isArray(value)) {
    throw new Error('字段 educationHistory 必须为数组')
  }

  const items = value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`字段 educationHistory[${index}] 必须为对象`)
    }

    const normalized: Omit<EducationRecord, 'id' | 'profileId' | 'sortOrder'> = {
      school: normalizeRequiredString(item['school'], `educationHistory[${index}].school`),
      major: normalizeRequiredString(item['major'], `educationHistory[${index}].major`),
      degree: normalizeRequiredString(item['degree'], `educationHistory[${index}].degree`),
      startDate: validateYearMonth(
        normalizeRequiredString(item['startDate'], `educationHistory[${index}].startDate`),
        `educationHistory[${index}].startDate`
      ),
      endDate: validateYearMonth(
        normalizeRequiredString(item['endDate'], `educationHistory[${index}].endDate`),
        `educationHistory[${index}].endDate`
      )
    }

    return normalized
  })

  return sortByTimeDescending(items)
}

function normalizeProjectExperiences(value: unknown): ParsedResumeData['projectExperiences'] {
  if (!Array.isArray(value)) {
    throw new Error('字段 projectExperiences 必须为数组')
  }

  const items = value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`字段 projectExperiences[${index}] 必须为对象`)
    }

    const normalized: Omit<ProjectExperience, 'id' | 'profileId' | 'sortOrder'> = {
      projectName: normalizeRequiredString(
        item['projectName'],
        `projectExperiences[${index}].projectName`
      ),
      role: normalizeRequiredString(item['role'], `projectExperiences[${index}].role`),
      startDate: validateYearMonth(
        normalizeRequiredString(item['startDate'], `projectExperiences[${index}].startDate`),
        `projectExperiences[${index}].startDate`
      ),
      endDate: validateYearMonth(
        normalizeRequiredString(item['endDate'], `projectExperiences[${index}].endDate`),
        `projectExperiences[${index}].endDate`
      ),
      description: normalizeRequiredString(
        item['description'],
        `projectExperiences[${index}].description`
      )
    }

    return normalized
  })

  return sortByTimeDescending(items)
}

/**
 * Base class for resume parse chain handlers with short-circuit error propagation.
 */
export abstract class BaseParseHandler implements ResumeParseHandler {
  abstract name: string

  private nextHandler: ResumeParseHandler | null = null

  /**
   * Links the next handler in the chain.
   */
  setNext(handler: ResumeParseHandler): ResumeParseHandler {
    this.nextHandler = handler
    return handler
  }

  /**
   * Handles the current context and forwards it to the next handler when successful.
   */
  async handle(context: ResumeParseContext): Promise<ResumeParseContext> {
    if (context.error) return context

    try {
      const nextContext = await this.process(context)
      if (nextContext.error || !this.nextHandler) {
        return nextContext
      }

      return this.nextHandler.handle(nextContext)
    } catch (error: unknown) {
      return {
        ...context,
        error: toErrorMessage(error)
      }
    }
  }

  protected abstract process(context: ResumeParseContext): Promise<ResumeParseContext>
}

/**
 * Normalizes raw resume text before AI extraction.
 */
export class TextCleanHandler extends BaseParseHandler {
  name = 'TextCleanHandler'

  protected async process(context: ResumeParseContext): Promise<ResumeParseContext> {
    const cleanedText = context.rawText
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (cleanedText.length === 0) {
      return {
        ...context,
        cleanedText,
        error: '简历文本清洗后为空，无法继续解析'
      }
    }

    return {
      ...context,
      cleanedText
    }
  }
}

/**
 * Uses the injected AI chat function to extract structured resume data.
 */
export class AIParseHandler extends BaseParseHandler {
  name = 'AIParseHandler'

  constructor(private readonly aiChat: AIChatFunction) {
    super()
  }

  /**
   * Builds the Chinese AI prompt that requests strict ParsedResumeData JSON output.
   */
  buildParsePrompt(text: string): string {
    const schema = {
      name: null,
      gender: null,
      birthDate: null,
      phone: null,
      email: null,
      city: null,
      highestEducation: null,
      school: null,
      major: null,
      workYears: null,
      expectedSalary: null,
      skills: [''],
      certificates: [''],
      languages: [{ language: '', level: '' }],
      selfEvaluation: null,
      workExperiences: [
        {
          company: '',
          position: '',
          startDate: 'YYYY-MM',
          endDate: 'YYYY-MM',
          description: ''
        }
      ],
      educationHistory: [
        {
          school: '',
          major: '',
          degree: '',
          startDate: 'YYYY-MM',
          endDate: 'YYYY-MM'
        }
      ],
      projectExperiences: [
        {
          projectName: '',
          role: '',
          startDate: 'YYYY-MM',
          endDate: 'YYYY-MM',
          description: ''
        }
      ]
    }

    return [
      '你是一名专业的中文简历结构化解析助手。',
      '请从下面的简历文本中提取信息，并严格输出一个 JSON 对象。',
      '输出要求：',
      '1. 只能输出 JSON，本体外不要有任何说明、前后缀或 markdown 代码块。',
      '2. 顶层字段必须与下面的 ParsedResumeData 结构完全一致。',
      '3. 无法确认的顶层字段请返回 null，不要猜测。',
      '4. skills、certificates、languages 以及三类经历如果没有内容，请返回空数组 []。',
      '5. workExperiences、educationHistory、projectExperiences 中的每一项都必须是对象，字段值必须是字符串；无法确认时使用空字符串 ""。',
      '6. 所有日期统一使用 YYYY-MM 格式；无法确认月份时不要猜测，使用空字符串。',
      '7. 工作经历、教育经历、项目经历必须按时间倒序排列，最近的排在最前面。',
      '8. workYears 必须是数字或 null，不要输出字符串。',
      '9. 请尽量保留原始中文内容，不要翻译。',
      '',
      'ParsedResumeData JSON 结构：',
      JSON.stringify(schema, null, 2),
      '',
      '简历文本如下：',
      text
    ].join('\n')
  }

  /**
   * Extracts the JSON payload from a raw AI response and handles markdown code fences.
   */
  extractJSON(response: string): string {
    const trimmed = response.trim()
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim()
    }

    const startIndex = trimmed.indexOf('{')
    const endIndex = trimmed.lastIndexOf('}')
    if (startIndex >= 0 && endIndex > startIndex) {
      return trimmed.slice(startIndex, endIndex + 1).trim()
    }

    return trimmed
  }

  /**
   * Validates and normalizes a parsed AI payload into ParsedResumeData.
   */
  validateParsedData(data: unknown): ParsedResumeData {
    if (!isRecord(data)) {
      throw new Error('AI 返回结果不是合法的 JSON 对象')
    }

    const workYearsValue = data['workYears']
    if (workYearsValue !== null && workYearsValue !== undefined) {
      if (typeof workYearsValue !== 'number' || !Number.isFinite(workYearsValue)) {
        throw new Error('字段 workYears 必须为数字或 null')
      }
    }

    const birthDate = normalizeNullableString(data['birthDate'], 'birthDate')
    if (birthDate && !isYearMonth(birthDate)) {
      throw new Error('字段 birthDate 必须为 YYYY-MM 格式')
    }

    return {
      name: normalizeNullableString(data['name'], 'name'),
      gender: normalizeNullableString(data['gender'], 'gender'),
      birthDate,
      phone: normalizeNullableString(data['phone'], 'phone'),
      email: normalizeNullableString(data['email'], 'email'),
      city: normalizeNullableString(data['city'], 'city'),
      highestEducation: normalizeNullableString(data['highestEducation'], 'highestEducation'),
      school: normalizeNullableString(data['school'], 'school'),
      major: normalizeNullableString(data['major'], 'major'),
      workYears: workYearsValue === null || workYearsValue === undefined ? null : workYearsValue,
      expectedSalary: normalizeNullableString(data['expectedSalary'], 'expectedSalary'),
      skills: normalizeStringArray(data['skills'], 'skills'),
      certificates: normalizeStringArray(data['certificates'], 'certificates'),
      languages: normalizeLanguageSkills(data['languages']),
      selfEvaluation: normalizeNullableString(data['selfEvaluation'], 'selfEvaluation'),
      workExperiences: normalizeWorkExperiences(data['workExperiences']),
      educationHistory: normalizeEducationHistory(data['educationHistory']),
      projectExperiences: normalizeProjectExperiences(data['projectExperiences'])
    }
  }

  protected async process(context: ResumeParseContext): Promise<ResumeParseContext> {
    const response = await this.aiChat([
      {
        role: 'system',
        content:
          '你是一名严谨的简历结构化解析助手。请严格输出 JSON，不要输出 markdown 代码块。'
      },
      {
        role: 'user',
        content: this.buildParsePrompt(context.cleanedText)
      }
    ])

    const jsonText = this.extractJSON(response)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText) as unknown
    } catch (error: unknown) {
      throw new Error(`AI 返回的内容不是合法 JSON: ${toErrorMessage(error)}`)
    }

    return {
      ...context,
      parsedData: this.validateParsedData(parsed)
    }
  }
}

/**
 * Builds the default resume parse chain and exposes a single execute entry point.
 */
export function buildParseChain(
  aiChat: AIChatFunction
): { execute(rawText: string): Promise<ResumeParseContext> } {
  const cleanHandler = new TextCleanHandler()
  cleanHandler.setNext(new AIParseHandler(aiChat))

  return {
    async execute(rawText: string): Promise<ResumeParseContext> {
      return cleanHandler.handle({
        rawText,
        cleanedText: '',
        parsedData: null,
        error: null
      })
    }
  }
}
