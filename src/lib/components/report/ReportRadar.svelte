<script lang="ts">
  import type { ScoreDimension } from '$lib/types/assessment'
  import { onMount, onDestroy } from 'svelte'

  let { scores, baseline }: {
    scores: ScoreDimension[]
    baseline?: number[]
  } = $props()

  let canvasEl = $state<HTMLCanvasElement>(null!)
  let chartInstance: import('chart.js').Chart | null = null

  onMount(async () => {
    const { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } = await import('chart.js')
    Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

    if (!canvasEl) return

    const labels = scores.map((s) => s.name)
    const data = scores.map((s) => s.score)
    const jobBaseline = baseline ?? scores.map((s) => Math.min(Math.round(s.weight * 80), 100))

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

<div class="section-header">
  <div class="icon-wrap" style="background: rgba(74,127,199,0.08); color: #4A7FC7;">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  </div>
  能力雷达图
</div>
<div class="radar-wrap">
  <canvas bind:this={canvasEl}></canvas>
</div>

<style>
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
</style>
