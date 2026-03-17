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

  onMount(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          stats = json.data
        }
      }
    } catch {
      // Use defaults on error
    } finally {
      loading = false
    }
  })

  const quickActions = [
    { label: '上传简历', href: '/candidates', icon: 'icon-upload', desc: '支持 PDF / Word / TXT' },
    { label: '创建岗位', href: '/assessment', icon: 'icon-add-circle', desc: '定义岗位要求与权重' },
    { label: 'AI 智能分析', href: '/assessment/results', icon: 'icon-ai', desc: '批量评估候选人' },
    { label: '查看报告', href: '/reports', icon: 'icon-report', desc: '生成详细匹配报告' },
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
    <p class="text-sm mt-1" style="color: #6B7280;">欢迎回来，李明辉。以下是今日概况。</p>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
    <StatCard
      label="候选人总数"
      value={loading ? '—' : stats.totalCandidates}
      sub="累计上传简历"
      icon="icon-resume"
      color="accent"
    />
    <StatCard
      label="岗位需求"
      value={loading ? '—' : stats.totalJobs}
      sub="已创建岗位"
      icon="icon-job"
      color="info"
    />
    <StatCard
      label="完成评估"
      value={loading ? '—' : stats.totalAssessments}
      sub="AI 评估记录"
      icon="icon-analysis"
      color="success"
    />
    <StatCard
      label="平均匹配分"
      value={loading ? '—' : stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '—'}
      sub="综合评分均值"
      icon="icon-score"
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
            style="background: rgba(212,118,60,0.08);"
          >
            <i class="iconfont {action.icon} text-base" style="color: #D4763C;"></i>
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
