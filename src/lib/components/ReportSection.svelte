<script lang="ts">
  interface Props {
    title: string
    content: string
  }

  let { title, content }: Props = $props()
</script>

<div
  class="rounded-xl p-5"
  style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: var(--shadow-sm);"
>
  <h3 class="font-semibold text-sm mb-3 flex items-center gap-2" style="color: #1A1D23;">
    <span
      class="w-1 h-4 rounded-full inline-block"
      style="background: #D4763C;"
    ></span>
    {title}
  </h3>
  <div class="text-sm leading-relaxed whitespace-pre-wrap" style="color: #6B7280;">
    {content}
  </div>
</div>
