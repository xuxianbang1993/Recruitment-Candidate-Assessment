<script lang="ts">
  import { Chart, registerables } from 'chart.js'
  import { onMount } from 'svelte'

  // Chart.register is idempotent — safe to call multiple times
  Chart.register(...registerables)

  let { scores, candidateName }: {
    scores: { name: string; score: number }[]
    candidateName: string
  } = $props()

  let canvas: HTMLCanvasElement
  let chart: Chart | null = null

  $effect(() => {
    if (chart && scores && scores.length > 0) {
      chart.data.labels = scores.map(s => s.name)
      chart.data.datasets[0].data = scores.map(s => s.score)
      chart.data.datasets[0].label = candidateName
      chart.update()
    }
  })

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: scores.map(s => s.name),
        datasets: [
          {
            label: candidateName,
            data: scores.map(s => s.score),
            borderColor: '#D4763C',
            backgroundColor: 'rgba(212,118,60,0.15)',
            borderWidth: 2,
            pointBackgroundColor: '#D4763C',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              font: { size: 10 },
              color: '#6B7280',
              backdropColor: 'transparent',
            },
            grid: { color: '#E8E5E0' },
            angleLines: { color: '#E8E5E0' },
            pointLabels: {
              font: { size: 12, family: 'Noto Sans SC' },
              color: '#1A1D23',
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} 分`,
            },
          },
        },
      },
    })

    return () => chart?.destroy()
  })
</script>

<canvas bind:this={canvas} aria-label={candidateName + ' 能力雷达图'}></canvas>
