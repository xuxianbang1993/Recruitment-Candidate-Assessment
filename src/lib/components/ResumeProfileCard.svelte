<script lang="ts">
  import type {
    EducationRecord,
    LanguageSkill,
    ParseStatus,
    ProjectExperience,
    ResumeProfile,
    ResumeProfileFull,
    WorkExperience,
  } from '$lib/types'
  import { PARSE_STATUS } from '$lib/types'
  import { showConfirm } from '$lib/utils/dialog'
  import ExperienceTimeline from './ExperienceTimeline.svelte'

  type EditableBasicInfo = Pick<
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
  >

  type EditableWorkExperience = Omit<WorkExperience, 'id' | 'profileId' | 'sortOrder'>
  type EditableEducationRecord = Omit<EducationRecord, 'id' | 'profileId' | 'sortOrder'>
  type EditableProjectExperience = Omit<ProjectExperience, 'id' | 'profileId' | 'sortOrder'>

  type Props = {
    profile: ResumeProfileFull
    onreparse: () => void | Promise<void>
    ondelete: () => void | Promise<void>
  }

  type ProfileResponse = {
    success: boolean
    data?: ResumeProfileFull
    error?: string
  }

  type StatusMeta = {
    label: string
    background: string
    color: string
    pulse: boolean
  }

  type SummaryField = {
    label: string
    value: string
  }

  const inputClass =
    'w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm outline-none transition-all duration-300'
  const textareaClass = `${inputClass} min-h-24 resize-y leading-6`
  const secondaryButtonClass =
    'inline-flex items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-sm font-medium transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
  const accentButtonClass =
    'inline-flex items-center justify-center rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
  const dangerButtonClass =
    'inline-flex items-center justify-center rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'

  let { profile, onreparse, ondelete }: Props = $props()

  function getInitialProfile(): ResumeProfileFull {
    return profile
  }

  let expanded = $state(false)
  let editing = $state(false)
  let savePending = $state(false)
  let actionPending = $state<'reparse' | 'delete' | ''>('')
  let cardError = $state('')
  let localProfile = $state(cloneProfile(getInitialProfile()))
  let basicInfoDraft = $state(createBasicInfoDraft(getInitialProfile()))
  let workDraft = $state(cloneWorkExperiences(getInitialProfile().workExperiences))
  let educationDraft = $state(cloneEducationHistory(getInitialProfile().educationHistory))
  let projectDraft = $state(cloneProjectExperiences(getInitialProfile().projectExperiences))
  let skillInput = $state('')
  let certificateInput = $state('')
  let languageNameInput = $state('')
  let languageLevelInput = $state('')

  $effect(() => {
    if (editing) return
    localProfile = cloneProfile(profile)
  })

  const statusMeta = $derived(getStatusMeta(localProfile.parseStatus))
  const summaryFields = $derived(getSummaryFields(localProfile))
  const workTimelineItems = $derived(
    localProfile.workExperiences.map((experience) => ({
      title: experience.company,
      subtitle: experience.position,
      period: formatPeriod(experience.startDate, experience.endDate),
      description: experience.description,
    })),
  )
  const educationTimelineItems = $derived(
    localProfile.educationHistory.map((record) => ({
      title: record.school,
      subtitle: [record.major, record.degree].filter(Boolean).join(' | '),
      period: formatPeriod(record.startDate, record.endDate),
    })),
  )
  const projectTimelineItems = $derived(
    localProfile.projectExperiences.map((projectItem) => ({
      title: projectItem.projectName,
      subtitle: projectItem.role,
      period: formatPeriod(projectItem.startDate, projectItem.endDate),
      description: projectItem.description,
    })),
  )

  function cloneLanguages(languages: LanguageSkill[]): LanguageSkill[] {
    return languages.map((item) => ({ ...item }))
  }

  function cloneWorkExperiences(items: WorkExperience[]): EditableWorkExperience[] {
    return items.map((item) => ({
      company: item.company,
      position: item.position,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
    }))
  }

  function cloneEducationHistory(items: EducationRecord[]): EditableEducationRecord[] {
    return items.map((item) => ({
      school: item.school,
      major: item.major,
      degree: item.degree,
      startDate: item.startDate,
      endDate: item.endDate,
    }))
  }

  function cloneProjectExperiences(items: ProjectExperience[]): EditableProjectExperience[] {
    return items.map((item) => ({
      projectName: item.projectName,
      role: item.role,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
    }))
  }

  function cloneProfile(source: ResumeProfileFull): ResumeProfileFull {
    return {
      ...source,
      skills: [...source.skills],
      certificates: [...source.certificates],
      languages: cloneLanguages(source.languages),
      workExperiences: source.workExperiences.map((item) => ({ ...item })),
      educationHistory: source.educationHistory.map((item) => ({ ...item })),
      projectExperiences: source.projectExperiences.map((item) => ({ ...item })),
    }
  }

  function createBasicInfoDraft(source: ResumeProfileFull): EditableBasicInfo {
    return {
      jobTitle: source.jobTitle,
      name: source.name,
      gender: source.gender,
      birthDate: source.birthDate,
      phone: source.phone,
      email: source.email,
      city: source.city,
      highestEducation: source.highestEducation,
      school: source.school,
      major: source.major,
      workYears: source.workYears,
      expectedSalary: source.expectedSalary,
      skills: [...source.skills],
      certificates: [...source.certificates],
      languages: cloneLanguages(source.languages),
      selfEvaluation: source.selfEvaluation,
    }
  }

  function createEmptyWorkExperience(): EditableWorkExperience {
    return {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
    }
  }

  function createEmptyEducationRecord(): EditableEducationRecord {
    return {
      school: '',
      major: '',
      degree: '',
      startDate: '',
      endDate: '',
    }
  }

  function createEmptyProjectExperience(): EditableProjectExperience {
    return {
      projectName: '',
      role: '',
      startDate: '',
      endDate: '',
      description: '',
    }
  }

  function getStatusMeta(status: ParseStatus): StatusMeta {
    switch (status) {
      case PARSE_STATUS.PARSING:
        return {
          label: '解析中',
          background: 'var(--color-info-bg)',
          color: 'var(--color-info)',
          pulse: true,
        }
      case PARSE_STATUS.COMPLETED:
        return {
          label: '已完成',
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          pulse: false,
        }
      case PARSE_STATUS.FAILED:
        return {
          label: '解析失败',
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          pulse: false,
        }
      default:
        return {
          label: '待解析',
          background: 'var(--color-bg-primary)',
          color: 'var(--color-text-secondary)',
          pulse: false,
        }
    }
  }

  function getSummaryFields(source: ResumeProfileFull): SummaryField[] {
    const fields: SummaryField[] = [
      { label: '联系电话', value: source.phone },
      { label: '电子邮箱', value: source.email },
      { label: '所在城市', value: source.city },
      { label: '毕业院校', value: source.school },
      { label: '专业方向', value: source.major },
      { label: '期望薪资', value: source.expectedSalary },
    ]

    return fields.filter((item) => item.value.trim().length > 0)
  }

  function formatPeriod(startDate: string, endDate: string): string {
    const start = startDate.trim() || '未填写'
    const end = endDate.trim() || '至今'
    return `${start} ~ ${end}`
  }

  function hasValue(value: string): boolean {
    return value.trim().length > 0
  }

  function hasAnyValue(values: string[]): boolean {
    return values.some((value) => value.trim().length > 0)
  }

  function resetDrafts(source: ResumeProfileFull): void {
    basicInfoDraft = createBasicInfoDraft(source)
    workDraft = cloneWorkExperiences(source.workExperiences)
    educationDraft = cloneEducationHistory(source.educationHistory)
    projectDraft = cloneProjectExperiences(source.projectExperiences)
    skillInput = ''
    certificateInput = ''
    languageNameInput = ''
    languageLevelInput = ''
  }

  function startEdit(): void {
    editing = true
    cardError = ''
    expanded = true
    resetDrafts(localProfile)
  }

  function cancelEdit(): void {
    editing = false
    cardError = ''
    resetDrafts(localProfile)
  }

  function addSkill(): void {
    const value = skillInput.trim()
    if (!value) return
    basicInfoDraft.skills = [...basicInfoDraft.skills, value]
    skillInput = ''
  }

  function removeSkill(index: number): void {
    basicInfoDraft.skills = basicInfoDraft.skills.filter((_, itemIndex) => itemIndex !== index)
  }

  function addCertificate(): void {
    const value = certificateInput.trim()
    if (!value) return
    basicInfoDraft.certificates = [...basicInfoDraft.certificates, value]
    certificateInput = ''
  }

  function removeCertificate(index: number): void {
    basicInfoDraft.certificates = basicInfoDraft.certificates.filter(
      (_, itemIndex) => itemIndex !== index,
    )
  }

  function addLanguage(): void {
    const language = languageNameInput.trim()
    const level = languageLevelInput.trim()
    if (!language && !level) return
    if (!language || !level) {
      cardError = '请完整填写语言和等级后再添加'
      return
    }

    basicInfoDraft.languages = [...basicInfoDraft.languages, { language, level }]
    languageNameInput = ''
    languageLevelInput = ''
    cardError = ''
  }

  function removeLanguage(index: number): void {
    basicInfoDraft.languages = basicInfoDraft.languages.filter((_, itemIndex) => itemIndex !== index)
  }

  function addWorkExperience(): void {
    workDraft = [...workDraft, createEmptyWorkExperience()]
  }

  function removeWorkExperience(index: number): void {
    workDraft = workDraft.filter((_, itemIndex) => itemIndex !== index)
  }

  function addEducationRecord(): void {
    educationDraft = [...educationDraft, createEmptyEducationRecord()]
  }

  function removeEducationRecord(index: number): void {
    educationDraft = educationDraft.filter((_, itemIndex) => itemIndex !== index)
  }

  function addProjectExperience(): void {
    projectDraft = [...projectDraft, createEmptyProjectExperience()]
  }

  function removeProjectExperience(index: number): void {
    projectDraft = projectDraft.filter((_, itemIndex) => itemIndex !== index)
  }

  function normalizeLanguages(items: LanguageSkill[]): LanguageSkill[] {
    const normalized = items.map((item) => ({
      language: item.language.trim(),
      level: item.level.trim(),
    }))

    const hasIncomplete = normalized.some(
      (item) => (item.language.length > 0 && item.level.length === 0) || (item.language.length === 0 && item.level.length > 0),
    )

    if (hasIncomplete) {
      throw new Error('语言信息需要同时填写语种和等级')
    }

    return normalized.filter((item) => item.language.length > 0 && item.level.length > 0)
  }

  function normalizeBasicInfoDraft(source: EditableBasicInfo): EditableBasicInfo {
    return {
      jobTitle: source.jobTitle.trim(),
      name: source.name.trim(),
      gender: source.gender.trim(),
      birthDate: source.birthDate.trim(),
      phone: source.phone.trim(),
      email: source.email.trim(),
      city: source.city.trim(),
      highestEducation: source.highestEducation.trim(),
      school: source.school.trim(),
      major: source.major.trim(),
      workYears: Number.isFinite(source.workYears) ? source.workYears : 0,
      expectedSalary: source.expectedSalary.trim(),
      skills: source.skills.map((item) => item.trim()).filter(Boolean),
      certificates: source.certificates.map((item) => item.trim()).filter(Boolean),
      languages: normalizeLanguages(source.languages),
      selfEvaluation: source.selfEvaluation.trim(),
    }
  }

  function normalizeWorkExperienceDraft(source: EditableWorkExperience[]): EditableWorkExperience[] {
    return source
      .map((item) => ({
        company: item.company.trim(),
        position: item.position.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
        description: item.description.trim(),
      }))
      .filter((item) =>
        hasAnyValue([item.company, item.position, item.startDate, item.endDate, item.description]),
      )
  }

  function normalizeEducationDraft(source: EditableEducationRecord[]): EditableEducationRecord[] {
    return source
      .map((item) => ({
        school: item.school.trim(),
        major: item.major.trim(),
        degree: item.degree.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
      }))
      .filter((item) => hasAnyValue([item.school, item.major, item.degree, item.startDate, item.endDate]))
  }

  function normalizeProjectDraft(source: EditableProjectExperience[]): EditableProjectExperience[] {
    return source
      .map((item) => ({
        projectName: item.projectName.trim(),
        role: item.role.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
        description: item.description.trim(),
      }))
      .filter((item) =>
        hasAnyValue([item.projectName, item.role, item.startDate, item.endDate, item.description]),
      )
  }

  async function handleSave(): Promise<void> {
    savePending = true
    cardError = ''

    try {
      const response = await fetch(`/api/resume-profiles/${localProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basicInfo: normalizeBasicInfoDraft(basicInfoDraft),
          workExperiences: normalizeWorkExperienceDraft(workDraft),
          educationHistory: normalizeEducationDraft(educationDraft),
          projectExperiences: normalizeProjectDraft(projectDraft),
        }),
      })

      const result = (await response.json().catch(
        (): ProfileResponse => ({ success: false, error: '保存失败，请稍后重试' }),
      )) as ProfileResponse

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? '保存失败，请稍后重试')
      }

      localProfile = cloneProfile(result.data)
      editing = false
      cardError = ''
    } catch (error) {
      cardError = error instanceof Error ? error.message : '保存失败，请稍后重试'
    } finally {
      savePending = false
    }
  }

  async function handleReparse(event: MouseEvent): Promise<void> {
    event.stopPropagation()
    actionPending = 'reparse'
    cardError = ''

    try {
      await Promise.resolve(onreparse())
    } catch (error) {
      cardError = error instanceof Error ? error.message : '重新解析失败，请稍后重试'
    } finally {
      actionPending = ''
    }
  }

  async function handleDelete(event: MouseEvent): Promise<void> {
    event.stopPropagation()
    if (!(await showConfirm('确定要删除这份简历信息吗？\n\n此操作不可撤销。'))) return

    actionPending = 'delete'
    cardError = ''

    try {
      await Promise.resolve(ondelete())
    } catch (error) {
      cardError = error instanceof Error ? error.message : '删除失败，请稍后重试'
    } finally {
      actionPending = ''
    }
  }

  function toggleExpanded(): void {
    expanded = !expanded
  }
</script>

<div
  class="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)] transition-all duration-300"
>
  <div
    role="button"
    tabindex="0"
    class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
    onclick={toggleExpanded}
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggleExpanded()
      }
    }}
  >
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">
          {localProfile.name || '未命名候选人'}
        </h2>

        {#if hasValue(localProfile.gender)}
          <span
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
            style="background: var(--color-accent-bg); color: var(--color-accent);"
          >
            {localProfile.gender}
          </span>
        {/if}

        {#if hasValue(localProfile.highestEducation)}
          <span
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
            style="background: var(--color-info-bg); color: var(--color-info);"
          >
            {localProfile.highestEducation}
          </span>
        {/if}
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-3 text-sm" style="color: var(--color-text-secondary);">
        <span>{localProfile.workYears} 年经验</span>
        <span class="h-1 w-1 rounded-full" style="background: var(--color-border);"></span>
        <span class="truncate">{localProfile.jobTitle || '未绑定岗位'}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span
        class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusMeta.pulse ? 'animate-pulse' : ''}`}
        style={`background: ${statusMeta.background}; color: ${statusMeta.color};`}
      >
        {statusMeta.label}
      </span>

      <button
        type="button"
        class={secondaryButtonClass}
        style="color: var(--color-text-secondary);"
        onclick={handleReparse}
        disabled={actionPending !== ''}
      >
        {actionPending === 'reparse' ? '处理中...' : '重解析'}
      </button>

      <button
        type="button"
        class={dangerButtonClass}
        style="background: var(--color-danger-bg); color: var(--color-danger);"
        onclick={handleDelete}
        disabled={actionPending !== ''}
      >
        {actionPending === 'delete' ? '删除中...' : '删除'}
      </button>

      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-all duration-300 hover:opacity-90"
        style="color: var(--color-text-secondary);"
        onclick={(event) => {
          event.stopPropagation()
          toggleExpanded()
        }}
        aria-label={expanded ? '收起详情' : '展开详情'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          style={`transform: rotate(${expanded ? 180 : 0}deg); transition: var(--transition);`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  </div>

  {#if expanded}
    <div class="border-t border-[var(--color-border)] px-5 pb-5 pt-4">
      {#if cardError}
        <div
          class="mb-4 rounded-[var(--radius)] border px-4 py-3 text-sm"
          style="background: var(--color-danger-bg); border-color: var(--color-border); color: var(--color-danger);"
        >
          {cardError}
        </div>
      {/if}

      {#if localProfile.parseStatus === PARSE_STATUS.FAILED && hasValue(localProfile.parseError)}
        <div
          class="mb-4 rounded-[var(--radius)] border px-4 py-3 text-sm"
          style="background: var(--color-warning-bg); border-color: var(--color-border); color: var(--color-warning);"
        >
          解析异常：{localProfile.parseError}
        </div>
      {/if}

      {#if editing}
        <div class="space-y-6">
          <section class="space-y-3">
            <div class="text-sm font-semibold" style="color: var(--color-text-primary);">基础信息</div>
            <div class="grid gap-3 md:grid-cols-2">
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">目标岗位</span>
                <input bind:value={basicInfoDraft.jobTitle} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">姓名</span>
                <input bind:value={basicInfoDraft.name} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">性别</span>
                <input bind:value={basicInfoDraft.gender} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">出生日期</span>
                <input bind:value={basicInfoDraft.birthDate} class={inputClass} style="color: var(--color-text-primary);" placeholder="如 1994-08" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">联系电话</span>
                <input bind:value={basicInfoDraft.phone} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">电子邮箱</span>
                <input bind:value={basicInfoDraft.email} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">所在城市</span>
                <input bind:value={basicInfoDraft.city} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">最高学历</span>
                <input bind:value={basicInfoDraft.highestEducation} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">毕业院校</span>
                <input bind:value={basicInfoDraft.school} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">专业方向</span>
                <input bind:value={basicInfoDraft.major} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">工作年限</span>
                <input bind:value={basicInfoDraft.workYears} class={inputClass} style="color: var(--color-text-primary);" type="number" min="0" step="0.5" />
              </label>
              <label class="space-y-1">
                <span class="text-xs" style="color: var(--color-text-secondary);">期望薪资</span>
                <input bind:value={basicInfoDraft.expectedSalary} class={inputClass} style="color: var(--color-text-primary);" />
              </label>
              <label class="space-y-1 md:col-span-2">
                <span class="text-xs" style="color: var(--color-text-secondary);">自我评价</span>
                <textarea bind:value={basicInfoDraft.selfEvaluation} class={textareaClass} style="color: var(--color-text-primary);"></textarea>
              </label>
            </div>
          </section>

          <section class="space-y-3">
            <div class="text-sm font-semibold" style="color: var(--color-text-primary);">技能</div>
            <div class="flex flex-wrap gap-2">
              {#each basicInfoDraft.skills as skill, index (`skill-${index}-${skill}`)}
                <span
                  class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                  style="background: var(--color-accent-bg); color: var(--color-accent);"
                >
                  {skill}
                  <button type="button" onclick={() => removeSkill(index)} aria-label={`删除技能 ${skill}`}>×</button>
                </span>
              {/each}
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <input
                bind:value={skillInput}
                class={inputClass}
                style="color: var(--color-text-primary);"
                placeholder="输入技能后回车或点击添加"
                onkeydown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addSkill()
                  }
                }}
              />
              <button type="button" class={secondaryButtonClass} style="color: var(--color-text-primary);" onclick={addSkill}>
                添加技能
              </button>
            </div>
          </section>

          <section class="space-y-3">
            <div class="text-sm font-semibold" style="color: var(--color-text-primary);">证书</div>
            <div class="flex flex-wrap gap-2">
              {#each basicInfoDraft.certificates as certificate, index (`certificate-${index}-${certificate}`)}
                <span
                  class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                  style="background: var(--color-success-bg); color: var(--color-success);"
                >
                  {certificate}
                  <button type="button" onclick={() => removeCertificate(index)} aria-label={`删除证书 ${certificate}`}>×</button>
                </span>
              {/each}
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <input
                bind:value={certificateInput}
                class={inputClass}
                style="color: var(--color-text-primary);"
                placeholder="输入证书名称"
                onkeydown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addCertificate()
                  }
                }}
              />
              <button type="button" class={secondaryButtonClass} style="color: var(--color-text-primary);" onclick={addCertificate}>
                添加证书
              </button>
            </div>
          </section>

          <section class="space-y-3">
            <div class="text-sm font-semibold" style="color: var(--color-text-primary);">语言</div>
            <div class="flex flex-wrap gap-2">
              {#each basicInfoDraft.languages as language, index (`language-${index}-${language.language}-${language.level}`)}
                <span
                  class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                  style="background: var(--color-info-bg); color: var(--color-info);"
                >
                  {language.language}({language.level})
                  <button type="button" onclick={() => removeLanguage(index)} aria-label={`删除语言 ${language.language}`}>×</button>
                </span>
              {/each}
            </div>
            <div class="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input bind:value={languageNameInput} class={inputClass} style="color: var(--color-text-primary);" placeholder="语言" />
              <input bind:value={languageLevelInput} class={inputClass} style="color: var(--color-text-primary);" placeholder="等级" />
              <button type="button" class={secondaryButtonClass} style="color: var(--color-text-primary);" onclick={addLanguage}>
                添加语言
              </button>
            </div>
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">工作经历</div>
              <button type="button" class={secondaryButtonClass} style="color: var(--color-text-primary);" onclick={addWorkExperience}>
                新增工作经历
              </button>
            </div>
            <div class="space-y-3">
              {#each workDraft as experience, index (`work-${index}`)}
                <div class="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="text-sm font-medium" style="color: var(--color-text-primary);">工作经历 {index + 1}</div>
                    <button type="button" class={dangerButtonClass} style="background: var(--color-danger-bg); color: var(--color-danger);" onclick={() => removeWorkExperience(index)}>
                      删除
                    </button>
                  </div>
                  <div class="grid gap-3 md:grid-cols-2">
                    <input bind:value={experience.company} class={inputClass} style="color: var(--color-text-primary);" placeholder="公司名称" />
                    <input bind:value={experience.position} class={inputClass} style="color: var(--color-text-primary);" placeholder="职位名称" />
                    <input bind:value={experience.startDate} class={inputClass} style="color: var(--color-text-primary);" placeholder="开始时间 YYYY-MM" />
                    <input bind:value={experience.endDate} class={inputClass} style="color: var(--color-text-primary);" placeholder="结束时间 YYYY-MM 或 至今" />
                    <textarea bind:value={experience.description} class={`${textareaClass} md:col-span-2`} style="color: var(--color-text-primary);" placeholder="工作内容与成果"></textarea>
                  </div>
                </div>
              {/each}
            </div>
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">教育经历</div>
              <button type="button" class={secondaryButtonClass} style="color: var(--color-text-primary);" onclick={addEducationRecord}>
                新增教育经历
              </button>
            </div>
            <div class="space-y-3">
              {#each educationDraft as record, index (`education-${index}`)}
                <div class="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="text-sm font-medium" style="color: var(--color-text-primary);">教育经历 {index + 1}</div>
                    <button type="button" class={dangerButtonClass} style="background: var(--color-danger-bg); color: var(--color-danger);" onclick={() => removeEducationRecord(index)}>
                      删除
                    </button>
                  </div>
                  <div class="grid gap-3 md:grid-cols-2">
                    <input bind:value={record.school} class={inputClass} style="color: var(--color-text-primary);" placeholder="学校名称" />
                    <input bind:value={record.major} class={inputClass} style="color: var(--color-text-primary);" placeholder="专业" />
                    <input bind:value={record.degree} class={inputClass} style="color: var(--color-text-primary);" placeholder="学历 / 学位" />
                    <input bind:value={record.startDate} class={inputClass} style="color: var(--color-text-primary);" placeholder="开始时间 YYYY-MM" />
                    <input bind:value={record.endDate} class={inputClass} style="color: var(--color-text-primary);" placeholder="结束时间 YYYY-MM" />
                  </div>
                </div>
              {/each}
            </div>
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">项目经验</div>
              <button type="button" class={secondaryButtonClass} style="color: var(--color-text-primary);" onclick={addProjectExperience}>
                新增项目经验
              </button>
            </div>
            <div class="space-y-3">
              {#each projectDraft as projectItem, index (`project-${index}`)}
                <div class="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="text-sm font-medium" style="color: var(--color-text-primary);">项目经验 {index + 1}</div>
                    <button type="button" class={dangerButtonClass} style="background: var(--color-danger-bg); color: var(--color-danger);" onclick={() => removeProjectExperience(index)}>
                      删除
                    </button>
                  </div>
                  <div class="grid gap-3 md:grid-cols-2">
                    <input bind:value={projectItem.projectName} class={inputClass} style="color: var(--color-text-primary);" placeholder="项目名称" />
                    <input bind:value={projectItem.role} class={inputClass} style="color: var(--color-text-primary);" placeholder="角色 / 职责" />
                    <input bind:value={projectItem.startDate} class={inputClass} style="color: var(--color-text-primary);" placeholder="开始时间 YYYY-MM" />
                    <input bind:value={projectItem.endDate} class={inputClass} style="color: var(--color-text-primary);" placeholder="结束时间 YYYY-MM" />
                    <textarea bind:value={projectItem.description} class={`${textareaClass} md:col-span-2`} style="color: var(--color-text-primary);" placeholder="项目描述与成果"></textarea>
                  </div>
                </div>
              {/each}
            </div>
          </section>

          <div class="flex flex-wrap items-center justify-end gap-3">
            <button type="button" class={secondaryButtonClass} style="color: var(--color-text-secondary);" onclick={cancelEdit} disabled={savePending}>
              取消
            </button>
            <button type="button" class={accentButtonClass} onclick={() => void handleSave()} disabled={savePending}>
              {savePending ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>
      {:else}
        <div class="space-y-6">
          {#if summaryFields.length > 0}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">基础信息</div>
              <div class="grid gap-3 md:grid-cols-2">
                {#each summaryFields as field (`summary-${field.label}`)}
                  <div class="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3">
                    <div class="text-xs" style="color: var(--color-text-secondary);">{field.label}</div>
                    <div class="mt-1 text-sm font-medium" style="color: var(--color-text-primary);">{field.value}</div>
                  </div>
                {/each}
              </div>
            </section>
          {/if}

          {#if localProfile.skills.length > 0}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">技能</div>
              <div class="flex flex-wrap gap-2">
                {#each localProfile.skills as skill (`view-skill-${skill}`)}
                  <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    style="background: var(--color-accent-bg); color: var(--color-accent);"
                  >
                    {skill}
                  </span>
                {/each}
              </div>
            </section>
          {/if}

          {#if localProfile.certificates.length > 0}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">证书</div>
              <div class="flex flex-wrap gap-2">
                {#each localProfile.certificates as certificate (`view-certificate-${certificate}`)}
                  <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    style="background: var(--color-success-bg); color: var(--color-success);"
                  >
                    {certificate}
                  </span>
                {/each}
              </div>
            </section>
          {/if}

          {#if localProfile.languages.length > 0}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">语言</div>
              <div class="flex flex-wrap gap-2">
                {#each localProfile.languages as language (`view-language-${language.language}-${language.level}`)}
                  <span
                    class="rounded-full px-3 py-1 text-xs font-medium"
                    style="background: var(--color-info-bg); color: var(--color-info);"
                  >
                    {language.language}({language.level})
                  </span>
                {/each}
              </div>
            </section>
          {/if}

          {#if workTimelineItems.length > 0}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">工作经历</div>
              <ExperienceTimeline items={workTimelineItems} />
            </section>
          {/if}

          {#if educationTimelineItems.length > 0}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">教育经历</div>
              <ExperienceTimeline items={educationTimelineItems} />
            </section>
          {/if}

          {#if projectTimelineItems.length > 0}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">项目经验</div>
              <ExperienceTimeline items={projectTimelineItems} />
            </section>
          {/if}

          {#if hasValue(localProfile.selfEvaluation)}
            <section class="space-y-3">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">自我评价</div>
              <div
                class="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3 text-sm leading-7 whitespace-pre-wrap"
                style="color: var(--color-text-primary);"
              >
                {localProfile.selfEvaluation}
              </div>
            </section>
          {/if}

          <div class="flex justify-end">
            <button type="button" class={accentButtonClass} onclick={startEdit}>
              编辑信息
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
