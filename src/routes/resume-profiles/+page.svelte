<script lang="ts">
  import { untrack } from 'svelte'
  import type { Job, ResumeProfileFull } from '$lib/types'
  import ResumeProfileCard from '$lib/components/ResumeProfileCard.svelte'

  type JobsResponse = {
    success: boolean
    data?: Job[]
    error?: string
  }

  type ProfilesResponse = {
    success: boolean
    data?: ResumeProfileFull[]
    error?: string
  }

  type ProfileResponse = {
    success: boolean
    data?: ResumeProfileFull
    error?: string
  }

  type DeleteResponse = {
    success: boolean
    error?: string
  }

  let jobs = $state<Job[]>([])
  let selectedJobId = $state('')
  let profiles = $state<ResumeProfileFull[]>([])
  let loadingJobs = $state(false)
  let loadingProfiles = $state(false)
  let error = $state('')
  let initialized = $state(false)
  let jobsRequestSequence = $state(0)
  let profilesRequestSequence = $state(0)

  const selectedJob = $derived(jobs.find((job) => job.id === selectedJobId) ?? null)
  const profileCountText = $derived(`共 ${profiles.length} 份简历档案`)

  $effect(() => {
    if (initialized) return
    initialized = true
    untrack(() => void fetchJobs())
  })

  $effect(() => {
    const jobId = selectedJobId

    if (!jobId) {
      profiles = []
      return
    }

    untrack(() => void fetchProfiles(jobId))
  })

  async function fetchJobs(): Promise<void> {
    const requestId = jobsRequestSequence + 1
    jobsRequestSequence = requestId
    loadingJobs = true
    error = ''

    try {
      const response = await fetch('/api/jobs')
      const result = (await response.json().catch(
        (): JobsResponse => ({ success: false, error: '加载岗位列表失败' }),
      )) as JobsResponse

      if (requestId !== jobsRequestSequence) return

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? '加载岗位列表失败')
      }

      jobs = result.data ?? []

      if (jobs.length === 0) {
        selectedJobId = ''
        profiles = []
        return
      }

      if (!jobs.some((job) => job.id === selectedJobId)) {
        selectedJobId = jobs[0].id
      }
    } catch (fetchError) {
      if (requestId !== jobsRequestSequence) return
      error = fetchError instanceof Error ? fetchError.message : '加载岗位列表失败'
    } finally {
      if (requestId === jobsRequestSequence) {
        loadingJobs = false
      }
    }
  }

  async function fetchProfiles(jobId: string): Promise<void> {
    const requestId = profilesRequestSequence + 1
    profilesRequestSequence = requestId
    loadingProfiles = true
    error = ''

    try {
      const response = await fetch(`/api/resume-profiles?jobId=${encodeURIComponent(jobId)}`)
      const result = (await response.json().catch(
        (): ProfilesResponse => ({ success: false, error: '加载简历信息失败' }),
      )) as ProfilesResponse

      if (requestId !== profilesRequestSequence) return

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? '加载简历信息失败')
      }

      profiles = result.data ?? []
    } catch (fetchError) {
      if (requestId !== profilesRequestSequence) return
      profiles = []
      error = fetchError instanceof Error ? fetchError.message : '加载简历信息失败'
    } finally {
      if (requestId === profilesRequestSequence) {
        loadingProfiles = false
      }
    }
  }

  async function handleReparse(profileId: string): Promise<void> {
    error = ''

    const response = await fetch(`/api/resume-profiles/${profileId}/reparse`, {
      method: 'POST',
    })
    const result = (await response.json().catch(
      (): ProfileResponse => ({ success: false, error: '重新解析失败，请稍后重试' }),
    )) as ProfileResponse

    if (!response.ok || !result.success || !result.data) {
      const message = result.error ?? '重新解析失败，请稍后重试'
      error = message
      throw new Error(message)
    }

    profiles = profiles.map((profile) => (profile.id === profileId ? result.data! : profile))
  }

  async function handleDelete(profileId: string): Promise<void> {
    error = ''

    const response = await fetch(`/api/resume-profiles/${profileId}`, {
      method: 'DELETE',
    })
    const result = (await response.json().catch(
      (): DeleteResponse => ({ success: false, error: '删除失败，请稍后重试' }),
    )) as DeleteResponse

    if (!response.ok || !result.success) {
      const message = result.error ?? '删除失败，请稍后重试'
      error = message
      throw new Error(message)
    }

    profiles = profiles.filter((profile) => profile.id !== profileId)
  }
