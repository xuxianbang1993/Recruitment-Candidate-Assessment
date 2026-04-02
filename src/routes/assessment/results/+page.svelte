<script lang="ts">
  import { onMount } from 'svelte'
  import ScoreCard from '$lib/components/ScoreCard.svelte'
  import CandidateCompare from '$lib/components/CandidateCompare.svelte'
  import RadarChart from '$lib/components/RadarChart.svelte'
  import type { Assessment, Candidate, Job } from '$lib/types'

  type Tab = 'overview' | 'compare' | 'radar'

  let activeTab = $state<Tab>('overview')
  let assessments = $state<Assessment[]>([])
  let candidates = $state<Candidate[]>([])
  let jobs = $state<Job[]>([])
  let loading = $state(false)
  let evaluating = $state(false)
  let evalError = $state('')
  let selectedJobId = $state('')
  let selectedRadarIdx = $state(0)
  let selectedForCompare = $state<Set<string>>(new Set())

  // Sorted assessments by total score descending
  let sortedAssessments = $derived(
    [...assessments].sort((a, b) => b.totalScore - a.totalScore)
  )

  function getCandidateById(id: string): Candidate | undefined {
    return candidates.find(c => c.id === id)
  }

  function getJobById(id: string): Job | undefined {
    return jobs.find(j => j.id === id)
  }

  async function fetchData() {
    loading = true
    try {
      const [aRes, cRes, jRes] = await Promise.all([
        fetch('/api/assessments'),
        fetch('/api/candidates'),
        fetch('/api/jobs'),
      ])
      if (aRes.ok) {
        const d = await aRes.json()
        assessments = d.success ? (d.data ?? []) : []
      }
      if (cRes.ok) {
        const d = await cRes.json()
        candidates = d.success ? (d.data ?? []) : []
      }
      if (jRes.ok) {
        const d = await jRes.json()
        jobs = d.success ? (d.data ?? []) : []
        if (jobs.length > 0 && !selectedJobId) {
          selectedJobId = jobs[0].id
        }
      }
    } catch {
      // silently ignore
    } finally {
      loading = false
    }
  }

  async function handleEvaluate() {
    if (!selectedJobId || candidates.length === 0) return
    evalError = ''
    evaluating = true
    let successCount = 0
    let failCount = 0
    try {
      for (const candidate of candidates) {
        try {
          const res = await fetch('/api/ai/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId: candidate.id, jobId: selectedJobId }),
          })
          if (res.ok) {
            successCount++
          } else {
            failCount++
            const err = await res.json().catch(() => ({}))
            console.error(`评估 ${candidate.name} 失败:`, err.error)
          }
        } catch {
          failCount++
        }
      }
      if (failCount > 0 && successCount === 0) {
        evalError = '评估失败，请检查 AI 配置后重试'
      } else if (failCount > 0) {
        evalError = `${successCount} 人评估成功，${failCount} 人失败`
      }
      await fetchData()
    } catch {
      evalError = '网络错误，请重试'
    } finally {
      evaluating = false
    }
  }

  // Filtered assessments for selected job
  let filteredAssessments = $derived(
    selectedJobId
      ? sortedAssessments.filter(a => a.jobId === selectedJobId)
      : sortedAssessments
  )

  // Radar data for selected candidate
  let radarAssessment = $derived(filteredAssessments[selectedRadarIdx])

  let compareCount = $derived(selectedForCompare.size)

  function toggleCompare(id: string) {
    const next = new Set(selectedForCompare)
    if (next.has(id)) {
      next.delete(id)
    } else if (next.size < 5) {
      next.add(id)
    }
    selectedForCompare = next
  }

  function startCompare() {
    if (compareCount >= 2) activeTab = 'compare'
  }

  let compareAssessments = $derived(
    filteredAssessments.filter((a) => selectedForCompare.has(a.id))
  )

  onMount(() => {
    fetchData()
  })
</script>

<svelte:head>
  <title>智能分析 - 智聘评估</title>
</svelte:head>

