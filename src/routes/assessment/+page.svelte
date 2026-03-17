<script lang="ts">
  import { onMount } from 'svelte'
  import JobForm from '$lib/components/JobForm.svelte'
  import type { Job } from '$lib/types'

  let jobs = $state<Job[]>([])
  let loading = $state(false)
  let showForm = $state(false)
  let editingJob = $state<Partial<Job> | undefined>(undefined)
  let saveError = $state('')
  let saveSuccess = $state('')

  async function fetchJobs() {
    loading = true
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const json = await res.json()
        jobs = json.success ? (json.data ?? []) : []
      }
    } catch {
      // silently ignore
    } finally {
      loading = false
    }
  }

  async function handleSubmit(data: Partial<Job>) {
    saveError = ''
    saveSuccess = ''
    const isEdit = Boolean(data.id)
    const url = isEdit ? `/api/jobs/${data.id}` : '/api/jobs'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        saveError = result.error ?? result.message ?? '保存失败，请重试'
        return
      }
      const savedJob: Job = result.data ?? result.job ?? result

      if (isEdit) {
        jobs = jobs.map(j => j.id === savedJob.id ? savedJob : j)
      } else {
        jobs = [savedJob, ...jobs]
      }
      saveSuccess = isEdit ? '岗位更新成功' : '岗位创建成功'
      showForm = false
      editingJob = undefined
      setTimeout(() => (saveSuccess = ''), 3000)
    } catch {
      saveError = '网络错误，请重试'
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除该岗位吗？此操作不可撤销。')) return
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        jobs = jobs.filter(j => j.id !== id)
      }
    } catch {
      // silently ignore
    }
  }

  function startEdit(job: Job) {
    editingJob = job
    showForm = true
    saveError = ''
  }

  function cancelForm() {
    showForm = false
    editingJob = undefined
    saveError = ''
  }

  onMount(() => {
    fetchJobs()
  })
</script>

<svelte:head>
  <title>岗位需求 - 智聘评估</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-xl font-bold" style="color: #1A1D23;">岗位需求</h1>
    <p class="text-sm mt-0.5" style="color: #6B7280;">配置招聘岗位信息与评估维度权重</p>
  </div>
  {#if !showForm}
    <button
      onclick={() => { editingJob = undefined; showForm = true; saveError = '' }}
      class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
      style="background: #D4763C;"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      新建岗位
    </button>
  {/if}
</div>

<!-- Success / Error Alerts -->
{#if saveSuccess}
  <div
    class="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
    style="background: rgba(59,155,109,0.08); border: 1px solid rgba(59,155,109,0.2); color: #3B9B6D;"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    {saveSuccess}
  </div>
{/if}

{#if saveError}
  <div
    class="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
    style="background: rgba(199,84,80,0.08); border: 1px solid rgba(199,84,80,0.2); color: #C75450;"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {saveError}
  </div>
{/if}

<!-- Form Panel -->
{#if showForm}
  <div
    class="mb-6 p-6 rounded-2xl"
    style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: 0 4px 16px rgba(0,0,0,0.06);"
  >
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-semibold" style="color: #1A1D23;">
        {editingJob?.id ? '编辑岗位' : '新建岗位'}
      </h2>
      <button
        onclick={cancelForm}
        aria-label="关闭表单"
        class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
        style="color: #6B7280;"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <JobForm job={editingJob} onsubmit={handleSubmit} oncancel={cancelForm} />
  </div>
{/if}

<!-- Job List -->
{#if loading}
  <div class="flex items-center justify-center py-16">
    <div
      class="w-8 h-8 rounded-full border-2 animate-spin"
      style="border-color: #D4763C transparent transparent transparent;"
    ></div>
    <span class="ml-3 text-sm" style="color: #6B7280;">加载中...</span>
  </div>
{:else if jobs.length === 0 && !showForm}
  <div
    class="flex flex-col items-center justify-center py-20 rounded-2xl"
    style="background: #FFFFFF; border: 1px solid #E8E5E0;"
  >
    <div
      class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style="background: rgba(212,118,60,0.08);"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4763C" stroke-width="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    </div>
    <p class="text-sm font-medium mb-1" style="color: #1A1D23;">暂无岗位需求</p>
    <p class="text-xs mb-4" style="color: #6B7280;">创建岗位后，可对候选人进行智能评估</p>
    <button
      onclick={() => { editingJob = undefined; showForm = true }}
      class="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
      style="background: #D4763C;"
    >
      创建第一个岗位
    </button>
  </div>
{:else}
  <div class="space-y-3">
    {#each jobs as job (job.id)}
      <div
        class="p-5 rounded-xl transition-all duration-200"
        style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold text-sm" style="color: #1A1D23;">{job.title}</h3>
              <span
                class="text-[11px] px-2 py-0.5 rounded-full"
                style="background: rgba(212,118,60,0.08); color: #D4763C;"
              >
                {job.department}
              </span>
            </div>

            {#if job.description}
              <p class="text-xs mb-2 line-clamp-2" style="color: #6B7280;">{job.description}</p>
            {/if}

            <!-- Skills -->
            {#if job.skills && job.skills.length > 0}
              <div class="flex flex-wrap gap-1 mb-2">
                {#each job.skills.slice(0, 5) as skill}
                  <span
                    class="text-[11px] px-2 py-0.5 rounded-full"
                    style="background: #F7F5F2; color: #6B7280; border: 1px solid #E8E5E0;"
                  >
                    {skill}
                  </span>
                {/each}
                {#if job.skills.length > 5}
                  <span
                    class="text-[11px] px-2 py-0.5 rounded-full"
                    style="background: #F7F5F2; color: #6B7280;"
                  >
                    +{job.skills.length - 5}
                  </span>
                {/if}
              </div>
            {/if}

            <!-- Weight Dims -->
            {#if job.weights && job.weights.length > 0}
              <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                {#each job.weights.filter(w => w.weight > 0) as w}
                  <span class="text-xs" style="color: #6B7280;">
                    {w.name} <span style="color: #D4763C; font-weight: 600;">{w.weight}%</span>
                  </span>
                {/each}
              </div>
            {/if}
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              onclick={() => startEdit(job)}
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-80"
              style="background: rgba(212,118,60,0.08); color: #D4763C; border: 1px solid rgba(212,118,60,0.2);"
            >
              编辑
            </button>
            <button
              onclick={() => handleDelete(job.id)}
              aria-label={`删除岗位 ${job.title}`}
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-80"
              style="background: rgba(199,84,80,0.08); color: #C75450; border: 1px solid rgba(199,84,80,0.2);"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
