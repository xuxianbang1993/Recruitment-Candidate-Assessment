<script lang="ts">
  import { onMount } from 'svelte'
  import ResumeUploader from '$lib/components/ResumeUploader.svelte'
  import CandidateCard from '$lib/components/CandidateCard.svelte'
  import type { Candidate } from '$lib/types'

  let candidates = $state<Candidate[]>([])
  let keyword = $state('')
  let loading = $state(false)
  let searchDebounce: ReturnType<typeof setTimeout>

  async function fetchCandidates(kw = '') {
    loading = true
    try {
      const url = kw ? `/api/candidates?keyword=${encodeURIComponent(kw)}` : '/api/candidates'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        candidates = data.candidates ?? data ?? []
      }
    } catch {
      // silently ignore
    } finally {
      loading = false
    }
  }

  function handleSearch() {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => fetchCandidates(keyword), 350)
  }

  function handleUpload(candidate: unknown) {
    candidates = [candidate as Candidate, ...candidates]
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        candidates = candidates.filter((c) => c.id !== id)
      }
    } catch {
      // silently ignore
    }
  }

  onMount(() => {
    fetchCandidates()
  })
</script>

<svelte:head>
  <title>简历管理 - 智聘评估</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-xl font-bold" style="color: #1A1D23;">简历管理</h1>
    <p class="text-sm mt-0.5" style="color: #6B7280;">上传候选人简历，系统自动解析关键信息</p>
  </div>
  <div
    class="text-sm px-3 py-1.5 rounded-lg"
    style="background: rgba(212,118,60,0.08); color: #D4763C;"
  >
    共 {candidates.length} 位候选人
  </div>
</div>

<!-- Upload Area -->
<div class="mb-6">
  <ResumeUploader onupload={handleUpload} />
</div>

<!-- Search Bar -->
<div class="mb-4 flex items-center gap-3">
  <div class="relative flex-1">
    <div class="absolute left-3 top-1/2 -translate-y-1/2" style="color: #6B7280;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </div>
    <input
      type="text"
      placeholder="搜索候选人姓名、技能、职位..."
      bind:value={keyword}
      oninput={handleSearch}
      class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
      style="
        background: #FFFFFF;
        border: 1px solid #E8E5E0;
        color: #1A1D23;
      "
    />
  </div>
  <button
    onclick={() => { keyword = ''; fetchCandidates() }}
    class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
    style="background: #FFFFFF; border: 1px solid #E8E5E0; color: #6B7280;"
  >
    重置
  </button>
</div>

<!-- Candidate List -->
{#if loading}
  <div class="flex items-center justify-center py-16">
    <div
      class="w-8 h-8 rounded-full border-2 animate-spin"
      style="border-color: #D4763C transparent transparent transparent;"
    ></div>
    <span class="ml-3 text-sm" style="color: #6B7280;">加载中...</span>
  </div>
{:else if candidates.length === 0}
  <div
    class="flex flex-col items-center justify-center py-20 rounded-2xl"
    style="background: #FFFFFF; border: 1px solid #E8E5E0;"
  >
    <div
      class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style="background: rgba(212,118,60,0.08);"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4763C" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <p class="text-sm font-medium mb-1" style="color: #1A1D23;">
      {keyword ? '未找到匹配的候选人' : '暂无候选人'}
    </p>
    <p class="text-xs" style="color: #6B7280;">
      {keyword ? '请尝试其他关键词' : '上传简历后，候选人将在此显示'}
    </p>
  </div>
{:else}
  <div class="space-y-3">
    {#each candidates as candidate (candidate.id)}
      <CandidateCard {candidate} ondelete={handleDelete} />
    {/each}
  </div>
{/if}
