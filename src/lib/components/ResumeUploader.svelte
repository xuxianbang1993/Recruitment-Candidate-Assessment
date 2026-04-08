<script lang="ts">
  import type { Candidate } from '$lib/types'

  let { onupload, multiple = false, jobId }: {
    onupload: (candidate: Candidate) => void
    multiple?: boolean
    jobId: string
  } = $props()

  let isDragOver = $state(false)
  let isUploading = $state(false)
  let uploadError = $state('')
  let uploadProgress = $state('')
  let fileInput: HTMLInputElement

  function handleDragEnter(e: DragEvent) {
    e.preventDefault()
    isDragOver = true
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    isDragOver = false
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    isDragOver = true
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    isDragOver = false
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      await uploadFiles(Array.from(files))
    }
  }

  function handleClick() {
    fileInput.click()
  }

  async function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      await uploadFiles(Array.from(target.files))
      target.value = ''
    }
  }

  async function uploadFiles(files: File[]) {
    const toUpload = multiple ? files : [files[0]]
    const total = toUpload.length
    for (let i = 0; i < total; i++) {
      if (total > 1) uploadProgress = `正在上传 ${i + 1}/${total}...`
      await uploadFile(toUpload[i])
    }
    uploadProgress = ''
  }

  async function uploadFile(file: File) {
    uploadError = ''
    isUploading = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('createCandidate', 'true')
      formData.append('jobId', jobId)
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        uploadError = data.error ?? '上传失败，请重试'
        return
      }
      const json = await res.json()
      if (json.success && json.data?.candidateId) {
        // Fetch the created candidate to get full object
        const candidateRes = await fetch(`/api/candidates/${json.data.candidateId}`)
        if (candidateRes.ok) {
          const candidateJson = await candidateRes.json()
          const candidate = candidateJson.success ? candidateJson.data : candidateJson
          onupload(candidate)
        } else {
          onupload({ id: json.data.candidateId, name: file.name.replace(/\.[^.]+$/, '') } as Candidate)
        }
      } else {
        uploadError = json.error ?? '上传失败'
      }
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
    border: 2px dashed {isDragOver ? 'var(--color-accent)' : 'var(--color-border)'};
    background: {isDragOver ? 'rgba(212,118,60,0.04)' : 'var(--color-bg-primary)'};
    padding: 48px 32px;
    min-height: 200px;
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
    accept=".pdf,.doc,.docx,.txt"
    class="hidden"
    {multiple}
    onchange={handleFileChange}
  />

  <!-- Icon -->
  <div
    class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-200"
    style="background: {isDragOver ? 'rgba(212,118,60,0.15)' : 'var(--color-accent-bg)'};"
  >
    {#if isUploading}
      <div
        class="w-6 h-6 rounded-full border-2 animate-spin"
        style="border-color: var(--color-accent) transparent transparent transparent;"
      ></div>
    {:else}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="1.8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    {/if}
  </div>

  <!-- Text -->
  <div class="text-center">
    {#if isUploading}
      <p class="text-sm font-medium" style="color: var(--color-accent);">{uploadProgress || '正在解析简历...'}</p>
    {:else}
      <p class="text-sm font-semibold mb-1" style="color: var(--color-text-primary);">
        拖拽简历到此处，或
        <span style="color: var(--color-accent);">点击上传</span>
      </p>
      <p class="text-xs" style="color: var(--color-text-secondary);">支持 PDF、Word（.doc/.docx）、TXT 格式，单文件最大 10MB</p>
    {/if}
  </div>

  {#if uploadError}
    <div
      class="mt-3 px-3 py-2 rounded-lg text-xs"
      style="background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid rgba(199,84,80,0.2);"
    >
      {uploadError}
    </div>
  {/if}
</div>
