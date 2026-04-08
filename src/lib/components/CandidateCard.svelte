<script lang="ts">
  import type { Candidate } from '$lib/types'
  import { showConfirm } from '$lib/utils/dialog'

  let { candidate, ondelete, onresumechange }: {
    candidate: Candidate
    ondelete: (id: string) => void
    onresumechange: (updated: Candidate) => void
  } = $props()

  let expanded = $state(false)
  let resumeUploading = $state(false)
  let resumeError = $state('')
  let localResume = $state('')
  let resumeFileInput = $state<HTMLInputElement>(null!)

  $effect(() => {
    localResume = candidate.resumeText ?? ''
  })

  function getEducationLabel(edu: string): string {
    const map: Record<string, string> = {
      bachelor: '本科',
      master: '硕士',
      phd: '博士',
      college: '大专',
      other: '其他',
    }
    return map[edu] ?? edu
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation()
    ondelete(candidate.id)
  }

  async function handleDeleteResume(e: MouseEvent) {
    e.stopPropagation()
    if (resumeUploading) return
    if (!(await showConfirm('确定要删除该候选人的简历吗？候选人信息将保留。'))) return
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/resume`, { method: 'DELETE' })
      if (res.ok) {
        localResume = ''
        onresumechange({ ...candidate, resumeText: '' })
      } else {
        resumeError = '删除简历失败，请重试'
      }
    } catch {
      resumeError = '网络错误，请重试'
    }
  }

  function handleReplaceClick(e: MouseEvent) {
    e.stopPropagation()
    if (resumeFileInput) resumeFileInput.click()
  }

  async function handleResumeFileChange(e: Event) {
    const target = e.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return
    const file = target.files[0]
    target.value = ''
    resumeError = ''
    resumeUploading = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('candidateId', candidate.id)
      const res = await fetch('/api/resume/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        resumeError = (data as { error?: string }).error ?? '上传失败，请重试'
        return
      }
      const result = await res.json() as { success: boolean; data?: { text?: string }; error?: string }
      if (result.success) {
        localResume = result.data?.text ?? ''
        onresumechange({ ...candidate, resumeText: localResume })
      } else {
        resumeError = result.error ?? '上传失败'
      }
    } catch {
      resumeError = '网络错误，请重试'
    } finally {
      resumeUploading = false
    }
  }
</script>

<div
  class="rounded-xl transition-all duration-200 overflow-hidden"
  style="
    background: #FFFFFF;
    border: 1px solid #E8E5E0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  "
>
  <!-- Card Header (always visible) -->
  <div
    role="button"
    tabindex="0"
    class="flex items-center gap-4 p-4 cursor-pointer"
    onclick={() => (expanded = !expanded)}
    onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
  >
    <!-- File Type Icon -->
    <div
      class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
      style="background: rgba(212,118,60,0.08); color: #D4763C;"
    >
      PDF
    </div>

    <!-- Main Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-semibold text-sm truncate" style="color: #1A1D23;">
          {candidate.name || '未知姓名'}
        </span>
        {#if candidate.education}
          <span
            class="flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full"
            style="background: rgba(74,127,199,0.08); color: #4A7FC7;"
          >
            {getEducationLabel(candidate.education)}
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-3 text-xs" style="color: #6B7280;">
        {#if candidate.experience !== undefined}
          <span>{candidate.experience} 年经验</span>
        {/if}
      </div>

      <!-- Skills -->
      {#if candidate.skills && candidate.skills.length > 0}
        <div class="flex flex-wrap gap-1 mt-2">
          {#each candidate.skills.slice(0, 4) as skill}
            <span
              class="text-[11px] px-2 py-0.5 rounded-full"
              style="background: rgba(212,118,60,0.08); color: #D4763C;"
            >
              {skill}
            </span>
          {/each}
          {#if candidate.skills.length > 4}
            <span
              class="text-[11px] px-2 py-0.5 rounded-full"
              style="background: #F7F5F2; color: #6B7280;"
            >
              +{candidate.skills.length - 4}
            </span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <!-- Expand Toggle -->
      <div
        class="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
        style="color: #6B7280;"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          style="transform: rotate({expanded ? 180 : 0}deg); transition: transform 0.2s;"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <!-- Delete Button -->
      <button
        class="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-80"
        style="background: rgba(199,84,80,0.08); color: #C75450;"
        title="删除候选人"
        onclick={handleDelete}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Expanded Details -->
  {#if expanded}
    <div
      class="px-4 pb-4 pt-0"
      style="border-top: 1px solid #E8E5E0;"
    >
      <div class="grid grid-cols-2 gap-3 mt-3">
        {#if candidate.email}
          <div class="text-xs">
            <span style="color: #6B7280;">邮箱：</span>
            <span style="color: #1A1D23;">{candidate.email}</span>
          </div>
        {/if}
        {#if candidate.phone}
          <div class="text-xs">
            <span style="color: #6B7280;">电话：</span>
            <span style="color: #1A1D23;">{candidate.phone}</span>
          </div>
        {/if}
        {#if candidate.createdAt}
          <div class="text-xs col-span-2">
            <span style="color: #6B7280;">上传时间：</span>
            <span style="color: #1A1D23;">{new Date(candidate.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        {/if}
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        bind:this={resumeFileInput}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        class="hidden"
        onchange={handleResumeFileChange}
      />

      {#if resumeError}
        <div class="mt-3 px-3 py-2 rounded-lg text-xs" style="background: rgba(199,84,80,0.08); color: #C75450; border: 1px solid rgba(199,84,80,0.2);">
          {resumeError}
        </div>
      {/if}

      {#if localResume}
        <div class="mt-3">
          <div class="flex items-center justify-between mb-1">
            <p class="text-xs" style="color: #6B7280;">简历摘要</p>
            <div class="flex items-center gap-1">
              <button
                class="text-[11px] px-2 py-0.5 rounded-md transition-all duration-200 hover:opacity-80"
                style="background: rgba(212,118,60,0.08); color: #D4763C;"
                onclick={handleReplaceClick}
                disabled={resumeUploading}
              >
                {resumeUploading ? '上传中...' : '重新上传'}
              </button>
              <button
                class="text-[11px] px-2 py-0.5 rounded-md transition-all duration-200 hover:opacity-80"
                style="background: rgba(199,84,80,0.08); color: #C75450;"
                onclick={handleDeleteResume}
                disabled={resumeUploading}
              >
                删除简历
              </button>
            </div>
          </div>
          <p
            class="text-xs leading-relaxed p-3 rounded-lg"
            style="background: #F7F5F2; color: #1A1D23; max-height: 100px; overflow-y: auto;"
          >
            {localResume.slice(0, 300)}{localResume.length > 300 ? '...' : ''}
          </p>
        </div>
      {:else}
        <div class="mt-3 flex items-center gap-2">
          <p class="text-xs" style="color: #6B7280;">暂无简历</p>
          <button
            class="text-[11px] px-2 py-0.5 rounded-md transition-all duration-200 hover:opacity-80"
            style="background: rgba(212,118,60,0.08); color: #D4763C;"
            onclick={handleReplaceClick}
            disabled={resumeUploading}
          >
            {resumeUploading ? '上传中...' : '上传简历'}
          </button>
        </div>
      {/if}

      <!-- All Skills -->
      {#if candidate.skills && candidate.skills.length > 4}
        <div class="mt-3">
          <p class="text-xs mb-2" style="color: #6B7280;">全部技能</p>
          <div class="flex flex-wrap gap-1">
            {#each candidate.skills as skill}
              <span
                class="text-[11px] px-2 py-0.5 rounded-full"
                style="background: rgba(212,118,60,0.08); color: #D4763C;"
              >
                {skill}
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
