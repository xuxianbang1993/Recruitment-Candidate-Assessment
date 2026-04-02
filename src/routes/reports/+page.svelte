<script lang="ts">
  import { onMount } from 'svelte'
  import VisualReport from '$lib/components/VisualReport.svelte'
  import AttachmentUploader from '$lib/components/AttachmentUploader.svelte'
  import AttachmentList from '$lib/components/AttachmentList.svelte'
  import type { Candidate, Assessment, Job } from '$lib/types'
  import type { Attachment } from '$lib/server/db/attachment-dao'

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
  let attachments = $state<Attachment[]>([])
  let reEvaluating = $state(false)
  let comprehensiveAssessment = $state<Assessment | null>(null)

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

  async function loadAttachments(assessmentId: string) {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/attachments`)
      if (res.ok) {
        const json = await res.json()
        attachments = json.success ? (json.data ?? []) : []
      }
    } catch { attachments = [] }
  }

  function handleAttachmentUpload(attachment: Attachment) {
    attachments = [...attachments, attachment]
  }

  async function handleAttachmentDelete(id: string) {
    if (!selectedAssessmentId) return
    try {
      await fetch(`/api/assessments/${selectedAssessmentId}/attachments?attachmentId=${id}`, { method: 'DELETE' })
      attachments = attachments.filter((a) => a.id !== id)
    } catch { /* ignore */ }
  }

  async function runReEvaluation() {
    if (!selectedAssessmentId) return
    reEvaluating = true
    error = ''
    try {
      const res = await fetch(`/api/assessments/${selectedAssessmentId}/re-evaluate`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.success) {
        comprehensiveAssessment = json.data
      } else {
        error = json.error ?? '综合评估失败'
      }
    } catch {
      error = '网络错误，请检查连接'
    } finally {
      reEvaluating = false
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
  const selectedAssessment = $derived(assessments.find((a) => a.id === selectedAssessmentId))
  const canGenerate = $derived(!!selectedAssessmentId && !generating)
  const canReEvaluate = $derived(!!selectedAssessmentId && attachments.length > 0 && !reEvaluating)

  $effect(() => {
    if (selectedAssessmentId) {
      loadAttachments(selectedAssessmentId)
      comprehensiveAssessment = null
    } else {
      attachments = []
      comprehensiveAssessment = null
    }
  })
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
  <!-- Attachments & Re-Evaluation -->
  {#if selectedAssessmentId}
    <div class="rounded-xl p-5 space-y-4" style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);">
      <h2 class="text-sm font-semibold" style="color: #1A1D23;">面试补充材料</h2>
      <AttachmentUploader assessmentId={selectedAssessmentId} onupload={handleAttachmentUpload} />
      <AttachmentList {attachments} ondelete={handleAttachmentDelete} />

      {#if attachments.length > 0}
        <div class="flex items-center gap-3 pt-2">
          <button
            onclick={runReEvaluation}
            disabled={!canReEvaluate}
            class="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
            style="
              background: {!canReEvaluate ? '#E8E5E0' : 'var(--color-info, #4A7FC7)'};
              color: {!canReEvaluate ? '#6B7280' : '#FFFFFF'};
            "
          >
            {#if reEvaluating}
              <span class="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              综合评估中...
            {:else}
              综合评估
            {/if}
          </button>
          <span class="text-xs" style="color: #9CA3AF;">基于简历+面试材料重新评分</span>
        </div>
      {/if}
    </div>

    <!-- Comprehensive Result -->
    {#if comprehensiveAssessment}
      <div class="rounded-xl p-5 space-y-3" style="background: rgba(74,127,199,0.04); border: 1px solid rgba(74,127,199,0.2);">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" style="background: var(--color-info, #4A7FC7);"></span>
          <h2 class="text-sm font-semibold" style="color: #1A1D23;">综合评估结果</h2>
          <span class="text-xs px-2 py-0.5 rounded-full" style="background: rgba(74,127,199,0.1); color: var(--color-info, #4A7FC7);">综合</span>
        </div>
        <div class="text-2xl font-bold" style="color: var(--color-info, #4A7FC7);">{comprehensiveAssessment.totalScore} 分</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          {#each comprehensiveAssessment.scores as s}
            <div class="flex justify-between px-3 py-2 rounded-lg" style="background: #FFFFFF;">
              <span style="color: #6B7280;">{s.name}</span>
              <span class="font-medium" style="color: #1A1D23;">{s.score}</span>
            </div>
          {/each}
        </div>
        {#if comprehensiveAssessment.strengths.length > 0}
          <div>
            <p class="text-xs font-medium mb-1" style="color: var(--color-success, #3B9B6D);">优势</p>
            {#each comprehensiveAssessment.strengths as item}
              <p class="text-xs ml-2" style="color: #6B7280;">- {item}</p>
            {/each}
          </div>
        {/if}
        {#if comprehensiveAssessment.weaknesses.length > 0}
          <div>
            <p class="text-xs font-medium mb-1" style="color: var(--color-danger, #C75450);">不足</p>
            {#each comprehensiveAssessment.weaknesses as item}
              <p class="text-xs ml-2" style="color: #6B7280;">- {item}</p>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}

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
