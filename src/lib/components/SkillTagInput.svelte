<script lang="ts">
  let { skills, onadd, onremove }: {
    skills: string[]
    onadd: (skill: string) => void
    onremove: (skill: string) => void
  } = $props()

  let inputValue = $state('')
  let focused = $state(false)

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const skill = inputValue.trim()
      if (!skills.includes(skill)) {
        onadd(skill)
      }
      inputValue = ''
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      onremove(skills[skills.length - 1])
    }
  }
</script>

<div
  class="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 cursor-text"
  style="
    border: 1px solid {focused ? '#D4763C' : '#E8E5E0'};
    background: #F7F5F2;
    min-height: 42px;
    box-shadow: {focused ? '0 0 0 3px rgba(212,118,60,0.12)' : 'none'};
  "
  onclick={() => {
    const el = document.querySelector('.skill-input') as HTMLInputElement
    el?.focus()
  }}
  role="group"
>
  {#each skills as skill}
    <span
      class="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 transition-all duration-200"
      style="
        background: rgba(212,118,60,0.1);
        color: #D4763C;
        border-radius: 14px;
        font-weight: 500;
      "
    >
      {skill}
      <button
        type="button"
        class="flex items-center justify-center w-3.5 h-3.5 rounded-full transition-colors hover:opacity-70"
        style="color: #D4763C;"
        onclick={(e) => { e.stopPropagation(); onremove(skill) }}
        aria-label="删除 {skill}"
      >
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="1" y1="1" x2="11" y2="11"/>
          <line x1="11" y1="1" x2="1" y2="11"/>
        </svg>
      </button>
    </span>
  {/each}

  <input
    class="skill-input flex-1 min-w-20 bg-transparent outline-none text-sm"
    style="color: #1A1D23; border: none;"
    placeholder={skills.length === 0 ? '输入技能后按回车添加...' : ''}
    bind:value={inputValue}
    onkeydown={handleKeydown}
    onfocus={() => (focused = true)}
    onblur={() => (focused = false)}
  />
</div>
