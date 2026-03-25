<script lang="ts">
  let { items, variant, title, icon = 'star' }: {
    items: string[]
    variant: 'green' | 'red'
    title: string
    icon?: 'star' | 'warning'
  } = $props()
</script>

<div class="section-header">
  <div class="icon-wrap" style={variant === 'green'
    ? 'background: rgba(16,185,129,0.08); color: #10B981;'
    : 'background: rgba(199,84,80,0.08); color: #C75450;'}>
    {#if icon === 'star'}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    {:else}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    {/if}
  </div>
  {title}
</div>
<div class="insight-list">
  {#each items as item}
    <div class="insight-item">
      <div class="insight-icon {variant}">
        {#if variant === 'green'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        {/if}
      </div>
      <div class="insight-desc">{item}</div>
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
</style>
