<script lang="ts">
  let { html, title, collapsible = false }: {
    html: string
    title?: string
    collapsible?: boolean
  } = $props()

  let open = $state(false)
</script>

{#if collapsible}
  <button
    class="full-report-toggle"
    onclick={() => (open = !open)}
    aria-expanded={open}
  >
    <div class="section-header" style="border-bottom: none; padding: 18px 20px;">
      <div class="icon-wrap" style="background: rgba(212,118,60,0.08); color: #D4763C;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      {title ?? ''}
      <div class="toggle-chevron" style="transform: rotate({open ? 180 : 0}deg);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  </button>
  {#if open}
    <div class="full-report-content">
      <div class="report-prose">{@html html}</div>
    </div>
  {/if}
{:else}
  {#if title}
    <div class="section-header">
      <div class="icon-wrap" style="background: rgba(212,118,60,0.08); color: #D4763C;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      {title}
    </div>
  {/if}
  <div class="summary-content">
    <div class="report-prose">{@html html}</div>
  </div>
{/if}

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
  .summary-content {
    padding: 20px;
    font-size: 14px;
    line-height: 1.8;
    color: #6B7280;
    overflow-y: auto;
    max-height: 360px;
  }
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

  /* Prose styles for {@html} content */
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
  /* Table styles — 宽松排版 */
  .report-prose :global(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 14px 0;
    font-size: 13px;
    border: 1px solid #E8E5E0;
    border-radius: 10px;
    overflow: hidden;
  }
  .report-prose :global(thead) {
    background: #F7F5F2;
  }
  .report-prose :global(th) {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #1A1D23;
    border-bottom: 1px solid #E8E5E0;
    white-space: nowrap;
  }
  .report-prose :global(td) {
    padding: 11px 16px;
    color: #6B7280;
    border-bottom: 1px solid #F3F1EE;
    line-height: 1.6;
  }
  .report-prose :global(tr:last-child td) {
    border-bottom: none;
  }
  .report-prose :global(tr:hover td) {
    background: #FAFAF8;
  }
  .report-prose :global(tbody tr:last-child td:first-child) {
    border-bottom-left-radius: 10px;
  }
  .report-prose :global(tbody tr:last-child td:last-child) {
    border-bottom-right-radius: 10px;
  }
</style>
