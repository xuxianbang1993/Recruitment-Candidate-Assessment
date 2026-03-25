<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte'
  import { page } from '$app/stores'
  import '../app.css'
  import '@fontsource/noto-sans-sc/400.css'
  import '@fontsource/noto-sans-sc/500.css'
  import '@fontsource/noto-sans-sc/600.css'
  import '@fontsource/noto-sans-sc/700.css'
  import '@fontsource/playfair-display/600.css'
  import '@fontsource/playfair-display/700.css'

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
      </div>
    </div>

    <!-- Page Content -->
    <div class="flex-1 overflow-y-auto p-7 page-enter">
      {@render children()}
    </div>
  </main>
</div>
