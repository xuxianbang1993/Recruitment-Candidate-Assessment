<script lang="ts">
  import { onMount } from 'svelte'
  import ResumeUploader from '$lib/components/ResumeUploader.svelte'
  import CandidateCard from '$lib/components/CandidateCard.svelte'
  import type { Candidate, Job } from '$lib/types'
  import { showConfirm } from '$lib/utils/dialog'

  let jobs = $state<Job[]>([])
  let selectedJobId = $state('')
  let candidates = $state<Candidate[]>([])
  let keyword = $state('')
  let loading = $state(false)
  let loadingJobs = $state(false)
  let error = $state('')
  let searchDebounce: ReturnType<typeof setTimeout>

  async function fetchJobs() {
    loadingJobs = true
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const json = await res.json()
        jobs = json.success ? (json.data ?? []) : []
        if (jobs.length > 0 && !selectedJobId) {
          selectedJobId = jobs[0].id
        }
      }
    } catch {
      // ignore
    } finally {
      loadingJobs = false
    }
  }

  async function fetchCandidates() {
    if (!selectedJobId) {
      candidates = []
      return
    }
    loading = true
    error = ''
    try {
      const params = new URLSearchParams({ jobId: selectedJobId })
      if (keyword) params.set('keyword', keyword)
      const res = await fetch(`/api/candidates?${params}`)
      if (res.ok) {
        const data = await res.json()
        candidates = data.data ?? []
      } else {
        error = '加载候选人列表失败'
      }
    } catch {
      error = '加载候选人列表失败'
    } finally {
      loading = false
    }
  }

  function handleJobChange() {
    keyword = ''
    fetchCandidates()
  }

  function handleSearch() {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => fetchCandidates(), 350)
  }

  function handleUpload(candidate: Candidate) {
    candidates = [candidate, ...candidates]
  }

  async function handleDelete(id: string) {
    if (!(await showConfirm('确定要删除该候选人吗？\n\n此操作不可撤销。'))) return
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        candidates = candidates.filter((c) => c.id !== id)
      } else {
        error = '删除失败，请重试'
      }
    } catch {
      error = '删除失败，请重试'
    }
  }

  function handleResumeChange(updated: Candidate) {
    candidates = candidates.map((c) => (c.id === updated.id ? updated : c))
  }

  async function handleClearAll() {
    if (!(await showConfirm(`确定要清空该岗位下全部 ${candidates.length} 位候选人吗？\n\n此操作不可撤销。`))) return
    try {
      for (const c of candidates) {
        await fetch(`/api/candidates/${c.id}`, { method: 'DELETE' })
      }
      candidates = []
    } catch {
      error = '清空失败，请重试'
    }
  }

  onMount(async () => {
    await fetchJobs()
    if (selectedJobId) fetchCandidates()
  })
</script>

<svelte:head>
  <title>简历管理 - 智聘评估</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-xl font-bold" style="color: var(--color-text-primary);">简历管理</h1>
    <p class="text-sm mt-0.5" style="color: var(--color-text-secondary);">上传候选人简历，系统自动解析关键信息</p>
  </div>
  <div class="flex items-center gap-2">
    <div
      class="text-sm px-3 py-1.5 rounded-lg"
      style="background: var(--color-accent-bg); color: var(--color-accent);"
    >
      共 {candidates.length} 位候选人
    </div>
    {#if candidates.length > 0}
      <button
        onclick={handleClearAll}
        class="text-sm px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80"
        style="background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid rgba(199,84,80,0.15);"
      >
        清空全部
      </button>
    {/if}
  </div>
</div>

<!-- Error Alert -->
{#if error}
  <div
    class="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
    style="background: var(--color-danger-bg); border: 1px solid rgba(199,84,80,0.2); color: var(--color-danger);"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {error}
  </div>
{/if}

<!-- Job Selector -->
<div class="mb-4">
  {#if loadingJobs}
    <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-card);"></div>
  {:else if jobs.length === 0}
    <div
      class="px-4 py-3 rounded-xl text-sm"
      style="background: var(--color-accent-bg); border: 1px solid rgba(212,118,60,0.2); color: var(--color-accent);"
    >
      暂无岗位，请先在「岗位需求」中创建岗位
      <a href="/assessment" class="underline font-medium ml-1">去创建</a>
    </div>
  {:else}
    <select
      bind:value={selectedJobId}
      onchange={handleJobChange}
      class="w-full h-10 px-3 rounded-lg text-sm outline-none cursor-pointer"
      style="background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-primary);"
    >
      {#each jobs as job}
        <option value={job.id}>{job.title} — {job.department}</option>
      {/each}
    </select>
  {/if}
</div>

<!-- Upload Area -->
{#if selectedJobId}
  <div class="mb-6">
    <ResumeUploader onupload={handleUpload} jobId={selectedJobId} />
  </div>
{/if}

<!-- Search Bar -->
{#if selectedJobId}
  <div class="mb-4 flex items-center gap-3">
    <div class="relative flex-1">
      <div class="absolute left-3 top-1/2 -translate-y-1/2" style="color: var(--color-text-secondary);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <input
        type="text"
        placeholder="搜索候选人姓名..."
        bind:value={keyword}
        oninput={handleSearch}
        class="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
        style="
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
        "
      />
    </div>
    <button
      onclick={() => { keyword = ''; fetchCandidates() }}
      class="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
      style="background: var(--color-bg-card); border: 1px solid var(--color-border); color: var(--color-text-secondary);"
    >
      重置
    </button>
  </div>
{/if}

<!-- Candidate List -->
{#if loading}
  <div class="flex items-center justify-center py-16">
    <div
      class="w-8 h-8 rounded-full border-2 animate-spin"
      style="border-color: var(--color-accent) transparent transparent transparent;"
    ></div>
    <span class="ml-3 text-sm" style="color: var(--color-text-secondary);">加载中...</span>
  </div>
{:else if !selectedJobId}
  <!-- no job selected, empty state handled by job selector -->
{:else if candidates.length === 0}
  <div
    class="flex flex-col items-center justify-center py-20 rounded-2xl"
    style="background: var(--color-bg-card); border: 1px solid var(--color-border);"
  >
    <div
      class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style="background: var(--color-accent-bg);"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <p class="text-sm font-medium mb-1" style="color: var(--color-text-primary);">
      {keyword ? '未找到匹配的候选人' : '该岗位暂无候选人'}
    </p>
    <p class="text-xs" style="color: var(--color-text-secondary);">
      {keyword ? '请尝试其他关键词' : '上传简历后，候选人将在此显示'}
    </p>
  </div>
{:else}
  <div class="space-y-3">
    {#each candidates as candidate (candidate.id)}
      <CandidateCard {candidate} ondelete={handleDelete} onresumechange={handleResumeChange} />
    {/each}
  </div>
{/if}