<!-- Page Header -->
<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h1 class="text-xl font-bold" style="color: #1A1D23;">智能分析</h1>
    <p class="text-sm mt-0.5" style="color: #6B7280;">候选人评估排名与多维度对比分析</p>
  </div>

  <!-- Job Selector + Evaluate Button -->
  <div class="flex items-center gap-3">
    {#if jobs.length > 0}
      <select
        bind:value={selectedJobId}
        class="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
        style="background: #FFFFFF; border: 1px solid #E8E5E0; color: #1A1D23;"
      >
        {#each jobs as job}
          <option value={job.id}>{job.title}</option>
        {/each}
      </select>
    {/if}
    <button
      onclick={handleEvaluate}
      disabled={evaluating || !selectedJobId || candidates.length === 0}
      class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      style="background: #D4763C;"
    >
      {#if evaluating}
        <div
          class="w-4 h-4 rounded-full border-2 animate-spin"
          style="border-color: rgba(255,255,255,0.8) transparent transparent transparent;"
        ></div>
        评估中...
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        开始分析
      {/if}
    </button>
  </div>
</div>

<!-- Error Alert -->
{#if evalError}
  <div
    class="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
    style="background: rgba(199,84,80,0.08); border: 1px solid rgba(199,84,80,0.2); color: #C75450;"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {evalError}
  </div>
{/if}

{#if loading}
  <div class="flex items-center justify-center py-16">
    <div
      class="w-8 h-8 rounded-full border-2 animate-spin"
      style="border-color: #D4763C transparent transparent transparent;"
    ></div>
    <span class="ml-3 text-sm" style="color: #6B7280;">加载中...</span>
  </div>
{:else if filteredAssessments.length === 0}
  <!-- Empty State -->
  <div
    class="flex flex-col items-center justify-center py-20 rounded-2xl"
    style="background: #FFFFFF; border: 1px solid #E8E5E0;"
  >
    <div
      class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style="background: rgba(212,118,60,0.08);"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4763C" stroke-width="1.5">
        <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
        <path d="M15 13v-2a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2"/>
        <path d="M21 13v-8a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
      </svg>
    </div>
    <p class="text-sm font-medium mb-1" style="color: #1A1D23;">暂无评估数据</p>
    <p class="text-xs mb-5" style="color: #6B7280;">
      {candidates.length === 0 ? '请先上传候选人简历' : jobs.length === 0 ? '请先创建岗位需求' : '点击「开始分析」对候选人进行 AI 评估'}
    </p>
    {#if candidates.length > 0 && jobs.length > 0}
      <button
        onclick={handleEvaluate}
        disabled={evaluating}
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
        style="background: #D4763C;"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        开始分析
      </button>
    {/if}
  </div>
{:else}
  <!-- Summary Stats -->
  <div class="grid grid-cols-3 gap-4 mb-6">
    <div
      class="p-4 rounded-xl text-center"
      style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
    >
      <div class="text-2xl font-bold mb-0.5" style="color: #D4763C;">
        {filteredAssessments.length}
      </div>
      <div class="text-xs" style="color: #6B7280;">已评估候选人</div>
    </div>
    <div
      class="p-4 rounded-xl text-center"
      style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
    >
      <div class="text-2xl font-bold mb-0.5" style="color: #3B9B6D;">
        {filteredAssessments.length > 0 ? Math.round(filteredAssessments.reduce((s, a) => s + a.totalScore, 0) / filteredAssessments.length) : 0}
      </div>
      <div class="text-xs" style="color: #6B7280;">平均评分</div>
    </div>
    <div
      class="p-4 rounded-xl text-center"
      style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
    >
      <div class="text-2xl font-bold mb-0.5" style="color: #D4763C;">
        {sortedAssessments[0] ? sortedAssessments[0].totalScore : '-'}
      </div>
      <div class="text-xs" style="color: #6B7280;">最高评分</div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-0 mb-5 p-1 rounded-xl w-fit" style="background: #F7F5F2; border: 1px solid #E8E5E0;">
    {#each [
      { key: 'overview', label: '排名总览' },
      { key: 'compare', label: '横向对比' },
      { key: 'radar', label: '雷达图' },
    ] as tab}
      <button
        onclick={() => (activeTab = tab.key as Tab)}
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        style="
          background: {activeTab === tab.key ? '#FFFFFF' : 'transparent'};
          color: {activeTab === tab.key ? '#1A1D23' : '#6B7280'};
          box-shadow: {activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'};
        "
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab: Overview -->
  {#if activeTab === 'overview'}
    <div class="space-y-3">
      {#each filteredAssessments as a, i}
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedForCompare.has(a.id)}
            onchange={() => toggleCompare(a.id)}
            disabled={!selectedForCompare.has(a.id) && compareCount >= 5}
            class="w-4 h-4 rounded accent-[#D4763C] cursor-pointer shrink-0"
          />
          <div class="flex-1">
            <ScoreCard
              assessment={a}
              candidate={getCandidateById(a.candidateId)}
              rank={i + 1}
            />
          </div>
        </div>
      {/each}
    </div>

    <!-- Floating Compare Button -->
    {#if compareCount >= 2}
      <div class="fixed bottom-6 right-6 z-50">
        <button
          onclick={startCompare}
          class="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg transition-all duration-200 hover:opacity-90"
          style="background: var(--color-info, #4A7FC7);"
        >
          对比 {compareCount} 人
        </button>
      </div>
    {/if}

  <!-- Tab: Compare -->
  {:else if activeTab === 'compare'}
    <div
      class="rounded-2xl overflow-x-auto"
      style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); max-width: 100%;"
    >
      <CandidateCompare assessments={compareAssessments.length >= 2 ? compareAssessments : filteredAssessments} {candidates} />
    </div>

  <!-- Tab: Radar -->
  {:else if activeTab === 'radar'}
    <div class="grid grid-cols-3 gap-4">
      <!-- Candidate Selector -->
      <div class="space-y-2">
        {#each filteredAssessments as a, i}
          <button
            onclick={() => (selectedRadarIdx = i)}
            class="w-full text-left p-3 rounded-xl text-sm transition-all duration-200"
            style="
              background: {selectedRadarIdx === i ? 'rgba(212,118,60,0.08)' : '#FFFFFF'};
              border: 1px solid {selectedRadarIdx === i ? '#D4763C' : '#E8E5E0'};
              color: #1A1D23;
            "
          >
            <div class="font-medium text-xs">{getCandidateById(a.candidateId)?.name ?? '候选人'}</div>
            <div class="text-xs mt-0.5" style="color: {selectedRadarIdx === i ? '#D4763C' : '#6B7280'};">
              综合评分 {a.totalScore}
            </div>
          </button>
        {/each}
      </div>

      <!-- Radar Chart -->
      <div
        class="col-span-2 p-5 rounded-xl"
        style="background: #FFFFFF; border: 1px solid #E8E5E0;"
      >
        {#if radarAssessment && radarAssessment.scores.length > 0}
          <div class="text-sm font-semibold mb-3" style="color: #1A1D23;">
            {getCandidateById(radarAssessment.candidateId)?.name ?? '候选人'} — 维度雷达图
          </div>
          <div style="max-height: 300px;">
            <RadarChart
              scores={radarAssessment.scores.map(s => ({ name: s.name, score: s.score }))}
              candidateName={getCandidateById(radarAssessment.candidateId)?.name ?? '候选人'}
            />
          </div>

          <!-- Dimension Detail -->
          <div class="mt-4 grid grid-cols-2 gap-2">
            {#each radarAssessment.scores as dim}
              <div class="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg" style="background: #F7F5F2;">
                <span style="color: #6B7280;">{dim.name}</span>
                <span class="font-semibold" style="color: {dim.score >= 80 ? '#3B9B6D' : dim.score >= 60 ? '#D4763C' : '#C75450'};">
                  {dim.score} 分
                </span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex items-center justify-center h-40">
            <p class="text-sm" style="color: #6B7280;">请选择候选人查看雷达图</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}
