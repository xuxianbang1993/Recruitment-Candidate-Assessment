<script lang="ts">
  import type { Attachment } from '$lib/types'

  let { attachments, ondelete }: {
    attachments: Attachment[]
    ondelete: (id: string) => void
  } = $props()

  let confirmingId = $state<string | null>(null)

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function getTypeIcon(fileType: string): { color: string; label: string } {
    switch (fileType) {
      case 'pdf': return { color: 'var(--color-danger)', label: 'PDF' }
      case 'docx': return { color: 'var(--color-info)', label: 'DOC' }
      case 'txt': return { color: 'var(--color-text-secondary)', label: 'TXT' }
      case 'audio': return { color: '#8B5CF6', label: 'MP3' }
      case 'image': return { color: 'var(--color-success)', label: 'IMG' }
      default: return { color: 'var(--color-text-secondary)', label: 'FILE' }
    }
  }

  function handleDelete(id: string) {
    if (confirmingId === id) {
      ondelete(id)
      confirmingId = null
    } else {
      confirmingId = id
    }
  }
</script>

{#if attachments.length === 0}
  <p class="text-sm py-4 text-center" style="color: var(--color-text-secondary);">暂无附件</p>
{:else}
  <div class="space-y-2">
    {#each attachments as attachment (attachment.id)}
      {@const icon = getTypeIcon(attachment.fileType)}
      <div
        role="listitem"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
        style="background: var(--color-bg-card); border: 1px solid var(--color-border);"
        onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)' }}
        onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; if (confirmingId === attachment.id) confirmingId = null }}
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style="background: {icon.color};"
        >
          {icon.label}
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate" style="color: var(--color-text-primary);">{attachment.originalName}</p>
          <p class="text-xs" style="color: var(--color-text-secondary);">{formatSize(attachment.fileSize)}</p>
        </div>

        <button
          class="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 shrink-0"
          style="
            background: {confirmingId === attachment.id ? 'rgba(199,84,80,0.1)' : 'transparent'};
            color: {confirmingId === attachment.id ? 'var(--color-danger)' : 'var(--color-text-secondary)'};
            border: 1px solid {confirmingId === attachment.id ? 'rgba(199,84,80,0.3)' : 'transparent'};
          "
          onclick={() => handleDelete(attachment.id)}
        >
          {confirmingId === attachment.id ? '确认删除?' : '删除'}
        </button>
      </div>
    {/each}
  </div>
{/if}
