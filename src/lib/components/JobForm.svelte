<script lang="ts">
  import SkillTagInput from '$lib/components/SkillTagInput.svelte'
  import WeightSlider from '$lib/components/WeightSlider.svelte'
  import type { Job, ScoreDimension } from '$lib/types'

  let { job, onsubmit, oncancel }: {
    job?: Partial<Job>
    onsubmit: (data: Partial<Job>) => void
    oncancel?: () => void
  } = $props()

  const defaultWeights: ScoreDimension[] = [
    { name: '专业技能', weight: 30, score: 0 },
    { name: '项目经验', weight: 25, score: 0 },
    { name: '教育背景', weight: 15, score: 0 },
    { name: '沟通能力', weight: 15, score: 0 },
    { name: '团队协作', weight: 10, score: 0 },
    { name: '发展潜力', weight: 5, score: 0 },
  ]

  let title = $state(job?.title ?? '')
  let department = $state(job?.department ?? '')
  let experience = $state(job?.requirements?.find(r => r.startsWith('exp:'))?.replace('exp:', '') ?? '')
  let education = $state(job?.requirements?.find(r => r.startsWith('edu:'))?.replace('edu:', '') ?? '')
  let description = $state(job?.description ?? '')
  let skills = $state<string[]>(job?.skills ?? [])
  let weights = $state<ScoreDimension[]>(
    job?.weights ?? defaultWeights.map(w => ({ ...w }))
  )

  let submitting = $state(false)
  let errors = $state<Record<string, string>>({})

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = '请输入职位名称'
    if (!department.trim()) newErrors.department = '请输入部门'
    errors = newErrors
    return Object.keys(newErrors).length === 0
  }

  function totalWeight(): number {
    return weights.reduce((sum, w) => sum + w.weight, 0)
  }

  function updateWeight(index: number, value: number) {
    weights = weights.map((w, i) => i === index ? { ...w, weight: value } : w)
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!validateForm()) return

    submitting = true
    try {
      const data: Partial<Job> = {
        title: title.trim(),
        department: department.trim(),
        description: description.trim(),
        skills,
        weights,
        requirements: [
          experience ? `exp:${experience}` : '',
          education ? `edu:${education}` : '',
        ].filter(Boolean),
      }
      if (job?.id) data.id = job.id
      await onsubmit(data)
    } finally {
      submitting = false
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <!-- Basic Info -->
  <div class="grid grid-cols-2 gap-4">
    <!-- Job Title -->
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium" style="color: #1A1D23;">
        职位名称 <span style="color: #C75450;">*</span>
      </label>
      <input
        type="text"
        placeholder="例如：高级前端工程师"
        bind:value={title}
        class="px-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
        style="
          background: #F7F5F2;
          border: 1px solid {errors.title ? '#C75450' : '#E8E5E0'};
          color: #1A1D23;
        "
      />
      {#if errors.title}
        <span class="text-xs" style="color: #C75450;">{errors.title}</span>
      {/if}
    </div>

    <!-- Department -->
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium" style="color: #1A1D23;">
        部门 <span style="color: #C75450;">*</span>
      </label>
      <input
        type="text"
        placeholder="例如：技术研发部"
        bind:value={department}
        class="px-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
        style="
          background: #F7F5F2;
          border: 1px solid {errors.department ? '#C75450' : '#E8E5E0'};
          color: #1A1D23;
        "
      />
      {#if errors.department}
        <span class="text-xs" style="color: #C75450;">{errors.department}</span>
      {/if}
    </div>

    <!-- Experience -->
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium" style="color: #1A1D23;">工作年限要求</label>
      <select
        bind:value={experience}
        class="px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
        style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
      >
        <option value="">不限</option>
        <option value="1">1 年以上</option>
        <option value="2">2 年以上</option>
        <option value="3">3 年以上</option>
        <option value="5">5 年以上</option>
        <option value="8">8 年以上</option>
        <option value="10">10 年以上</option>
      </select>
    </div>

    <!-- Education -->
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium" style="color: #1A1D23;">学历要求</label>
      <select
        bind:value={education}
        class="px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
        style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
      >
        <option value="">不限</option>
        <option value="college">大专及以上</option>
        <option value="bachelor">本科及以上</option>
        <option value="master">硕士及以上</option>
        <option value="phd">博士</option>
      </select>
    </div>
  </div>

  <!-- Skills -->
  <div class="flex flex-col gap-1.5">
    <label class="text-sm font-medium" style="color: #1A1D23;">技能要求</label>
    <SkillTagInput
      {skills}
      onadd={(s) => (skills = [...skills, s])}
      onremove={(s) => (skills = skills.filter(sk => sk !== s))}
    />
    <span class="text-xs" style="color: #6B7280;">输入技能名称后按回车添加</span>
  </div>

  <!-- Description -->
  <div class="flex flex-col gap-1.5">
    <label class="text-sm font-medium" style="color: #1A1D23;">职位描述</label>
    <textarea
      placeholder="描述岗位职责、任职要求等..."
      bind:value={description}
      rows="4"
      class="px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-all duration-200"
      style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #1A1D23;"
    ></textarea>
  </div>

  <!-- Weights -->
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium" style="color: #1A1D23;">评分维度权重</label>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="
          background: {Math.abs(totalWeight() - 100) > 1 ? 'rgba(199,84,80,0.08)' : 'rgba(59,155,109,0.08)'};
          color: {Math.abs(totalWeight() - 100) > 1 ? '#C75450' : '#3B9B6D'};
        "
      >
        合计 {totalWeight()}%
        {#if Math.abs(totalWeight() - 100) > 1}（建议调整为 100%）{/if}
      </span>
    </div>

    <div
      class="p-4 rounded-xl space-y-4"
      style="background: #FAFAF8; border: 1px solid #E8E5E0;"
    >
      {#each weights as w, i}
        <WeightSlider
          name={w.name}
          weight={w.weight}
          onchange={(v) => updateWeight(i, v)}
        />
      {/each}
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3 pt-2">
    {#if oncancel}
      <button
        type="button"
        onclick={oncancel}
        class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        style="background: #F7F5F2; border: 1px solid #E8E5E0; color: #6B7280;"
      >
        取消
      </button>
    {/if}
    <button
      type="submit"
      disabled={submitting}
      class="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-60"
      style="background: #D4763C;"
    >
      {submitting ? '保存中...' : (job?.id ? '更新岗位' : '创建岗位')}
    </button>
  </div>
</form>
