<script lang="ts">
  let { suggestions, totalScore }: {
    suggestions: string[]
    totalScore: number
  } = $props()
</script>

<div class="section-header">
  <div class="icon-wrap" style="background: rgba(16,185,129,0.08); color: #10B981;">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
  </div>
  综合建议
</div>
<div class="rec-content">
  <div class="rec-tags">
    {#if totalScore >= 80}
      <span class="rec-tag" style="background: rgba(16,185,129,0.08); color: #10B981;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        推荐复试
      </span>
    {:else if totalScore >= 60}
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
    {#each suggestions as suggestion}
      <p>{suggestion}</p>
    {/each}
  </div>
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
</style>
