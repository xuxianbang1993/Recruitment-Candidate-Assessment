<script lang="ts">
  import { page } from '$app/stores'

  const iconMap: Record<string, string> = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    resume: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    job: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
    analysis: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    ai: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    report: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
    setting: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  }

  const navItems = [
    { label: '工作台', href: '/', icon: 'dashboard' },
    { label: '简历管理', href: '/candidates', icon: 'resume' },
    { label: '岗位需求', href: '/assessment', icon: 'job' },
    { label: '智能分析', href: '/assessment/results', icon: 'analysis' },
    { label: 'AI 对话', href: '/chat', icon: 'ai' },
    { label: '匹配报告', href: '/reports', icon: 'report' },
    { label: '系统设置', href: '/settings', icon: 'setting' },
  ]

  function isActive(href: string): boolean {
    return $page.url.pathname === href
  }
</script>

<aside
  class="flex flex-col h-screen w-60 flex-shrink-0"
  style="background: #1A1D23;"
>
  <!-- Brand -->
  <div class="px-5 py-6 border-b border-white/5">
    <div class="flex items-center gap-2.5">
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style="background: linear-gradient(135deg, #D4763C, #E8945A);"
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
          border-left: {active ? '3px solid #D4763C' : '3px solid transparent'};
        "
      >
        <span
          class="flex-shrink-0"
          style="color: {active ? '#D4763C' : 'rgba(229,231,235,0.5)'};"
        >
          {@html iconMap[item.icon]}
        </span>
        <span class="font-medium">{item.label}</span>
      </a>
    {/each}
  </nav>

  <!-- User Info -->
  <div class="px-4 py-4 border-t border-white/5">
    <div class="flex items-center gap-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style="background: linear-gradient(135deg, #D4763C, #4A7FC7);"
      >
        管
      </div>
      <div class="min-w-0">
        <div class="text-white text-xs font-medium truncate">管理员</div>
        <div class="text-white/40 text-xs truncate">招聘评估系统</div>
      </div>
    </div>
  </div>
</aside>
