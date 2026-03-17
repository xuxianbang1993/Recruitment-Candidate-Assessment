<script lang="ts">
  import { page } from '$app/stores'

  const navItems = [
    { label: '工作台', href: '/', icon: 'iconfont icon-dashboard' },
    { label: '简历管理', href: '/candidates', icon: 'iconfont icon-resume' },
    { label: '岗位需求', href: '/assessment', icon: 'iconfont icon-job' },
    { label: '智能分析', href: '/assessment/results', icon: 'iconfont icon-analysis' },
    { label: 'AI 对话', href: '/chat', icon: 'iconfont icon-ai' },
    { label: '匹配报告', href: '/reports', icon: 'iconfont icon-report' },
  ]

  function isActive(href: string): boolean {
    if (href === '/') return $page.url.pathname === '/'
    return $page.url.pathname.startsWith(href)
  }
</script>

<aside
  class="flex flex-col h-screen w-56 flex-shrink-0"
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
        <div class="font-bold text-white text-sm leading-tight" style="font-family: 'Playfair Display', serif;">
          智聘评估
        </div>
        <div class="text-white/40 text-xs leading-tight mt-0.5">招聘智能评估系统</div>
      </div>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
        style="
          font-size: 13.5px;
          color: {isActive(item.href) ? '#ffffff' : 'rgba(229,231,235,0.65)'};
          background: {isActive(item.href) ? 'rgba(212,118,60,0.18)' : 'transparent'};
          border-left: {isActive(item.href) ? '3px solid #D4763C' : '3px solid transparent'};
        "
      >
        <i
          class="{item.icon} text-base flex-shrink-0"
          style="color: {isActive(item.href) ? '#D4763C' : 'rgba(229,231,235,0.5)'};"
        ></i>
        <span class="font-medium">{item.label}</span>
      </a>
    {/each}
  </nav>

  <!-- Settings -->
  <div class="px-3 py-3 border-t border-white/5">
    <a
      href="/settings"
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
      style="
        font-size: 13.5px;
        color: {isActive('/settings') ? '#ffffff' : 'rgba(229,231,235,0.65)'};
        background: {isActive('/settings') ? 'rgba(212,118,60,0.18)' : 'transparent'};
        border-left: {isActive('/settings') ? '3px solid #D4763C' : '3px solid transparent'};
      "
    >
      <i
        class="iconfont icon-setting text-base flex-shrink-0"
        style="color: {isActive('/settings') ? '#D4763C' : 'rgba(229,231,235,0.5)'};"
      ></i>
      <span class="font-medium">系统设置</span>
    </a>
  </div>

  <!-- User Info -->
  <div class="px-4 py-4 border-t border-white/5">
    <div class="flex items-center gap-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style="background: linear-gradient(135deg, #D4763C, #4A7FC7);"
      >
        李
      </div>
      <div class="min-w-0">
        <div class="text-white text-xs font-medium truncate">李明辉</div>
        <div class="text-white/40 text-xs truncate">招聘经理</div>
      </div>
    </div>
  </div>
</aside>
