<script lang="ts">
  import type { Attachment } from '$lib/server/db/attachment-dao'

  let { assessmentId, onupload }: {
    assessmentId: string
    onupload: (attachment: Attachment) => void
  } = $props()

  let isDragOver = $state(false)
  let isUploading = $state(false)
  let uploadError = $state('')
  let fileInput: HTMLInputElement

  function handleDragEnter(e: DragEvent) { e.preventDefault(); isDragOver = true }
  function handleDragLeave(e: DragEvent) { e.preventDefault(); isDragOver = false }
  function handleDragOver(e: DragEvent) { e.preventDefault(); isDragOver = true }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDragOver = false
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      await uploadFile(files[0])
    }
  }

  function handleClick() { fileInput.click() }

  async function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      await uploadFile(target.files[0])
      target.value = ''
    }
  }

  async function uploadFile(file: File) {
    uploadError = ''
    isUploading = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/assessments/${assessmentId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        uploadError = json.error ?? '上传失败，请重试'
        return
      }
      onupload(json.data)
    } catch {
      uploadError = '网络错误，请检查连接后重试'
    } finally {
      isUploading = false
    }
  }
</script>

<div
  role="button"
  tabindex="0"
  class="relative flex flex-col items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer select-none"
  style="
    border: 2px dashed {isDragOver ? 'var(--color-accent, #D4763C)' : '#E8E5E0'};
    background: {isDragOver ? 'rgba(212,118,60,0.04)' : '#FAFAF8'};
    padding: 32px 24px;
    min-height: 140px;
  "
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragover={handleDragOver}
  ondrop={handleDrop}
  onclick={handleClick}
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
  <input
    bind:this={fileInput}
    type="file"
    accept=".pdf,.docx,.doc,.txt,.mp3,.wav,.m4a,.jpg,.jpeg,.png"
    class="hidden"
    onchange={handleFileChange}
  />

  <div
    class="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200"
    style="background: {isDragOver ? 'rgba(212,118,60,0.15)' : 'rgba(212,118,60,0.08)'};"
  >
    {#if isUploading}
      <div class="w-5 h-5 rounded-full border-2 animate-spin" style="border-color: var(--color-accent, #D4763C) transparent transparent transparent;"></div>
    {:else}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #D4763C)" stroke-width="1.8">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
      </svg>
    {/if}
  </div>

  <div class="text-center">
    {#if isUploading}
      <p class="text-sm font-medium" style="color: var(--color-accent, #D4763C);">正在上传...</p>
    {:else}
      <p class="text-sm font-semibold mb-1" style="color: #1A1D23;">
        拖拽面试材料到此处，或 <span style="color: var(--color-accent, #D4763C);">点击上传</span>
      </p>
      <p class="text-xs" style="color: #6B7280;">支持 PDF、Word、TXT、音频（MP3/WAV）、图片格式</p>
    {/if}
  </div>

  {#if uploadError}
    <div class="mt-3 px-3 py-2 rounded-lg text-xs" style="background: rgba(199,84,80,0.08); color: var(--color-danger, #C75450); border: 1px solid rgba(199,84,80,0.2);">
      {uploadError}
    </div>
  {/if}
</div>
