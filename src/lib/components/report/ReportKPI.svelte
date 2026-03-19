<script lang="ts">
  import type { ScoreDimension } from '$lib/types/assessment'

  let { scores, maxItems = 4 }: {
    scores: ScoreDimension[]
    maxItems?: number
  } = $props()

  const kpiScores = $derived(scores.slice(0, maxItems))
</script>

<div class="kpi-grid" style="grid-template-columns: repeat({Math.min(kpiScores.length, 4)}, 1fr);">
  {#each kpiScores as kpi}
    <div class="kpi-item">
      <div class="kpi-value">{kpi.score}</div>
      <div class="kpi-label">{kpi.name}</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width: {kpi.score}%;"></div></div>
    </div>
  {/each}
</div>

<style>
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
</style>
