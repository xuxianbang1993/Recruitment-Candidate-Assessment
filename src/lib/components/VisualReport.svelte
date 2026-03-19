<script lang="ts">
  import type { Assessment, Job } from '$lib/types/assessment'
  import type { Candidate } from '$lib/types'
  import { marked } from 'marked'
  import { onMount, onDestroy } from 'svelte'

  let { assessment, candidate, job, reportText }: {
    assessment: Assessment
    candidate: Candidate
    job: Job
    reportText: string
  } = $props()

  let canvasEl = $state<HTMLCanvasElement>(null!)
  let chartInstance: import('chart.js').Chart | null = null
  let fullReportOpen = $state(false)

  // Compute avatar initial (first char of name)
  const avatarChar = $derived(candidate.name ? candidate.name.charAt(0) : '?')

  // Compute score ring dashoffset: circumference = 2 * pi * 40 = 251.33
  // dashoffset = circumference * (1 - score/100)
  const circumference = 251.33
  const dashoffset = $derived(circumference * (1 - Math.min(Math.max(assessment.totalScore, 0), 100) / 100))

  // Badge based on score
  const badge = $derived(
    assessment.totalScore >= 80
      ? { label: '推荐复试', cls: 'badge-green' }
      : assessment.totalScore >= 60
        ? { label: '建议考虑', cls: 'badge-yellow' }
        : { label: '暂不推荐', cls: 'badge-red' }
  )

  // KPI: first 4 dimensions
  const kpiScores = $derived(assessment.scores.slice(0, 4))

  // Extract executive summary from reportText
  const summaryHtml = $derived(() => {
    const text = reportText
    // Try to find section markers
    const patterns = [
      /##\s*[一二三四五六七八九十\d]*[、.．\s]*执行摘要([\s\S]*?)(?=\n##\s|$)/i,
      /##\s*执行摘要([\s\S]*?)(?=\n##\s|$)/i,
      /##\s*二[、.．\s]*([\s\S]*?)(?=\n##\s|$)/i,
    ]
    for (const pat of patterns) {
      const m = text.match(pat)
      if (m && m[1] && m[1].trim().length > 50) {
        return marked.parse(m[1].trim()) as string
      }
    }
    // Fallback: first 500 chars
    return marked.parse(text.slice(0, 500)) as string
  })

  // Full report html
  const fullReportHtml = $derived(marked.parse(reportText) as string)

  // Dimension accent colors (cycling)
  const dimColors = [
    { color: '#D4763C', bg: 'rgba(212,118,60,0.08)' },
    { color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    { color: '#4A7FC7', bg: 'rgba(74,127,199,0.08)' },
    { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
    { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    { color: '#C75450', bg: 'rgba(199,84,80,0.08)' },
  ]

  onMount(async () => {
    // Dynamically import Chart.js to avoid SSR issues
    const { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } = await import('chart.js')
    Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

    if (!canvasEl) return

    const labels = assessment.scores.map((s) => s.name)
    const data = assessment.scores.map((s) => s.score)
    // Job requirement baseline: use weight * 80 as a reference, capped at 100
    const jobBaseline = assessment.scores.map((s) => Math.min(Math.round(s.weight * 80), 100))

    chartInstance = new Chart(canvasEl, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: '候选人得分',
            data,
            backgroundColor: 'rgba(212,118,60,0.12)',
            borderColor: '#D4763C',
            borderWidth: 2,
            pointBackgroundColor: '#D4763C',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: '岗位要求',
            data: jobBaseline,
            backgroundColor: 'rgba(74,127,199,0.08)',
            borderColor: '#4A7FC7',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#4A7FC7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, family: '-apple-system, "Noto Sans SC", "PingFang SC", sans-serif' },
              padding: 20,
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              font: { size: 10 },
              color: '#9CA3AF',
              backdropColor: 'transparent',
            },
            grid: { color: '#E8E5E0' },
            angleLines: { color: '#E8E5E0' },
            pointLabels: {
              font: { size: 12, weight: 'bold', family: '-apple-system, "Noto Sans SC", "PingFang SC", sans-serif' },
              color: '#1A1D23',
            },
          },
        },
      },
    })
  })

  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
  })
</script>

