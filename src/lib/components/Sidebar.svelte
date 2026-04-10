<script lang="ts">
  import { page } from '$app/state'
  import { onMount } from 'svelte'

  const iconMap: Record<string, string> = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    resume: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    profile: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="9" cy="12" r="2"/><path d="M6.5 17c.6-1.5 2-2.5 3.5-2.5s2.9 1 3.5 2.5"/><line x1="16" y1="12" x2="18" y2="12"/><line x1="15" y1="16" x2="18" y2="16"/></svg>',
    job: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
    analysis: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    ai: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    report: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
    setting: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  }

  const navItems = [
    { label: '工作台', href: '/', icon: 'dashboard' },
    { label: '简历管理', href: '/candidates', icon: 'resume' },
    { label: '简历信息库', href: '/resume-profiles', icon: 'profile' },
    { label: '岗位需求', href: '/assessment', icon: 'job' },
    { label: '智能分析', href: '/assessment/results', icon: 'analysis' },
    { label: 'AI 对话', href: '/chat', icon: 'ai' },
    { label: '匹配报告', href: '/reports', icon: 'report' },
    { label: '系统设置', href: '/settings', icon: 'setting' },
  ]

  function isActive(href: string): boolean {
    return page.url.pathname === href
  }

  // --- Update state ---
  type UpdateStep = 'idle' | 'checking' | 'has-update' | 'pulling' | 'installing' | 'done' | 'error'

  let version = $state('')
  let updateStep = $state<UpdateStep>('idle')
  let updateMessage = $state('')
  let updateCommits = $state<{ hash: string; message: string; date: string }[]>([])
  let needsRestart = $state(false)

  onMount(async () => {
    try {
      const res = await fetch('/api/system/version')
      if (res.ok) {
        const json = await res.json()
        if (json.success) version = json.data.version
      }
    } catch { /* ignore */ }
  })

  async function checkUpdate() {
    updateStep = 'checking'
    updateMessage = ''
    updateCommits = []
    try {
      const res = await fetch('/api/system/update')
      const json = await res.json()
      if (!json.success) {
        updateStep = 'error'
        updateMessage = json.error
        return
      }
      if (json.data.hasUpdate) {
        updateStep = 'has-update'
        updateCommits = json.data.commits
        updateMessage = `发现 ${json.data.behindCount} 个更新`
      } else {
        updateStep = 'done'
        updateMessage = '已是最新版本'
        setTimeout(() => { updateStep = 'idle' }, 3000)
      }
    } catch {
      updateStep = 'error'
      updateMessage = '网络错误，无法检查更新'
    }
  }

  async function applyUpdate() {
    updateStep = 'pulling'
    updateMessage = '正在拉取代码...'
    try {
      const res = await fetch('/api/system/update', { method: 'POST' })
      const json = await res.json()
      if (!json.success) {
        updateStep = 'error'
        updateMessage = json.error
        return
      }
      needsRestart = json.data.needsRestart
      updateStep = 'done'
      updateMessage = json.data.message

      if (!needsRestart) {
        // Vite HMR will handle it — auto-refresh after a short delay
        setTimeout(() => { window.location.reload() }, 2000)
      }
    } catch {
      updateStep = 'error'
      updateMessage = '更新失败，请检查网络'
    }
  }

  function dismissUpdate() {
    updateStep = 'idle'
    updateMessage = ''
    updateCommits = []
    needsRestart = false
  }
</script>

<aside
  class="flex flex-col h-screen w-60 flex-shrink-0"
  style="background: var(--color-bg-sidebar);"
