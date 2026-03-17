<script lang="ts">
  let { onupload }: { onupload: (candidate: unknown) => void } = $props()

  let isDragOver = $state(false)
  let isUploading = $state(false)
  let uploadError = $state('')
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
      await uploadFile(files[0])
    }
  }

  function handleClick() {
    fileInput.click()
  }

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
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        uploadError = data.message ?? '上传失败，请重试'
        return
      }
      const data = await res.json()
      onupload(data.candidate ?? data)
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
    border: 2px dashed {isDragOver ? '#D4763C' : '#E8E5E0'};
    background: {isDragOver ? 'rgba(212,118,60,0.04)' : '#FAFAF8'};
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
    onchange={handleFileChange}
  />

  <!-- Icon -->
  <div
    class="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-200"
    style="background: {isDragOver ? 'rgba(212,118,60,0.15)' : 'rgba(212,118,60,0.08)'};"
  >
    {#if isUploading}
      <div
        class="w-6 h-6 rounded-full border-2 animate-spin"
        style="border-color: #D4763C transparent transparent transparent;"
      ></div>
    {:else}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4763C" stroke-width="1.8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    {/if}
  </div>

  <!-- Text -->
  <div class="text-center">
    {#if isUploading}
      <p class="text-sm font-medium" style="color: #D4763C;">正在解析简历...</p>
    {:else}
      <p class="text-sm font-semibold mb-1" style="color: #1A1D23;">
        拖拽简历到此处，或
        <span style="color: #D4763C;">点击上传</span>
      </p>
      <p class="text-xs" style="color: #6B7280;">支持 PDF、Word（.doc/.docx）、TXT 格式，单文件最大 10MB</p>
    {/if}
  </div>

  {#if uploadError}
    <div
      class="mt-3 px-3 py-2 rounded-lg text-xs"
      style="background: rgba(199,84,80,0.08); color: #C75450; border: 1px solid rgba(199,84,80,0.2);"
    >
      {uploadError}
    </div>
  {/if}
</div>