<div class="bento">

  <!-- A. Hero Card (span-12) -->
  <div class="card hero span-12 animate-in">
    <div class="hero-left">
      <div class="hero-avatar">{avatarChar}</div>
      <div class="hero-info">
        <h2>{candidate.name}</h2>
        <div class="hero-meta">
          {#if job.title}
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              {job.title}{job.department ? `（${job.department}）` : ''}
            </span>
          {/if}
          {#if candidate.experience}
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {candidate.experience}年经验
            </span>
          {/if}
          {#if candidate.education}
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              {candidate.education}
            </span>
          {/if}
        </div>
      </div>
    </div>
    <div class="hero-right">
      <div class="hero-score">
        <svg class="hero-score-ring" viewBox="0 0 88 88">
          <circle class="bg" cx="44" cy="44" r="40"/>
          <circle class="fg" cx="44" cy="44" r="40" style="stroke-dashoffset: {dashoffset};"/>
        </svg>
        <div class="hero-score-value">{assessment.totalScore}</div>
      </div>
      <div class="hero-score-label">综合得分</div>
      <div class="hero-badge {badge.cls}">
        {#if badge.cls === 'badge-green'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        {:else if badge.cls === 'badge-yellow'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {:else}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        {/if}
        {badge.label}
      </div>
    </div>
  </div>

  <!-- B. KPI Row (span-12) -->
  {#if kpiScores.length > 0}
    <div class="card span-12 animate-in delay-1">
      <div class="kpi-grid" style="grid-template-columns: repeat({Math.min(kpiScores.length, 4)}, 1fr);">
        {#each kpiScores as kpi}
          <div class="kpi-item">
            <div class="kpi-value">{kpi.score}</div>
            <div class="kpi-label">{kpi.name}</div>
            <div class="kpi-bar"><div class="kpi-bar-fill" style="width: {kpi.score}%;"></div></div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- C. Radar Chart (span-6) + D. Executive Summary (span-6) -->
  <div class="card span-6 animate-in delay-2">
    <div class="section-header">
      <div class="icon-wrap" style="background: rgba(74,127,199,0.08); color: #4A7FC7;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
      能力雷达图
    </div>
    <div class="radar-wrap">
      <canvas bind:this={canvasEl}></canvas>
    </div>
  </div>

  <div class="card span-6 animate-in delay-2">
    <div class="section-header">
      <div class="icon-wrap" style="background: rgba(212,118,60,0.08); color: #D4763C;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      执行摘要
    </div>
    <div class="summary-content">
      <div class="report-prose">{@html summaryHtml()}</div>
    </div>
  </div>

  <!-- E. Strengths (span-6) + F. Weaknesses (span-6) -->
  {#if assessment.strengths.length > 0}
    <div class="card span-6 animate-in delay-3">
      <div class="section-header">
        <div class="icon-wrap" style="background: rgba(16,185,129,0.08); color: #10B981;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        核心亮点
      </div>
      <div class="insight-list">
        {#each assessment.strengths as strength}
          <div class="insight-item">
            <div class="insight-icon green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="insight-desc">{strength}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if assessment.weaknesses.length > 0}
    <div class="card span-6 animate-in delay-3">
      <div class="section-header">
        <div class="icon-wrap" style="background: rgba(199,84,80,0.08); color: #C75450;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        风险提示
      </div>
      <div class="insight-list">
        {#each assessment.weaknesses as weakness}
          <div class="insight-item">
            <div class="insight-icon red">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div class="insight-desc">{weakness}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- G. Dimension Details (span-8) + H. Suggestions (span-4) -->
  {#if assessment.scores.length > 0}
    <div class="card span-8 animate-in delay-4">
      <div class="section-header">
        <div class="icon-wrap" style="background: rgba(139,92,246,0.08); color: #8B5CF6;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        维度评分详情
      </div>
      <div class="dim-list">
        {#each assessment.scores as dim, i}
          {@const c = dimColors[i % dimColors.length]}
          <div class="dim-item">
            <div class="dim-icon" style="background: {c.bg}; color: {c.color};">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <div class="dim-info">
              <div class="dim-name">{dim.name}</div>
              <div class="dim-bar">
                <div class="dim-bar-fill" style="width: {dim.score}%; background: {c.color};"></div>
              </div>
            </div>
            <div class="dim-score" style="color: {c.color};">{dim.score}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if assessment.suggestions.length > 0}
    <div class="card span-4 animate-in delay-5">
      <div class="section-header">
        <div class="icon-wrap" style="background: rgba(16,185,129,0.08); color: #10B981;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        </div>
        综合建议
      </div>
      <div class="rec-content">
        <div class="rec-tags">
          {#if assessment.totalScore >= 80}
            <span class="rec-tag" style="background: rgba(16,185,129,0.08); color: #10B981;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              推荐复试
            </span>
          {:else if assessment.totalScore >= 60}
            <span class="rec-tag" style="background: rgba(245,158,11,0.08); color: #F59E0B;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              建议考虑
            </span>
          {:else}
            <span class="rec-tag" style="background: rgba(199,84,80,0.08); color: #C75450;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              暂不推荐
            </span>
          {/if}
        </div>
        <div class="rec-text">
          {#each assessment.suggestions as suggestion}
            <p>{suggestion}</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- I. Full Report (span-12, collapsible) -->
  <div class="card span-12 animate-in delay-6">
    <button
      class="full-report-toggle"
      onclick={() => (fullReportOpen = !fullReportOpen)}
      aria-expanded={fullReportOpen}
    >
      <div class="section-header" style="border-bottom: none; padding: 18px 20px;">
        <div class="icon-wrap" style="background: rgba(212,118,60,0.08); color: #D4763C;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        完整 AI 分析报告
        <div class="toggle-chevron" style="transform: rotate({fullReportOpen ? 180 : 0}deg);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
    </button>
    {#if fullReportOpen}
      <div class="full-report-content">
        <div class="report-prose">{@html fullReportHtml}</div>
      </div>
    {/if}
  </div>

</div>

<style>
  /* ── Design Tokens ── */
  .bento {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(12, 1fr);
  }
  .bento > .span-12 { grid-column: span 12; }
  .bento > .span-8  { grid-column: span 8;  }
  .bento > .span-6  { grid-column: span 6;  }
  .bento > .span-4  { grid-column: span 4;  }

  @media (max-width: 900px) {
    .bento > .span-8,
    .bento > .span-6,
    .bento > .span-4 { grid-column: span 12; }
  }

  /* ── Card ── */
  .card {
    background: #FFFFFF;
    border: 1px solid #E8E5E0;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .card:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }

  /* ── Hero ── */
  .hero {
    padding: 28px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    background: linear-gradient(135deg, #FFFAF6 0%, #FFF5ED 100%);
    border: 1px solid rgba(212,118,60,0.12);
  }
  .hero-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .hero-avatar {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #D4763C 0%, #E8954C 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .hero-info h2 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
    color: #1A1D23;
  }
  .hero-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #6B7280;
    flex-wrap: wrap;
  }
  .hero-meta span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .hero-right {
    text-align: center;
    flex-shrink: 0;
  }
  .hero-score {
    position: relative;
    width: 88px;
    height: 88px;
  }
  .hero-score-ring {
    width: 88px;
    height: 88px;
    transform: rotate(-90deg);
  }
  .hero-score-ring circle {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
  }
  .hero-score-ring .bg { stroke: #E8E5E0; }
  .hero-score-ring .fg {
    stroke: #D4763C;
    stroke-dasharray: 251.33;
    transition: stroke-dashoffset 1.5s ease;
  }
  .hero-score-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 22px;
    font-weight: 800;
    color: #D4763C;
  }
  .hero-score-label {
    font-size: 12px;
    color: #6B7280;
    margin-top: 6px;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    margin-top: 6px;
  }
  .badge-green { background: rgba(16,185,129,0.08); color: #10B981; }
  .badge-yellow { background: rgba(245,158,11,0.08); color: #F59E0B; }
  .badge-red { background: rgba(199,84,80,0.08); color: #C75450; }

  /* ── Section Header ── */
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 18px 20px 14px;
    font-size: 14px;
    font-weight: 700;
    color: #1A1D23;
    border-bottom: 1px solid #E8E5E0;
  }
  .icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* ── KPI ── */
  .kpi-grid {
    display: grid;
    gap: 0;
  }
  .kpi-item {
    padding: 20px;
    text-align: center;
    border-right: 1px solid #E8E5E0;
    transition: background 0.2s;
  }
  .kpi-item:last-child { border-right: none; }
  .kpi-item:hover { background: #FAFAF8; }
  .kpi-value {
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, #D4763C, #E8954C);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 2px;
  }
  .kpi-label { font-size: 12px; color: #6B7280; }
  .kpi-bar {
    height: 4px;
    border-radius: 2px;
    background: #E8E5E0;
    margin-top: 10px;
    overflow: hidden;
  }
  .kpi-bar-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, #D4763C, #E8954C);
    transition: width 1.2s ease;
  }

  /* ── Radar ── */
  .radar-wrap {
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .radar-wrap canvas {
    max-width: 100%;
    max-height: 320px;
  }

  /* ── Summary ── */
  .summary-content {
    padding: 20px;
    font-size: 14px;
    line-height: 1.8;
    color: #6B7280;
    overflow-y: auto;
    max-height: 360px;
  }

  /* ── Insight List ── */
  .insight-list { padding: 16px 20px; }
  .insight-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid #F3F1EE;
    font-size: 13px;
    line-height: 1.7;
  }
  .insight-item:last-child { border-bottom: none; }
  .insight-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .insight-icon.green { background: rgba(16,185,129,0.08); color: #10B981; }
  .insight-icon.red   { background: rgba(199,84,80,0.08);  color: #C75450; }
  .insight-desc { color: #6B7280; }

  /* ── Dimension ── */
  .dim-list { padding: 16px 20px; }
  .dim-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid #F3F1EE;
  }
  .dim-item:last-child { border-bottom: none; }
  .dim-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dim-info { flex: 1; min-width: 0; }
  .dim-name { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #1A1D23; }
  .dim-bar {
    height: 6px;
    border-radius: 3px;
    background: #F3F1EE;
    overflow: hidden;
  }
  .dim-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 1.2s ease;
  }
  .dim-score {
    font-size: 16px;
    font-weight: 800;
    min-width: 42px;
    text-align: right;
  }

  /* ── Recommendation ── */
  .rec-content { padding: 20px; }
  .rec-tags { margin-bottom: 12px; }
  .rec-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 8px;
    margin-bottom: 8px;
  }
  .rec-text {
    font-size: 13px;
    line-height: 1.8;
    color: #6B7280;
  }
  .rec-text p { margin-bottom: 8px; }
  .rec-text p:last-child { margin-bottom: 0; }

  /* ── Full Report Toggle ── */
  .full-report-toggle {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  .full-report-toggle .section-header {
    border-bottom: none;
  }
  .full-report-toggle:hover .section-header {
    background: #FAFAF8;
  }
  .toggle-chevron {
    margin-left: auto;
    color: #9CA3AF;
    transition: transform 0.2s ease;
  }
  .full-report-content {
    padding: 20px 24px;
    border-top: 1px solid #E8E5E0;
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-in  { animation: fadeUp 0.5s ease both; }
  .delay-1 { animation-delay: 0.05s; }
  .delay-2 { animation-delay: 0.10s; }
  .delay-3 { animation-delay: 0.15s; }
  .delay-4 { animation-delay: 0.20s; }
  .delay-5 { animation-delay: 0.25s; }
  .delay-6 { animation-delay: 0.30s; }

  /* ── Prose styles for {@html} content ── */
  .report-prose :global(h1) { font-size: 18px; font-weight: 700; margin: 16px 0 8px; color: #1A1D23; }
  .report-prose :global(h2) { font-size: 15px; font-weight: 700; margin: 14px 0 6px; color: #1A1D23; }
  .report-prose :global(h3) { font-size: 14px; font-weight: 600; margin: 12px 0 4px; color: #1A1D23; }
  .report-prose :global(p)  { margin: 6px 0; font-size: 13px; line-height: 1.8; color: #6B7280; }
  .report-prose :global(ul),
  .report-prose :global(ol) { margin: 6px 0; padding-left: 20px; }
  .report-prose :global(li) { font-size: 13px; line-height: 1.8; color: #6B7280; margin: 2px 0; }
  .report-prose :global(strong) { color: #1A1D23; font-weight: 600; }
  .report-prose :global(hr) { border: none; border-top: 1px solid #E8E5E0; margin: 16px 0; }
  .report-prose :global(blockquote) {
    border-left: 3px solid #D4763C;
    background: rgba(212,118,60,0.06);
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    margin: 10px 0;
    color: #D4763C;
    font-size: 13px;
  }
  .report-prose :global(code) {
    background: #F3F1EE;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: #1A1D23;
  }
</style>
