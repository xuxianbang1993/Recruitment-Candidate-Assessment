<script lang="ts">
  import { onMount } from 'svelte'
  import StatCard from '$lib/components/StatCard.svelte'

  interface Stats {
    totalCandidates: number
    totalJobs: number
    totalAssessments: number
    avgScore: number
  }

  let stats = $state<Stats>({
    totalCandidates: 0,
    totalJobs: 0,
    totalAssessments: 0,
    avgScore: 0,
  })

  let loading = $state(true)
  let error = $state('')

  onMount(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          stats = json.data
        }
      } else {
        error = '加载统计数据失败'
      }
    } catch (e) {
      console.error('Stats load failed:', e)
      error = '加载统计数据失败'
    } finally {
      loading = false
    }
  })

  const svgResume = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
  const svgJob = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>'
  const svgAnalysis = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
  const svgScore = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  const svgUpload = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>'
  const svgAddCircle = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
  const svgAi = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  const svgReport = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>'

  const quickActions = [
    { label: '上传简历', href: '/candidates', icon: svgUpload, desc: '支持 PDF / Word / TXT' },
    { label: '创建岗位', href: '/assessment', icon: svgAddCircle, desc: '定义岗位要求与权重' },
    { label: 'AI 智能分析', href: '/assessment/results', icon: svgAi, desc: '批量评估候选人' },
    { label: '查看报告', href: '/reports', icon: svgReport, desc: '生成详细匹配报告' },
  ]

  const guide = [
    { step: 1, title: '创建岗位需求', desc: '填写岗位基本信息，配置技能权重' },
    { step: 2, title: '上传候选人简历', desc: '支持批量上传，AI 自动解析' },
    { step: 3, title: '运行智能评估', desc: 'AI 对候选人进行多维度打分' },
    { step: 4, title: '查看匹配报告', desc: '获取候选人排名和详细分析报告' },
  ]
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="font-semibold" style="font-size: 16px; color: #1A1D23;">工作台</h1>
    <p class="text-sm mt-1" style="color: #6B7280;">欢迎回来。以下是今日概况。</p>
  </div>

  <!-- Error Alert -->
  {#if error}
    <div
      class="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
      style="background: rgba(199,84,80,0.08); border: 1px solid rgba(199,84,80,0.2); color: #C75450;"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {error}
    </div>
  {/if}

  <!-- Stats Grid -->
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
    <StatCard
      label="候选人总数"
      value={loading ? '—' : stats.totalCandidates}
      sub="累计上传简历"
      icon={svgResume}
      color="accent"
    />
    <StatCard
      label="岗位需求"
      value={loading ? '—' : stats.totalJobs}
      sub="已创建岗位"
      icon={svgJob}
      color="info"
    />
    <StatCard
      label="完成评估"
      value={loading ? '—' : stats.totalAssessments}
      sub="AI 评估记录"
      icon={svgAnalysis}
      color="success"
    />
    <StatCard
      label="平均匹配分"
      value={loading ? '—' : stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '—'}
      sub="综合评分均值"
      icon={svgScore}
      color="warning"
    />
  </div>

  <!-- Quick Actions -->
  <div>
    <h2 class="text-sm font-semibold mb-3" style="color: #1A1D23;">快捷操作</h2>
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {#each quickActions as action}
        <a
          href={action.href}
          class="flex flex-col gap-2 p-4 rounded-xl transition-all duration-200 group"
          style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
          onmouseenter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = 'var(--shadow-md)'
            el.style.borderColor = '#D4763C'
            el.style.transform = 'translateY(-2px)'
          }}
          onmouseleave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = 'var(--shadow-sm)'
            el.style.borderColor = '#E8E5E0'
            el.style.transform = 'translateY(0)'
          }}
        >
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center"
            style="background: rgba(212,118,60,0.08); color: #D4763C;"
          >
            {@html action.icon}
          </div>
          <div>
            <div class="text-sm font-medium" style="color: #1A1D23;">{action.label}</div>
            <div class="text-xs mt-0.5" style="color: #6B7280;">{action.desc}</div>
          </div>
        </a>
      {/each}
    </div>
  </div>

  <!-- Guide -->
  <div>
    <h2 class="text-sm font-semibold mb-3" style="color: #1A1D23;">操作指引</h2>
    <div
      class="rounded-xl p-5"
      style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
    >
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {#each guide as step}
          <div class="flex items-start gap-3">
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style="background: linear-gradient(135deg, #D4763C, #E8945A);"
            >
              {step.step}
            </div>
            <div>
              <div class="text-sm font-medium" style="color: #1A1D23;">{step.title}</div>
              <div class="text-xs mt-0.5" style="color: #6B7280;">{step.desc}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
