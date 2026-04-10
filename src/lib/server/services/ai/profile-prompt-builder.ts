import type {
  EducationRecord,
  ProjectExperience,
  ResumeProfileFull,
  WorkExperience
} from '$lib/types'

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

function formatDateRange(startDate: string, endDate: string): string {
  return `${startDate || '未知'} ~ ${endDate || '至今'}`
}

/**
 * Builder pattern implementation for assembling structured resume profile data into
 * prompt-friendly markdown sections. This keeps AI prompt construction composable,
 * readable, and isolated from the raw data model.
 */
export class ProfilePromptBuilder {
  private readonly sections: string[] = []

  /**
   * Adds the profile's basic information section.
   */
  withBasicInfo(profile: ResumeProfileFull): this {
    const lines = [
      ['姓名', profile.name],
      ['性别', profile.gender],
      ['出生日期', profile.birthDate],
      ['电话', profile.phone],
      ['邮箱', profile.email],
      ['城市', profile.city],
      ['最高学历', profile.highestEducation],
      ['毕业院校', profile.school],
      ['专业', profile.major],
      ['工作年限', profile.workYears > 0 ? `${profile.workYears} 年` : ''],
      ['期望薪资', profile.expectedSalary]
    ]
      .filter(([, value]) => isNonEmpty(value))
      .map(([label, value]) => `- ${label}：${value}`)

    if (lines.length > 0) {
      this.sections.push(['## 候选人基本信息', ...lines].join('\n'))
    }

    return this
  }

  /**
   * Adds skills, certificates, and languages.
   */
  withSkills(profile: ResumeProfileFull): this {
    const lines: string[] = []

    if (profile.skills.length > 0) {
      lines.push(`- 技能：${profile.skills.join('、')}`)
    }
    if (profile.certificates.length > 0) {
      lines.push(`- 证书：${profile.certificates.join('、')}`)
    }
    if (profile.languages.length > 0) {
      lines.push(
        `- 语言：${profile.languages
          .map((item) => `${item.language}(${item.level})`)
          .join('、')}`
      )
    }

    if (lines.length > 0) {
      this.sections.push(['## 技能与资质', ...lines].join('\n'))
    }

    return this
  }

  /**
   * Adds formatted work experience sections.
   */
  withWorkExperiences(experiences: WorkExperience[]): this {
    if (experiences.length === 0) return this

    const lines = experiences.flatMap((experience) => {
      const section = [
        `### ${experience.company} — ${experience.position} (${formatDateRange(experience.startDate, experience.endDate)})`
      ]

      if (isNonEmpty(experience.description)) {
        section.push(experience.description)
      }

      return section
    })

    this.sections.push(['## 工作经历', ...lines].join('\n'))
    return this
  }

  /**
   * Adds formatted education history.
   */
  withEducation(records: EducationRecord[]): this {
    if (records.length === 0) return this

    const lines = records.map(
      (record) =>
        `- ${record.school} / ${record.major} / ${record.degree} (${formatDateRange(record.startDate, record.endDate)})`
    )

    this.sections.push(['## 教育经历', ...lines].join('\n'))
    return this
  }

  /**
   * Adds formatted project experience sections.
   */
  withProjects(projects: ProjectExperience[]): this {
    if (projects.length === 0) return this

    const lines = projects.flatMap((project) => {
      const section = [
        `### ${project.projectName} — ${project.role} (${formatDateRange(project.startDate, project.endDate)})`
      ]

      if (isNonEmpty(project.description)) {
        section.push(project.description)
      }

      return section
    })

    this.sections.push(['## 项目经验', ...lines].join('\n'))
    return this
  }

  /**
   * Adds the self-evaluation section.
   */
  withSelfEvaluation(text: string): this {
    if (!isNonEmpty(text)) return this

    this.sections.push(['## 自我评价', text.trim()].join('\n'))
    return this
  }

  /**
   * Builds the final prompt fragment.
   */
  build(): string {
    return this.sections.join('\n\n')
  }

  /**
   * Creates the complete prompt fragment from a structured resume profile.
   */
  static fromProfile(profile: ResumeProfileFull): string {
    return new ProfilePromptBuilder()
      .withBasicInfo(profile)
      .withSkills(profile)
      .withWorkExperiences(profile.workExperiences)
      .withEducation(profile.educationHistory)
      .withProjects(profile.projectExperiences)
      .withSelfEvaluation(profile.selfEvaluation)
      .build()
  }
}
