<script lang="ts">
  let {
    title,
    description = '',
    iconPath,
    action,
    actionLabel = '',
  }: {
    title: string
    description?: string
    iconPath?: string
    action?: () => void
    actionLabel?: string
  } = $props()
</script>

<div
  class="flex flex-col items-center justify-center py-20 rounded-2xl"
  style="background: #FFFFFF; border: 1px solid #E8E5E0;"
>
  <div
    class="w-16 h-16 rounded-full flex items-center justify-center mb-4"
    style="background: rgba(212,118,60,0.08);"
  >
    {#if iconPath}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4763C" stroke-width="1.5">
        <path d={iconPath}/>
      </svg>
    {:else}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4763C" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    {/if}
  </div>

  <p class="text-sm font-medium mb-1" style="color: #1A1D23;">{title}</p>

  {#if description}
    <p class="text-xs mb-4" style="color: #6B7280;">{description}</p>
  {/if}

  {#if action && actionLabel}
    <button
      onclick={action}
      class="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
      style="background: #D4763C;"
    >
      {actionLabel}
    </button>
  {/if}
</div>
