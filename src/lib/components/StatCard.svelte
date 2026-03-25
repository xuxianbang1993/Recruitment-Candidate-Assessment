<script lang="ts">
  interface Props {
    label: string
    value: string | number
    sub?: string
    icon?: string
    color?: 'accent' | 'success' | 'info' | 'warning'
  }

  let { label, value, sub, icon, color = 'accent' }: Props = $props()

  const colorMap = {
    accent: { bg: 'rgba(212,118,60,0.08)', text: '#D4763C' },
    success: { bg: 'rgba(59,155,109,0.08)', text: '#3B9B6D' },
    info: { bg: 'rgba(74,127,199,0.08)', text: '#4A7FC7' },
    warning: { bg: 'rgba(212,150,60,0.08)', text: '#D4963C' },
  }

  const iconBg = $derived(colorMap[color].bg)
  const iconColor = $derived(colorMap[color].text)
</script>

<div
  class="rounded-xl p-5 flex items-start gap-4"
  style="background: #FFFFFF; box-shadow: var(--shadow-sm); border: 1px solid #E8E5E0;"
>
  {#if icon}
    <div
      class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style="background: {iconBg};"
    >
      <span style="color: {iconColor}; display: flex; align-items: center;">{@html icon}</span>
    </div>
  {/if}
  <div class="min-w-0">
    <div class="text-sm font-medium" style="color: #6B7280;">{label}</div>
    <div class="text-2xl font-bold mt-1" style="color: #1A1D23;">{value}</div>
    {#if sub}
      <div class="text-xs mt-1" style="color: #6B7280;">{sub}</div>
    {/if}
  </div>
</div>
