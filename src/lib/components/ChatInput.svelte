<script lang="ts">
  interface Props {
    onSend: (text: string) => void
    disabled?: boolean
    placeholder?: string
  }

  let { onSend, disabled = false, placeholder = '输入消息，Enter 发送，Shift+Enter 换行...' }: Props = $props()

  let text = $state('')
  let textareaEl: HTMLTextAreaElement

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    text = ''
    if (textareaEl) {
      textareaEl.style.height = 'auto'
    }
  }

  function autoResize(e: Event) {
    const el = e.target as HTMLTextAreaElement
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }
</script>

<div
  class="flex items-end gap-3 p-4 rounded-2xl"
  style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
>
  <textarea
    bind:this={textareaEl}
    bind:value={text}
    onkeydown={handleKeydown}
    oninput={autoResize}
    {placeholder}
    rows={1}
    class="flex-1 resize-none text-sm leading-relaxed outline-none bg-transparent"
    style="color: #1A1D23; min-height: 24px; max-height: 160px;"
    {disabled}
  ></textarea>

  <button
    onclick={submit}
    disabled={!text.trim() || disabled}
    class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
    style="
      background: {!text.trim() || disabled ? '#E8E5E0' : '#D4763C'};
      color: {!text.trim() || disabled ? '#6B7280' : '#FFFFFF'};
    "
  >
    <i class="iconfont icon-send text-sm"></i>
  </button>
</div>
