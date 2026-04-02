<script lang="ts">
  import type { ScoreDimension } from '$lib/types/assessment'
  import { onMount } from 'svelte'

  let { scores, baseline }: {
    scores: ScoreDimension[]
    baseline?: number[]
  } = $props()

  let canvasEl = $state<HTMLCanvasElement>(null!)
  let chartInstance: import('chart.js').Chart<'bar'> | null = null

  /** Resolve a CSS design token to its computed value */
  function token(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }

  function scoreColor(score: number): { bg: string; border: string } {
    if (score >= 80) return { bg: `${token('--color-success')}b3`, border: token('--color-success') }
    if (score >= 60) return { bg: `${token('--color-accent')}b3`, border: token('--color-accent') }
    return { bg: `${token('--color-danger')}b3`, border: token('--color-danger') }
  }

  /** Create a diagonal stripe pattern for the baseline dataset */
  function createStripePattern(color: string): CanvasPattern | string {
    const size = 8
    const offscreen = document.createElement('canvas')
    offscreen.width = size
    offscreen.height = size
    const ctx = offscreen.getContext('2d')
    if (!ctx) return color

    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, size)
    ctx.lineTo(size, 0)
    ctx.stroke()
    return ctx.createPattern(offscreen, 'repeat') ?? color
  }

  function buildData() {
    const data = scores.map((s) => s.score)
    const jobBaseline = baseline ?? scores.map((s) => Math.min(Math.round(s.weight * 80), 100))
    const infoColor = token('--color-info')

    return {
      labels: scores.map((s) => s.name),
      datasets: [
        {
          label: '候选人得分',
          data,
          backgroundColor: data.map((v) => scoreColor(v).bg),
          borderColor: data.map((v) => scoreColor(v).border),
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 36,
        },
        {
          label: '岗位要求',
          data: jobBaseline,
          backgroundColor: createStripePattern(`${infoColor}40`),
          borderColor: `${infoColor}80`,
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    }
  }

  $effect(() => {
    // Build data first to ensure reactive deps (scores, baseline) are tracked
    const data = buildData()
    if (!chartInstance || data.labels.length === 0) return
    chartInstance.data = data
    chartInstance.update()
  })

  onMount(() => {
    // Async chart init wrapped in IIFE — onMount cleanup must be synchronous
    (async () => {
      const { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend } = await import('chart.js')
      Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

      if (!canvasEl) return

      const fontSans = token('--font-sans')

      chartInstance = new Chart(canvasEl, {
        type: 'bar',
        data: buildData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 12, family: fontSans },
                padding: 20,
                usePointStyle: true,
                pointStyleWidth: 10,
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.x} 分`,
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20,
                font: { size: 10 },
                color: token('--color-text-secondary'),
              },
              grid: { color: token('--color-border') },
            },
            y: {
              ticks: {
                font: { size: 12, weight: 'bold', family: fontSans },
                color: token('--color-text-primary'),
              },
              grid: { display: false },
            },
          },
        },
      })
    })()

    return () => {
      chartInstance?.destroy()
      chartInstance = null
    }
  })
</script>

<div class="section-header">
  <div class="icon-wrap">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  </div>
  维度评分对比
</div>
<div class="chart-wrap">
  <canvas bind:this={canvasEl} aria-label="维度评分对比柱形图"></canvas>
</div>

<style>
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 18px 20px 14px;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-border);
  }
  .icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--color-info-bg);
    color: var(--color-info);
  }
  .chart-wrap {
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chart-wrap canvas {
    max-width: 100%;
    height: 300px;
  }
</style>