>
  <!-- Brand -->
  <div class="px-5 py-6 border-b border-white/5">
    <div class="flex items-center gap-2.5">
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style="background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light));"
      >
        智
      </div>
      <div>
        <div class="font-bold text-white text-sm leading-tight" style="font-family: 'Noto Sans SC', sans-serif; font-weight: 700;">
          智聘评估
        </div>
        <div class="text-white/40 text-xs leading-tight mt-0.5">招聘智能评估系统</div>
      </div>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
    {#each navItems as item}
      {@const active = isActive(item.href)}
      <a
        href={item.href}
        aria-current={active ? 'page' : undefined}
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
        style="
          font-size: 13.5px;
          color: {active ? '#ffffff' : 'rgba(229,231,235,0.65)'};
          background: {active ? 'rgba(212,118,60,0.18)' : 'transparent'};
          border-left: {active ? '3px solid var(--color-accent)' : '3px solid transparent'};
        "
      >
        <span
          class="flex-shrink-0"
          style="color: {active ? 'var(--color-accent)' : 'rgba(229,231,235,0.5)'};"
        >
          {@html iconMap[item.icon]}
        </span>
        <span class="font-medium">{item.label}</span>
      </a>
    {/each}
  </nav>

  <!-- Update Section -->
  <div class="px-3 pb-2">
    {#if updateStep === 'has-update'}
      <!-- Update available panel -->
      <div class="rounded-lg p-3 space-y-2" style="background: rgba(212,118,60,0.12);">
        <div class="text-xs font-medium" style="color: var(--color-accent);">{updateMessage}</div>
        <div class="max-h-24 overflow-y-auto space-y-1">
          {#each updateCommits.slice(0, 5) as c}
            <div class="text-white/50 text-xs truncate" title="{c.hash} {c.message}">
              <span style="color: var(--color-accent);">{c.hash}</span> {c.message}
            </div>
          {/each}
          {#if updateCommits.length > 5}
            <div class="text-white/30 text-xs">... 还有 {updateCommits.length - 5} 条</div>
          {/if}
        </div>
        <div class="flex gap-2">
          <button
            onclick={applyUpdate}
            class="flex-1 h-7 rounded text-xs font-medium transition-colors"
            style="background: var(--color-accent); color: white;"
          >
            立即更新
          </button>
          <button
            onclick={dismissUpdate}
            class="h-7 px-2 rounded text-xs transition-colors"
            style="color: rgba(255,255,255,0.4);"
          >
            稍后
          </button>
        </div>
      </div>
    {:else if updateStep === 'pulling' || updateStep === 'installing'}
      <!-- Progress -->
      <div class="rounded-lg p-3" style="background: rgba(74,127,199,0.12);">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full border-2 border-white/20 border-t-white/60 animate-spin"></span>
          <span class="text-xs" style="color: var(--color-info);">{updateMessage}</span>
        </div>
      </div>
    {:else if updateStep === 'done'}
      <!-- Done -->
      <div class="rounded-lg p-3" style="background: rgba(59,155,109,0.12);">
        <div class="text-xs" style="color: var(--color-success);">{updateMessage}</div>
        {#if needsRestart}
          <div class="text-white/40 text-xs mt-1">请手动重启 npm run dev</div>
        {/if}
      </div>
    {:else if updateStep === 'error'}
      <!-- Error -->
      <div class="rounded-lg p-3" style="background: rgba(199,84,80,0.12);">
        <div class="text-xs" style="color: var(--color-danger);">{updateMessage}</div>
        <button
          onclick={dismissUpdate}
          class="text-white/40 text-xs mt-1 underline"
        >
          关闭
        </button>
      </div>
    {/if}
  </div>

  <!-- Version + Check Update -->
  <div class="px-4 py-3 border-t border-white/5">
    <div class="flex items-center justify-between">
      <span class="text-white/30 text-xs">
        {version ? `v${version}` : ''}
      </span>
      <button
        onclick={checkUpdate}
        disabled={updateStep === 'checking' || updateStep === 'pulling' || updateStep === 'installing'}
        class="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-40"
        style="color: rgba(229,231,235,0.5);"
      >
        {#if updateStep === 'checking'}
          <span class="w-3 h-3 rounded-full border border-white/20 border-t-white/50 animate-spin"></span>
          检查中
        {:else}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          检查更新
        {/if}
      </button>
    </div>
  </div>
</aside>
