<script lang="ts">
  import type { ScoreDimension } from '$lib/types/assessment'
  import { getDimensionDefinition } from './report-data'

  let { scores, category }: {
    scores: ScoreDimension[]
    category?: string
  } = $props()

  const dimColors = [
    { color: '#D4763C', bg: 'rgba(212,118,60,0.08)' },
    { color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    { color: '#4A7FC7', bg: 'rgba(74,127,199,0.08)' },
    { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
    { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    { color: '#C75450', bg: 'rgba(199,84,80,0.08)' },
  ]
</script>

<div class="section-header">
  <div class="icon-wrap" style="background: rgba(139,92,246,0.08); color: #8B5CF6;">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  </div>
  维度评分详情
</div>
<div class="dim-list">
  {#each scores as dim, i}
    {@const c = dimColors[i % dimColors.length]}
    <div class="dim-item">
      <div class="dim-icon" style="background: {c.bg}; color: {c.color};">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      </div>
      <div class="dim-info">
        <div class="dim-name">{dim.name}</div>
        {#if getDimensionDefinition(category, dim.name)}
          <div class="dim-def">{getDimensionDefinition(category, dim.name)}</div>
        {/if}
        <div class="dim-bar">
          <div class="dim-bar-fill" style="width: {dim.score}%; background: {c.color};"></div>
        </div>
      </div>
      <div class="dim-score" style="color: {c.color};">{dim.score}</div>
    </div>
  {/each}
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
  .dim-def { font-size: 11px; color: #9CA3AF; margin-bottom: 6px; line-height: 1.4; }
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
</style>
