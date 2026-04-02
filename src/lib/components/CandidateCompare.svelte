<script lang="ts">
  import type { Assessment, Candidate } from '$lib/types'

  let { assessments, candidates }: {
    assessments: Assessment[]
    candidates: Candidate[]
  } = $props()

  function getCandidateName(candidateId: string): string {
    return candidates.find(c => c.id === candidateId)?.name ?? '候选人'
  }

  function scoreColor(score: number): string {
    if (score >= 80) return 'var(--color-success)'
    if (score >= 60) return 'var(--color-accent)'
    return 'var(--color-danger)'
  }

  // Collect all dimension names from all assessments
  let allDimNames = $derived(
    Array.from(new Set(assessments.flatMap(a => a.scores.map(s => s.name))))
  )

  function getDimScore(assessment: Assessment, dimName: string): number {
    return assessment.scores.find(s => s.name === dimName)?.score ?? 0
  }

  function maxScore(dimName: string): number {
    return Math.max(...assessments.map(a => getDimScore(a, dimName)), 1)
  }
</script>

{#if assessments.length === 0}
  <div class="text-center py-8" style="color: var(--color-text-secondary);">
    <p class="text-sm">暂无评估数据可对比</p>
  </div>
{:else}
  <div class="overflow-x-auto">
    <table class="w-full text-sm border-separate" style="border-spacing: 0;">
      <!-- Header -->
      <thead>
        <tr>
          <th
            class="text-left p-3 font-medium text-xs sticky left-0"
            style="background: var(--color-bg-primary); color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); min-width: 80px;"
          >
            评估维度
          </th>
          {#each assessments as a}
            <th
              class="text-center p-3 font-medium text-xs"
              style="background: var(--color-bg-primary); color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); min-width: 120px;"
            >
              <div>{getCandidateName(a.candidateId)}</div>
              <div
                class="text-lg font-bold mt-0.5 leading-none"
                style="color: {scoreColor(a.totalScore)};"
              >
                {a.totalScore}
              </div>
            </th>
          {/each}
        </tr>
      </thead>

      <!-- Rows -->
      <tbody>
        {#each allDimNames as dim}
          <tr>
            <td
              class="p-3 text-xs font-medium sticky left-0"
              style="background: var(--color-bg-primary); color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border);"
            >
              {dim}
            </td>
            {#each assessments as a}
              {@const score = getDimScore(a, dim)}
              {@const max = maxScore(dim)}
              <td
                class="p-3 text-center"
                style="background: var(--color-bg-card); border-bottom: 1px solid var(--color-border);"
              >
                <div
                  class="text-sm font-bold mb-1"
                  style="color: {scoreColor(score)};"
                >
                  {score}
                </div>
                <div class="h-1 rounded-full overflow-hidden mx-3" style="background: var(--color-bg-primary);">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    style="width: {max > 0 ? (score / max) * 100 : 0}%; background: {scoreColor(score)};"
                  ></div>
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
