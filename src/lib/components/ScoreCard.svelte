<script lang="ts">
  import type { Assessment, Candidate } from '$lib/types'

  let { assessment, candidate, rank }: {
    assessment: Assessment
    candidate?: Candidate
    rank?: number
  } = $props()

  function scoreColor(score: number): string {
    if (score >= 80) return '#3B9B6D'
    if (score >= 60) return '#D4763C'
    return '#C75450'
  }

  function scoreBg(score: number): string {
    if (score >= 80) return 'rgba(59,155,109,0.08)'
    if (score >= 60) return 'rgba(212,118,60,0.08)'
    return 'rgba(199,84,80,0.08)'
  }

  function scoreLabel(score: number): string {
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    if (score >= 40) return '一般'
    return '较弱'
  }
</script>

<div
  class="p-5 rounded-xl transition-all duration-200"
  style="background: #FFFFFF; border: 1px solid #E8E5E0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);"
>
  <!-- Header Row -->
  <div class="flex items-start gap-3 mb-4">
    {#if rank !== undefined}
      <div
        class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style="
          background: {rank === 1 ? '#D4763C' : rank === 2 ? 'rgba(212,118,60,0.2)' : '#F7F5F2'};
          color: {rank === 1 ? '#FFFFFF' : '#D4763C'};
        "
      >
        {rank}
      </div>
    {/if}

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-sm truncate" style="color: #1A1D23;">
          {candidate?.name ?? '候选人'}
        </span>
        {#if candidate?.education}
          <span
            class="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
            style="background: rgba(212,118,60,0.08); color: #D4763C;"
          >
            {candidate.education}
          </span>
        {/if}
      </div>
      {#if candidate?.experience !== undefined}
        <p class="text-xs mt-0.5" style="color: #6B7280;">{candidate.experience} 年经验</p>
      {/if}
    </div>

    <!-- Total Score -->
    <div class="flex flex-col items-end flex-shrink-0">
      <div
        class="text-2xl font-bold leading-none"
        style="color: {scoreColor(assessment.totalScore)};"
      >
        {assessment.totalScore}
      </div>
      <span
        class="text-[11px] px-2 py-0.5 rounded-full mt-1"
        style="background: {scoreBg(assessment.totalScore)}; color: {scoreColor(assessment.totalScore)};"
      >
        {scoreLabel(assessment.totalScore)}
      </span>
    </div>
  </div>

  <!-- Dimension Scores -->
  {#if assessment.scores && assessment.scores.length > 0}
    <div class="space-y-2 mb-4">
      {#each assessment.scores as dim}
        <div class="flex items-center gap-2">
          <span class="text-xs w-20 flex-shrink-0" style="color: #6B7280;">{dim.name}</span>
          <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: #F7F5F2;">
            <div
              class="h-full rounded-full transition-all duration-500"
              style="width: {dim.score}%; background: {scoreColor(dim.score)};"
            ></div>
          </div>
          <span class="text-xs w-7 text-right flex-shrink-0" style="color: {scoreColor(dim.score)}; font-weight: 600;">
            {dim.score}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Strengths & Weaknesses -->
  {#if assessment.strengths?.length > 0 || assessment.weaknesses?.length > 0}
    <div class="grid grid-cols-2 gap-2">
      {#if assessment.strengths?.length > 0}
        <div
          class="p-2.5 rounded-lg"
          style="background: rgba(59,155,109,0.06); border: 1px solid rgba(59,155,109,0.15);"
        >
          <p class="text-[11px] font-medium mb-1.5" style="color: #3B9B6D;">优势</p>
          {#each assessment.strengths.slice(0, 2) as s}
            <p class="text-[11px] leading-relaxed" style="color: #1A1D23;">{s}</p>
          {/each}
        </div>
      {/if}
      {#if assessment.weaknesses?.length > 0}
        <div
          class="p-2.5 rounded-lg"
          style="background: rgba(199,84,80,0.06); border: 1px solid rgba(199,84,80,0.15);"
        >
          <p class="text-[11px] font-medium mb-1.5" style="color: #C75450;">待提升</p>
          {#each assessment.weaknesses.slice(0, 2) as w}
            <p class="text-[11px] leading-relaxed" style="color: #1A1D23;">{w}</p>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
