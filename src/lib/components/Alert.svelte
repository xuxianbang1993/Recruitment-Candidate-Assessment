<script lang="ts">
  let {
    type = 'error',
    message,
  }: {
    type?: 'error' | 'success'
    message: string
  } = $props()

  const styles = {
    error: {
      background: 'rgba(199,84,80,0.08)',
      border: '1px solid rgba(199,84,80,0.2)',
      color: '#C75450',
    },
    success: {
      background: 'rgba(59,155,109,0.08)',
      border: '1px solid rgba(59,155,109,0.2)',
      color: '#3B9B6D',
    },
  }

  const s = $derived(styles[type])
</script>

<div
  class="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
  style="background: {s.background}; border: {s.border}; color: {s.color};"
>
  {#if type === 'error'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  {:else}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  {/if}
  {message}
</div>
