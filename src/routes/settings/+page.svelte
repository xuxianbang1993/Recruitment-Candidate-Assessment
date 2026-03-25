<script lang="ts">
  import { onMount } from 'svelte'

  interface Settings {
    provider: string
    apiKey: string
    model: string
    baseUrl: string
  }

  const defaultSettings: Settings = {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
  }

  let settings = $state<Settings>({ ...defaultSettings })
  let saving = $state(false)
  let saved = $state(false)
  let error = $state('')
  let loading = $state(true)
  let showKey = $state(false)

  const providers = [
    { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o', defaultBase: 'https://api.openai.com/v1' },
    { value: 'claude', label: 'Anthropic Claude', defaultModel: 'claude-sonnet-4-6', defaultBase: 'https://api.anthropic.com' },
    { value: 'deepseek', label: 'DeepSeek', defaultModel: 'deepseek-chat', defaultBase: 'https://api.deepseek.com/v1' },
  ]

  // API uses snake_case keys; map to/from local camelCase state
  function fromApiData(data: Record<string, string>): Settings {
    return {
      provider: data['ai_provider'] ?? 'openai',
      apiKey: data['ai_api_key'] ?? '',
      model: data['ai_model'] ?? 'gpt-4o',
      baseUrl: data['ai_base_url'] ?? 'https://api.openai.com/v1',
    }
  }

  function toApiData(s: Settings): Record<string, string> {
    return {
      ai_provider: s.provider,
      ai_api_key: s.apiKey,
      ai_model: s.model,
      ai_base_url: s.baseUrl,
    }
  }

  onMount(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          settings = fromApiData(json.data)
        }
      }
    } catch {
      // use defaults
    } finally {
      loading = false
    }
  })

  function onProviderChange() {
    const p = providers.find((p) => p.value === settings.provider)
    if (p) {
      settings.model = p.defaultModel
      settings.baseUrl = p.defaultBase
    }
  }

  async function save() {
    saving = true
    error = ''
    saved = false
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiData(settings)),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        saved = true
        setTimeout(() => { saved = false }, 3000)
      } else {
        error = json.error ?? '保存失败，请重试'
      }
    } catch {
      error = '网络错误，请检查连接'
    } finally {
      saving = false
    }
  }
</script>

<div class="max-w-2xl space-y-6">
  <!-- Header -->
  <div>
    <h1 class="font-semibold" style="font-size: 16px; color: #1A1D23;">系统设置</h1>
    <p class="text-xs mt-1" style="color: #6B7280;">配置 AI 服务连接信息</p>
  </div>

  {#if loading}
    <div class="rounded-xl p-8 text-center" style="background: #FFFFFF; border: 1px solid #E8E5E0;">
      <div class="text-sm" style="color: #6B7280;">加载中...</div>
    </div>
  {:else}
    <div
      class="rounded-xl p-6 space-y-5"
      style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
    >
      <h2 class="font-semibold text-sm" style="color: #1A1D23;">AI 服务配置</h2>

      <!-- Provider -->
      <div>
        <label for="provider" class="block text-xs font-medium mb-1.5" style="color: #6B7280;">AI 服务商</label>
        <select
          id="provider"
          bind:value={settings.provider}
          onchange={onProviderChange}
          class="w-full h-10 px-3 rounded-lg text-sm outline-none"
          style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
        >
          {#each providers as p}
            <option value={p.value}>{p.label}</option>
          {/each}
        </select>
      </div>

      <!-- API Key -->
      <div>
        <label for="apiKey" class="block text-xs font-medium mb-1.5" style="color: #6B7280;">API Key</label>
        <div class="relative">
          <input
            id="apiKey"
            type={showKey ? 'text' : 'password'}
            bind:value={settings.apiKey}
            placeholder="请输入 API Key"
            class="w-full h-10 pl-3 pr-10 rounded-lg text-sm outline-none"
            style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
          />
          <button
            onclick={() => { showKey = !showKey }}
            aria-label={showKey ? '隐藏 Key' : '显示 Key'}
            class="absolute right-3 top-1/2 -translate-y-1/2"
            style="color: #6B7280;"
            type="button"
          >
            {#if showKey}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {/if}
          </button>
        </div>
        <p class="text-xs mt-1" style="color: #6B7280;">API Key 仅存储在本地，不会上传至任何服务器</p>
      </div>

      <!-- Model -->
      <div>
        <label for="model" class="block text-xs font-medium mb-1.5" style="color: #6B7280;">模型</label>
        <input
          id="model"
          type="text"
          bind:value={settings.model}
          placeholder="例如: gpt-4o"
          class="w-full h-10 px-3 rounded-lg text-sm outline-none"
          style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
        />
      </div>

      <!-- Base URL -->
      <div>
        <label for="baseUrl" class="block text-xs font-medium mb-1.5" style="color: #6B7280;">Base URL（可选）</label>
        <input
          id="baseUrl"
          type="text"
          bind:value={settings.baseUrl}
          placeholder="https://api.openai.com/v1"
          class="w-full h-10 px-3 rounded-lg text-sm outline-none"
          style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
        />
        <p class="text-xs mt-1" style="color: #6B7280;">使用自定义端点或代理时填写</p>
      </div>

      <!-- Feedback -->
      {#if error}
        <div class="px-3 py-2 rounded-lg text-sm" style="background: rgba(199,84,80,0.08); color: #C75450;">
          {error}
        </div>
      {/if}

      {#if saved}
        <div class="px-3 py-2 rounded-lg text-sm" style="background: rgba(59,155,109,0.08); color: #3B9B6D;">
          设置已保存
        </div>
      {/if}

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          onclick={save}
          disabled={saving}
          class="px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200"
          style="background: {saving ? '#E8E5E0' : '#D4763C'}; color: {saving ? '#6B7280' : '#FFFFFF'};"
        >
          {#if saving}
            <span class="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            保存中...
          {:else}
            保存设置
          {/if}
        </button>
      </div>
    </div>
  {/if}

  <!-- About -->
  <div
    class="rounded-xl p-5"
    style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
  >
    <h2 class="font-semibold text-sm mb-3" style="color: #1A1D23;">关于</h2>
    <div class="space-y-2 text-xs" style="color: #6B7280;">
      <div class="flex justify-between">
        <span>应用名称</span>
        <span style="color: #1A1D23;">智聘评估</span>
      </div>
      <div class="flex justify-between">
        <span>版本</span>
        <span style="color: #1A1D23;">v1.0.0</span>
      </div>
      <div class="flex justify-between">
        <span>技术栈</span>
        <span style="color: #1A1D23;">SvelteKit + SQLite + AI</span>
      </div>
    </div>
  </div>
  <p class="text-xs mt-6" style="color: #9CA3AF;">当前版本: v1.0.0</p>
</div>
