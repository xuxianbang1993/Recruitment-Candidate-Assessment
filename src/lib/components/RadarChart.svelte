<script lang="ts">
  import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js'
  import { onMount } from 'svelte'

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

  let { scores, candidateName }: {
    scores: { name: string; score: number }[]
    candidateName: string
  } = $props()

  let canvas = $state<HTMLCanvasElement>(null!)
  let chart: Chart<'bar'> | null = null

  /** Resolve a CSS design token to its computed value */
  function token(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }

  function scoreColor(score: number): { bg: string; border: string } {
    if (score >= 80) return { bg: `${token('--color-success')}b3`, border: token('--color-success') }
    if (score >= 60) return { bg: `${token('--color-accent')}b3`, border: token('--color-accent') }
    return { bg: `${token('--color-danger')}b3`, border: token('--color-danger') }
  }

  function buildData() {
    return {
      labels: scores.map(s => s.name),
      datasets: [
        {
          label: candidateName,
          data: scores.map(s => s.score),
          backgroundColor: scores.map(s => scoreColor(s.score).bg),
          borderColor: scores.map(s => scoreColor(s.score).border),
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 48,
        },
      ],
    }
  }

  $effect(() => {
    // Build data first to ensure reactive deps (scores, candidateName) are tracked
    const data = buildData()
    if (!chart || data.labels.length === 0) return
    chart.data = data
    chart.update()
  })

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'bar',
      data: buildData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            min: 0,
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
              font: { size: 12, family: token('--font-sans') },
              color: token('--color-text-primary'),
            },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed.x} 分`,
            },
          },
        },
      },
    })
    return () => chart?.destroy()
  })
</script>

<div class="bar-chart-wrap">
  <canvas bind:this={canvas} aria-label={candidateName + ' 维度评分柱形图'}></canvas>
</div>

<style>
  .bar-chart-wrap {
    position: relative;
    width: 100%;
    height: 280px;
  }
</style>
