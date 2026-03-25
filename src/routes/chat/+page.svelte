<script lang="ts">
  import { tick } from 'svelte'
  import ChatBubble from '$lib/components/ChatBubble.svelte'
  import ChatInput from '$lib/components/ChatInput.svelte'

  interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }

  let messages = $state<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是智聘 AI 助手。我可以帮助你分析候选人简历、解答招聘相关问题，或协助进行岗位匹配分析。请告诉我你需要什么帮助？',
      timestamp: formatTime(new Date()),
    },
  ])

  let loading = $state(false)
  let messagesEl: HTMLDivElement

  function formatTime(d: Date): string {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  async function scrollToBottom() {
    await tick()
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight
    }
  }

  async function handleSend(text: string) {
    messages = [...messages, {
      role: 'user',
      content: text,
      timestamp: formatTime(new Date()),
    }]
    await scrollToBottom()

    loading = true

    // Build message history for API (exclude timestamps, skip welcome message)
    const apiMessages = messages
      .filter((m) => !(m.role === 'assistant' && messages.indexOf(m) === 0))
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, sessionId: 'default' }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        messages = [...messages, {
          role: 'assistant',
          content: json.data?.reply ?? '收到，正在处理...',
          timestamp: formatTime(new Date()),
        }]
      } else {
        messages = [...messages, {
          role: 'assistant',
          content: json.error ?? '抱歉，服务暂时不可用，请稍后再试。',
          timestamp: formatTime(new Date()),
        }]
      }
    } catch {
      messages = [...messages, {
        role: 'assistant',
        content: '网络错误，请检查连接后重试。',
        timestamp: formatTime(new Date()),
      }]
    } finally {
      loading = false
      await scrollToBottom()
    }
  }

  const suggestions = [
    '分析候选人的技术能力',
    '如何设置岗位权重？',
    '推荐最合适的候选人',
    '比较候选人综合素质',
  ]
</script>

<div class="flex flex-col h-full" style="height: calc(100vh - 60px - 56px);">
  <!-- Header -->
  <div class="mb-4 flex items-center justify-between flex-shrink-0">
    <div>
      <h1 class="font-semibold" style="font-size: 16px; color: #1A1D23;">AI 对话</h1>
      <p class="text-xs mt-0.5" style="color: #6B7280;">与智聘 AI 助手对话，获取招聘洞察</p>
    </div>
    <button
      onclick={() => {
        messages = [
          {
            role: 'assistant',
            content: '对话已清空。请告诉我你需要什么帮助？',
            timestamp: formatTime(new Date()),
          },
        ]
      }}
      class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style="background: #F7F5F2; color: #6B7280; border: 1px solid #E8E5E0;"
    >
      清空对话
    </button>
  </div>

  <!-- Messages -->
  <div
    bind:this={messagesEl}
    class="flex-1 overflow-y-auto space-y-4 pr-1"
    style="min-height: 0;"
  >
    {#each messages as msg}
      <ChatBubble role={msg.role} content={msg.content} timestamp={msg.timestamp} />
    {/each}

    {#if loading}
      <div class="flex gap-3">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style="background: linear-gradient(135deg, #4A7FC7, #6B9FD4);"
        >
          AI
        </div>
        <div
          class="px-4 py-3 rounded-2xl rounded-bl-sm"
          style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
        >
          <div class="flex gap-1 items-center h-5">
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background: #D4763C; animation-delay: 0ms;"></span>
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background: #D4763C; animation-delay: 150ms;"></span>
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background: #D4763C; animation-delay: 300ms;"></span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Suggestions (only on empty/initial) -->
  {#if messages.length === 1 && !loading}
    <div class="flex flex-wrap gap-2 my-3 flex-shrink-0">
      {#each suggestions as s}
        <button
          onclick={() => handleSend(s)}
          class="px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:border-[#D4763C] hover:text-[#D4763C]"
          style="background: #FFFFFF; border: 1px solid #E8E5E0; color: #6B7280;"
        >
          {s}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Input -->
  <div class="flex-shrink-0 mt-3">
    <ChatInput onSend={handleSend} disabled={loading} />
  </div>
</div>
