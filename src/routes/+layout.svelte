<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte'
  import { page } from '$app/stores'
  import '../app.css'

  let { children } = $props()

  const breadcrumbMap: Record<string, string[]> = {
    '/': ['工作台'],
    '/candidates': ['简历管理'],
    '/assessment': ['岗位需求'],
    '/assessment/results': ['岗位需求', '智能分析'],
    '/chat': ['AI 对话'],
    '/reports': ['匹配报告'],
    '/settings': ['系统设置'],
  }

  let breadcrumbs = $derived(breadcrumbMap[$page.url.pathname] ?? [$page.url.pathname.replace('/', '')])
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar />

  <main class="flex-1 flex flex-col overflow-hidden" style="background: #F7F5F2;">
    <!-- Topbar -->
    <div
      class="flex items-center justify-between px-7 py-4 flex-shrink-0"
      style="
        background: #FFFFFF;
        border-bottom: 1px solid #E8E5E0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        height: 60px;
      "
    >
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm">
        <span style="color: #6B7280;">智聘评估</span>
        {#each breadcrumbs as crumb, i}
          <span style="color: #6B7280;">/</span>
          <span
            style="color: {i === breadcrumbs.length - 1 ? '#1A1D23' : '#6B7280'}; font-weight: {i === breadcrumbs.length - 1 ? '600' : '400'};"
          >
            {crumb}
          </span>
        {/each}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style="background: #F7F5F2; color: #6B7280; border: 1px solid #E8E5E0;"
          title="通知"
          aria-label="通知"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style="background: #F7F5F2; color: #6B7280; border: 1px solid #E8E5E0;"
          title="帮助"
          aria-label="帮助"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
      </div>
    </div>

    <!-- Page Content -->
    <div class="flex-1 overflow-y-auto p-7 page-enter">
      {@render children()}
    </div>
  </main>
</div>
