<script lang="ts">
  interface TimelineItem {
    title: string
    subtitle: string
    period: string
    description?: string
  }

  let { items }: { items: TimelineItem[] } = $props()

  const hasItems = $derived(items.length > 0)
</script>

{#if hasItems}
  <div class="space-y-0">
    {#each items as item, index (`${item.title}-${item.subtitle}-${index}`)}
      <div class="grid grid-cols-[1.5rem_1fr] gap-3">
        <div class="relative flex justify-center pt-1">
          <span
            class="h-3 w-3 rounded-full border-2 bg-[var(--color-bg-card)]"
            style="border-color: var(--color-accent);"
          ></span>
          {#if index < items.length - 1}
            <span
              class="absolute bottom-0 top-4 w-px"
              style="background: var(--color-border);"
            ></span>
          {/if}
        </div>

        <div class="pb-5">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="text-sm font-semibold" style="color: var(--color-text-primary);">
                {item.title}
              </div>
              {#if item.subtitle}
                <div class="mt-0.5 text-sm" style="color: var(--color-text-secondary);">
                  {item.subtitle}
                </div>
              {/if}
            </div>

            <div class="text-xs whitespace-nowrap" style="color: var(--color-text-secondary);">
              {item.period}
            </div>
          </div>

          {#if item.description}
            <p class="mt-2 text-sm leading-6 whitespace-pre-wrap" style="color: var(--color-text-primary);">
              {item.description}
            </p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
