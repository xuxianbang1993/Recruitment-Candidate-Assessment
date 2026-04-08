<script lang="ts">
  import { onMount } from 'svelte'
  import VisualReport from '$lib/components/VisualReport.svelte'
  import AttachmentUploader from '$lib/components/AttachmentUploader.svelte'
  import AttachmentList from '$lib/components/AttachmentList.svelte'
  import type { Candidate, Assessment, Job, Attachment } from '$lib/types'

  let jobs = $state<Job[]>([])
  let selectedJobId = $state<string>('')
  let loadingJobs = $state(false)
  let candidates = $state<Candidate[]>([])
  let selectedCandidateId = $state<string>('')
  let assessments = $state<Assessment[]>([])
  let selectedAssessmentId = $state<string>('')
  let reportText = $state<string>('')
  let reportScore = $state<number | null>(null)
  let selectedJobData = $state<Job | null>(null)
  let loadingCandidates = $state(false)
  let loadingAssessments = $state(false)
  let generating = $state(false)
  let error = $state('')
  let attachments = $state<Attachment[]>([])
  let reEvaluating = $state(false)
  let comprehensiveAssessment = $state<Assessment | null>(null)

  // Dynamic import for SSR safety — DOMPurify requires browser DOM APIs
  let purify = $state<{ sanitize: (html: string) => string } | undefined>(undefined)
  const sanitizedReportText = $derived(purify ? purify.sanitize(reportText) : '')

  onMount(async () => {
    // Load DOMPurify dynamically to avoid SSR crash
    const mod = await import('dompurify')
    purify = mod.default

    loadingJobs = true
    try {
      const res = await fetch('/api/jobs')
      if (res.ok) {
        const json = await res.json()
        jobs = json.success ? (json.data ?? []) : []
        if (jobs.length > 0) {
          selectedJobId = jobs[0].id
        }
      }
    } catch {
      // ignore
    } finally {
      loadingJobs = false
    }
  })

  // Request sequence counter to discard stale responses on rapid job switching
  let jobChangeSeq = 0

  async function onJobChange() {
    candidates = []
    selectedCandidateId = ''
    assessments = []
    selectedAssessmentId = ''
    reportText = ''
    reportScore = null
    error = ''
    if (!selectedJobId) return

    const seq = ++jobChangeSeq
    loadingCandidates = true
    try {
      const res = await fetch(`/api/candidates?jobId=${selectedJobId}`)
      if (seq !== jobChangeSeq) return // stale response, discard
      if (res.ok) {
        const json = await res.json()
        candidates = json.success ? (json.data ?? []) : []
      }
    } catch {
      // ignore
    } finally {
      if (seq === jobChangeSeq) loadingCandidates = false
    }
  }

  // React to all selectedJobId changes (including reset to empty)
  $effect(() => {
    // Read selectedJobId to establish dependency
    const _jobId = selectedJobId
    onJobChange()
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
              if (jobJson.success) selectedJobData = jobJson.data
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
    <h1 class="text-base font-semibold" style="color: var(--color-text-primary);">匹配报告</h1>
    <p class="text-xs mt-1" style="color: var(--color-text-secondary);">选择岗位和候选人，由 AI 生成详细评估报告</p>
  </div>

  <!-- Selector Card -->
  <div
    class="rounded-xl p-5 space-y-4"
    style="background: var(--color-bg-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);"
  >
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <!-- Job -->
      <div>
        <label for="jobSel" class="block text-xs font-medium mb-1.5" style="color: var(--color-text-secondary);">选择岗位</label>
        {#if loadingJobs}
          <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-primary);"></div>
        {:else}
          <select
            id="jobSel"
            bind:value={selectedJobId}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: var(--color-bg-primary); border: 1px solid var(--color-border); color: var(--color-text-primary);"
          >
            <option value="">请选择岗位...</option>
            {#each jobs as j}
              <option value={j.id}>{j.title} — {j.department}</option>
            {/each}
          </select>
        {/if}
      </div>

      <!-- Candidate -->
      <div>
        <label for="candidateSel" class="block text-xs font-medium mb-1.5" style="color: var(--color-text-secondary);">选择候选人</label>
        {#if loadingCandidates}
          <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-primary);"></div>
        {:else}
          <select
            id="candidateSel"
            bind:value={selectedCandidateId}
            onchange={onCandidateChange}
            disabled={!selectedJobId || candidates.length === 0}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: var(--color-bg-primary); border: 1px solid var(--color-border); color: var(--color-text-primary); opacity: {!selectedJobId ? '0.5' : '1'};"
          >
            {#if candidates.length === 0}
              <option value="">— 暂无候选人 —</option>
            {:else}
              <option value="">请选择候选人...</option>
              {#each candidates as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            {/if}
          </select>
        {/if}
      </div>

      <!-- Assessment -->
      <div>
        <label for="assessmentSel" class="block text-xs font-medium mb-1.5" style="color: var(--color-text-secondary);">选择评估记录</label>
        {#if loadingAssessments}
          <div class="h-10 rounded-lg animate-pulse" style="background: var(--color-bg-primary);"></div>
        {:else}
          <select
            id="assessmentSel"
            bind:value={selectedAssessmentId}
            disabled={!selectedCandidateId || assessments.length === 0}
            class="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style="background: var(--color-bg-primary); border: 1px solid var(--color-border); color: var(--color-text-primary); opacity: {!selectedCandidateId ? '0.5' : '1'};"
          >
            {#if assessments.length === 0}
              <option value="">— 暂无评估记录 —</option>
            {:else}
              <option value="">请选择...</option>
              {#each assessments as a}
                <option value={a.id}>评估（得分 {a.totalScore}）</option>
              {/each}
            {/if}
          </select>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-between">
      {#if error}
        <div class="text-sm px-3 py-2 rounded-lg flex-1 mr-4" style="background: var(--color-danger-bg); color: var(--color-danger);">
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
          background: {!canGenerate ? 'var(--color-border)' : 'var(--color-accent)'};
          color: {!canGenerate ? 'var(--color-text-secondary)' : 'var(--color-bg-card)'};
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
      {#if selectedJobData && selectedAssessment && selectedCandidate}
        <VisualReport
          assessment={selectedAssessment}
          candidate={selectedCandidate}
          job={selectedJobData}
          {reportText}
        />
      {:else}
        <!-- Fallback: plain text display -->
        <div class="rounded-xl p-5" style="background: var(--color-bg-card); border: 1px solid var(--color-border);">
          <div class="report-prose">{@html sanitizedReportText}</div>
        </div>
      {/if}
    </div>
  {:else if !generating && !loadingJobs && jobs.length === 0}
    <div
      class="rounded-xl p-10 text-center"
      style="background: var(--color-bg-card); border: 1px solid var(--color-border);"
    >
      <span class="block mb-3" style="color: var(--color-border);"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
      <div class="text-sm" style="color: var(--color-text-secondary);">暂无岗位，请先创建岗位需求</div>
      <a
        href="/assessment"
        class="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium"
        style="background: var(--color-accent); color: var(--color-bg-card);"
      >
        去创建岗位
      </a>
    </div>
  {:else if selectedCandidateId && assessments.length === 0 && !loadingAssessments}
    <div
      class="rounded-xl p-8 text-center"
      style="background: var(--color-bg-card); border: 1px solid var(--color-border);"
    >
      <div class="text-sm" style="color: var(--color-text-secondary);">该候选人暂无评估记录，请先在「智能分析」页面完成评估</div>
      <a
        href="/assessment/results"
        class="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium"
        style="background: var(--color-accent); color: var(--color-bg-card);"
      >
        去评估
      </a>
    </div>
  {/if}

  <!-- Attachments & Re-Evaluation — independent block -->
  {#if selectedAssessmentId}
    <div class="rounded-xl p-5 space-y-4" style="background: var(--color-bg-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
      <h2 class="text-sm font-semibold" style="color: var(--color-text-primary);">面试补充材料</h2>
      <AttachmentUploader assessmentId={selectedAssessmentId} onupload={handleAttachmentUpload} />
      <AttachmentList {attachments} ondelete={handleAttachmentDelete} />

      {#if attachments.length > 0}
        <div class="flex items-center gap-3 pt-2">
          <button
            onclick={runReEvaluation}
            disabled={!canReEvaluate}
            class="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
            style="
              background: {!canReEvaluate ? 'var(--color-border)' : 'var(--color-info)'};
              color: {!canReEvaluate ? 'var(--color-text-secondary)' : 'var(--color-bg-card)'};
            "
          >
            {#if reEvaluating}
              <span class="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              综合评估中...
            {:else}
              综合评估
            {/if}
          </button>
          <span class="text-xs" style="color: var(--color-text-secondary);">基于简历+面试材料重新评分</span>
        </div>
      {/if}
    </div>

    <!-- Comprehensive Result -->
    {#if comprehensiveAssessment}
      <div class="rounded-xl p-5 space-y-3" style="background: color-mix(in srgb, var(--color-info) 4%, transparent); border: 1px solid color-mix(in srgb, var(--color-info) 20%, transparent);">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" style="background: var(--color-info);"></span>
          <h2 class="text-sm font-semibold" style="color: var(--color-text-primary);">综合评估结果</h2>
          <span class="text-xs px-2 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-info) 10%, transparent); color: var(--color-info);">综合</span>
        </div>
        <div class="text-2xl font-bold" style="color: var(--color-info);">{comprehensiveAssessment.totalScore} 分</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          {#each comprehensiveAssessment.scores as s}
            <div class="flex justify-between px-3 py-2 rounded-lg" style="background: var(--color-bg-card);">
              <span style="color: var(--color-text-secondary);">{s.name}</span>
              <span class="font-medium" style="color: var(--color-text-primary);">{s.score}</span>
            </div>
          {/each}
        </div>
        {#if comprehensiveAssessment.strengths.length > 0}
          <div>
            <p class="text-xs font-medium mb-1" style="color: var(--color-success);">优势</p>
            {#each comprehensiveAssessment.strengths as item}
              <p class="text-xs ml-2" style="color: var(--color-text-secondary);">- {item}</p>
            {/each}
          </div>
        {/if}
        {#if comprehensiveAssessment.weaknesses.length > 0}
          <div>
            <p class="text-xs font-medium mb-1" style="color: var(--color-danger);">不足</p>
            {#each comprehensiveAssessment.weaknesses as item}
              <p class="text-xs ml-2" style="color: var(--color-text-secondary);">- {item}</p>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
