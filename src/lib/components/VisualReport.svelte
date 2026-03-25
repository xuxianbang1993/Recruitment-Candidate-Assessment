<script lang="ts">
  import type { Assessment, Job } from '$lib/types/assessment'
  import type { Candidate } from '$lib/types'
  import { marked } from 'marked'
  import ReportHero from './report/ReportHero.svelte'
  import ReportKPI from './report/ReportKPI.svelte'
  import ReportRadar from './report/ReportRadar.svelte'
  import ReportInsights from './report/ReportInsights.svelte'
  import ReportDimensions from './report/ReportDimensions.svelte'
  import ReportSuggestions from './report/ReportSuggestions.svelte'
  import ReportProse from './report/ReportProse.svelte'

  let { assessment, candidate, job, reportText }: {
    assessment: Assessment
    candidate: Candidate
    job: Job
    reportText: string
  } = $props()

  const summaryHtml = $derived((() => {
    const patterns = [
      /##\s*[一二三四五六七八九十\d]*[、.．\s]*执行摘要([\s\S]*?)(?=\n##\s|$)/i,
      /##\s*执行摘要([\s\S]*?)(?=\n##\s|$)/i,
      /##\s*二[、.．\s]*([\s\S]*?)(?=\n##\s|$)/i,
    ]
    for (const pat of patterns) {
      const m = reportText.match(pat)
      if (m && m[1] && m[1].trim().length > 50) {
        return marked.parse(m[1].trim()) as string
      }
    }
    return marked.parse(reportText.slice(0, 500)) as string
  })())

  const fullReportHtml = $derived(marked.parse(reportText) as string)
</script>

<div class="bento">
  <!-- Hero -->
  <div class="card hero-card span-12 animate-in">
    <ReportHero
      name={candidate.name}
      jobTitle={job.title}
      department={job.department}
      experience={candidate.experience}
      education={candidate.education}
      totalScore={assessment.totalScore}
    />
  </div>

  <!-- KPI -->
  {#if assessment.scores.length > 0}
    <div class="card span-12 animate-in delay-1">
      <ReportKPI scores={assessment.scores} />
    </div>
  {/if}

  <!-- Radar + Summary -->
  <div class="card span-6 animate-in delay-2">
    <ReportRadar scores={assessment.scores} />
  </div>
  <div class="card span-6 animate-in delay-2">
    <ReportProse html={summaryHtml} title="执行摘要" />
  </div>

  <!-- Strengths + Weaknesses -->
  {#if assessment.strengths.length > 0}
    <div class="card span-6 animate-in delay-3">
      <ReportInsights items={assessment.strengths} variant="green" title="核心亮点" icon="star" />
    </div>
  {/if}
  {#if assessment.weaknesses.length > 0}
    <div class="card span-6 animate-in delay-3">
      <ReportInsights items={assessment.weaknesses} variant="red" title="风险提示" icon="warning" />
    </div>
  {/if}

  <!-- Dimensions + Suggestions -->
  {#if assessment.scores.length > 0}
    <div class="card span-8 animate-in delay-4">
      <ReportDimensions scores={assessment.scores} category={job.category} />
    </div>
  {/if}
  {#if assessment.suggestions.length > 0}
    <div class="card span-4 animate-in delay-5">
      <ReportSuggestions
        suggestions={assessment.suggestions}
        totalScore={assessment.totalScore}
        scores={assessment.scores}
        category={job.category}
      />
    </div>
  {/if}

  <!-- Full Report -->
  <div class="card span-12 animate-in delay-6">
    <ReportProse html={fullReportHtml} title="完整 AI 分析报告" collapsible={true} />
  </div>
</div>

<style>
  /* Layout / grid / card / animation only — component styles are self-contained */
  .bento { display: grid; gap: 16px; grid-template-columns: repeat(12, 1fr); }
  .bento > .span-12 { grid-column: span 12; }
  .bento > .span-8  { grid-column: span 8; }
  .bento > .span-6  { grid-column: span 6; }
  .bento > .span-4  { grid-column: span 4; }

  @media (max-width: 900px) {
    .bento > .span-8,
    .bento > .span-6,
    .bento > .span-4 { grid-column: span 12; }
  }

  .card {
    background: #FFFFFF;
    border: 1px solid #E8E5E0;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }

  .hero-card {
    background: linear-gradient(135deg, #FFFAF6 0%, #FFF5ED 100%);
    border: 1px solid rgba(212,118,60,0.12);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-in { animation: fadeUp 0.5s ease both; }
  .delay-1 { animation-delay: 0.05s; }
  .delay-2 { animation-delay: 0.10s; }
  .delay-3 { animation-delay: 0.15s; }
  .delay-4 { animation-delay: 0.20s; }
  .delay-5 { animation-delay: 0.25s; }
  .delay-6 { animation-delay: 0.30s; }
</style>
