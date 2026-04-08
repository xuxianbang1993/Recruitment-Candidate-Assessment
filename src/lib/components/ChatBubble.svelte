<script lang="ts">
  import { marked } from 'marked'
  import { onMount } from 'svelte'

  interface Props {
    role: 'user' | 'assistant'
    content: string
    timestamp?: string
  }

  let { role, content, timestamp }: Props = $props()

  let purify = $state<{ sanitize: (html: string) => string } | undefined>(undefined)

  onMount(async () => {
    const mod = await import('dompurify')
    purify = mod.default
  })

  const renderedHtml = $derived(
    role === 'assistant'
      ? purify
        ? purify.sanitize(marked.parse(content) as string)
        : marked.parse(content) as string
      : ''
  )
</script>

<div class="flex gap-3 {role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
  <!-- Avatar -->
  <div
    class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 self-start mt-1"
    style="background: {role === 'user'
      ? 'linear-gradient(135deg, #D4763C, #E8945A)'
      : 'linear-gradient(135deg, #4A7FC7, #6B9FD4)'};"
  >
    {role === 'user' ? '你' : 'AI'}
  </div>

  <!-- Bubble -->
  <div class="max-w-[72%] min-w-0">
    <div
      class="px-4 py-3 rounded-2xl text-sm leading-relaxed break-words"
      style="
        background: {role === 'user' ? '#D4763C' : '#FFFFFF'};
        color: {role === 'user' ? '#FFFFFF' : '#1A1D23'};
        box-shadow: var(--shadow-sm);
        border: {role === 'assistant' ? '1px solid #E8E5E0' : 'none'};
        border-bottom-right-radius: {role === 'user' ? '4px' : '16px'};
        border-bottom-left-radius: {role === 'assistant' ? '4px' : '16px'};
      "
    >
      {#if role === 'assistant'}
        <div class="chat-prose">{@html renderedHtml}</div>
      {:else}
        <span class="whitespace-pre-wrap">{content}</span>
      {/if}
    </div>
    {#if timestamp}
      <div
        class="text-xs mt-1 {role === 'user' ? 'text-right' : 'text-left'}"
        style="color: #6B7280;"
      >
        {timestamp}
      </div>
    {/if}
  </div>
</div>