</script>

<svelte:head>
  <title>简历信息库 - 智聘评估</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <h1 class="font-[var(--font-display)] text-3xl font-semibold" style="color: var(--color-text-primary);">
        简历信息库
      </h1>
      <p class="mt-1 text-sm" style="color: var(--color-text-secondary);">
        查看、补充并维护候选人的结构化简历档案
      </p>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div
        class="inline-flex items-center rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 text-sm shadow-[var(--shadow-sm)]"
        style="color: var(--color-text-primary);"
      >
        {profileCountText}
      </div>

      {#if loadingJobs}
        <div
          class="h-11 w-full animate-pulse rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-card)] sm:w-72"
        ></div>
      {:else if jobs.length > 0}
        <label class="flex flex-col gap-1">
          <span class="text-xs" style="color: var(--color-text-secondary);">选择岗位</span>
          <select
            bind:value={selectedJobId}
            class="h-11 min-w-0 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-sm outline-none transition-all duration-300 sm:w-72"
            style="color: var(--color-text-primary);"
          >
            {#each jobs as job (job.id)}
              <option value={job.id}>{job.title} — {job.department}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  </div>

  {#if error}
    <div
      class="rounded-[var(--radius)] border px-4 py-3 text-sm"
      style="background: var(--color-danger-bg); border-color: var(--color-border); color: var(--color-danger);"
    >
      {error}
    </div>
  {/if}

  {#if !loadingJobs && jobs.length === 0}
    <div
      class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-8 shadow-[var(--shadow-sm)]"
    >
      <div class="text-base font-medium" style="color: var(--color-text-primary);">暂无岗位</div>
      <p class="mt-2 text-sm" style="color: var(--color-text-secondary);">
        请先在岗位需求中创建岗位，再按岗位查看简历信息库。
      </p>
      <a
        href="/assessment"
        class="mt-4 inline-flex items-center rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90"
      >
        前往岗位需求
      </a>
    </div>
  {:else if selectedJob}
    <div
      class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-4 shadow-[var(--shadow-sm)]"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="text-sm font-medium" style="color: var(--color-text-primary);">
            当前岗位：{selectedJob.title}
          </div>
          <div class="mt-1 text-sm" style="color: var(--color-text-secondary);">
            {selectedJob.department} · {selectedJob.category}
          </div>
        </div>
        <div
          class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
          style="background: var(--color-accent-bg); color: var(--color-accent);"
        >
          档案列表已按岗位过滤
        </div>
      </div>
    </div>
  {/if}

  {#if loadingProfiles}
    <div class="flex items-center justify-center py-20">
      <div
        class="h-9 w-9 animate-spin rounded-full border-2"
        style="border-color: var(--color-accent) transparent transparent transparent;"
      ></div>
      <span class="ml-3 text-sm" style="color: var(--color-text-secondary);">加载简历信息中...</span>
    </div>
  {:else if selectedJobId && profiles.length === 0}
    <div
      class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-16 text-center shadow-[var(--shadow-sm)]"
    >
      <div
        class="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style="background: var(--color-accent-bg); color: var(--color-accent);"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <circle cx="9" cy="12" r="2"></circle>
          <path d="M6.5 17c.6-1.5 2-2.5 3.5-2.5s2.9 1 3.5 2.5"></path>
          <line x1="16" y1="12" x2="18" y2="12"></line>
          <line x1="15" y1="16" x2="18" y2="16"></line>
        </svg>
      </div>
      <p class="mt-4 text-base font-medium" style="color: var(--color-text-primary);">
        暂无简历信息，请先在简历管理中上传简历
      </p>
      <p class="mt-2 text-sm" style="color: var(--color-text-secondary);">
        新上传的简历会自动完成结构化解析并同步到这里。
      </p>
      <a
        href="/candidates"
        class="mt-5 inline-flex items-center rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:opacity-90"
      >
        前往简历管理
      </a>
    </div>
  {:else if profiles.length > 0}
    <div class="space-y-4">
      {#each profiles as profile (profile.id)}
        <ResumeProfileCard
          {profile}
          onreparse={() => handleReparse(profile.id)}
          ondelete={() => handleDelete(profile.id)}
        />
      {/each}
    </div>
  {/if}
</div>
