<script lang="ts">
  import { onMount } from 'svelte'
  import VisualReport from '$lib/components/VisualReport.svelte'
  import type { Candidate, Assessment, Job } from '$lib/types'

  let candidates = $state<Candidate[]>([])
  let selectedCandidateId = $state<string>('')
  let assessments = $state<Assessment[]>([])
  let selectedAssessmentId = $state<string>('')
  let reportText = $state<string>('')
  let reportScore = $state<number | null>(null)
  let selectedJob = $state<Job | null>(null)
  let loadingCandidates = $state(false)
  let loadingAssessments = $state(false)
  let generating = $state(false)
  let error = $state('')

  onMount(async () => {
    loadingCandidates = true
    try {
      const res = await fetch('/api/candidates')
      if (res.ok) {
        const json = await res.json()
        candidates = json.success ? (json.data ?? []) : []
      }
    } catch {
      // ignore
    } finally {
      loadingCandidates = false
    }
  })

  async function onCandidateChange() {
    assessments = []
    selectedAssessmentId = ''
    reportText = ''
    reportScore = null
    error = ''
    if (!selectedCandidateId) return

    loadingAssessments = true
    try {
      const res = await fetch(`/api/assessments?candidateId=${selectedCandidateId}`)
      if (res.ok) {
        const json = await res.json()
        assessments = json.success ? (json.data ?? []) : []
        if (assessments.length === 1) {
          selectedAssessmentId = assessments[0].id
        }
      }
    } catch {
      // ignore
    } finally {
      loadingAssessments = false
    }
  }

  async function generateReport() {
    if (!selectedAssessmentId) return
    generating = true
    error = ''
    reportText = ''
    reportScore = null
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: selectedAssessmentId }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        reportText = json.data?.report ?? ''
        // Score from the assessment itself
        const found = assessments.find((a) => a.id === selectedAssessmentId)
        if (found) {
          reportScore = found.totalScore
          // Fetch job data for visual report
          try {
            const jobRes = await fetch(`/api/jobs/${found.jobId}`)
            if (jobRes.ok) {
              const jobJson = await jobRes.json()
              if (jobJson.success) selectedJob = jobJson.data
            }
          } catch { /* ignore */ }
        }
      } else {
        error = json.error ?? '生成失败，请重试'
      }
    } catch {
      error = '网络错误，请检查连接'
    } finally {
      generating = false
    }
  }

  const selectedCandidate = $derived(candidates.find((c) => c.id === selectedCandidateId))
  const canGenerate = $derived(!!selectedAssessmentId && !generating)
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="font-semibold" style="font-size: 16px; color: #1A1D23;">匹配报告</h1>
    <p class="text-xs mt-1" style="color: #6B7280;">选择候选人，由 AI 生成详细评估报告</p>
  </div>

  <!-- Selector Card -->
  <div
    class="rounded-xl p-5 space-y-4"
    style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
  >
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Candidate -->
      <div>
        <label for="candidateSel" class="block text-xs font-medium mb-1.5" style="color: #6B7280;">选择候选人</label>
        {#if loadingCandidates}
          <div class="h-10 rounded-lg animate-pulse" style="background: #F7F5F2;"></div>
        {:else}
          <select
            id="candidateSel"
            bind:value={selectedCandidateId}
            onchange={onCandidateChange}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
          >
            <option value="">请选择候选人...</option>
            {#each candidates as c}
              <option value={c.id}>{c.name}{c.position ? ` — ${c.position}` : ''}</option>
            {/each}
          </select>
        {/if}
      </div>

      <!-- Assessment -->
      <div>
        <label for="assessmentSel" class="block text-xs font-medium mb-1.5" style="color: #6B7280;">选择评估记录</label>
        {#if loadingAssessments}
          <div class="h-10 rounded-lg animate-pulse" style="background: #F7F5F2;"></div>
        {:else}
          <select
            id="assessmentSel"
            bind:value={selectedAssessmentId}
            disabled={!selectedCandidateId || assessments.length === 0}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23; opacity: {!selectedCandidateId ? '0.5' : '1'};"
          >
            {#if assessments.length === 0}
              <option value="">— 暂无评估记录 —</option>
            {:else}
              <option value="">请选择...</option>
              {#each assessments as a}
                <option value={a.id}>评估 #{a.id}（得分 {a.totalScore}）</option>
              {/each}
            {/if}
          </select>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-between">
      {#if error}
        <div class="text-sm px-3 py-2 rounded-lg flex-1 mr-4" style="background: rgba(199,84,80,0.08); color: #C75450;">
          {error}
        </div>
      {:else}
        <div></div>
      {/if}

      <button
        onclick={generateReport}
        disabled={!canGenerate}
        class="h-10 px-5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 flex-shrink-0"
        style="
          background: {!canGenerate ? '#E8E5E0' : '#D4763C'};
          color: {!canGenerate ? '#6B7280' : '#FFFFFF'};
        "
      >
        {#if generating}
          <span class="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          生成中...
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          生成报告
        {/if}
      </button>
    </div>
  </div>

  <!-- Report Content -->
  {#if reportText}
    <div class="space-y-4">
      {#if selectedJob}
        <VisualReport
          assessment={assessments.find((a) => a.id === selectedAssessmentId)!}
          candidate={selectedCandidate!}
          job={selectedJob}
          {reportText}
        />
      {:else}
        <!-- Fallback: plain text display -->
        <div class="rounded-xl p-5" style="background: #FFFFFF; border: 1px solid #E8E5E0;">
          <div class="report-prose">{@html reportText}</div>
        </div>
      {/if}
    </div>
  {:else if !generating && candidates.length === 0 && !loadingCandidates}
    <div
      class="rounded-xl p-10 text-center"
      style="background: #FFFFFF; border: 1px solid #E8E5E0;"
    >
      <span class="block mb-3" style="color: #E8E5E0;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
      <div class="text-sm" style="color: #6B7280;">暂无候选人，请先上传简历并完成评估</div>
      <a
        href="/candidates"
        class="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium"
        style="background: #D4763C; color: #FFFFFF;"
      >
        去上传简历
      </a>
    </div>
  {:else if selectedCandidateId && assessments.length === 0 && !loadingAssessments}
    <div
      class="rounded-xl p-8 text-center"
      style="background: #FFFFFF; border: 1px solid #E8E5E0;"
    >
      <div class="text-sm" style="color: #6B7280;">该候选人暂无评估记录，请先在「智能分析」页面完成评估</div>
      <a
        href="/assessment/results"
        class="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium"
        style="background: #D4763C; color: #FFFFFF;"
      >
        去评估
      </a>
    </div>
  {/if}
</div>
