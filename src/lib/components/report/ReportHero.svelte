<script lang="ts">
  let { name, jobTitle, department, experience, education, totalScore }: {
    name: string
    jobTitle: string
    department: string
    experience: number
    education: string
    totalScore: number
  } = $props()

  const avatarChar = $derived(name ? name.charAt(0) : '?')

  const circumference = 251.33
  const dashoffset = $derived(circumference * (1 - Math.min(Math.max(totalScore, 0), 100) / 100))

  const badge = $derived(
    totalScore >= 80
      ? { label: '推荐复试', cls: 'badge-green' }
      : totalScore >= 60
        ? { label: '建议考虑', cls: 'badge-yellow' }
        : { label: '暂不推荐', cls: 'badge-red' }
  )
</script>

<div class="hero-left">
  <div class="hero-avatar">{avatarChar}</div>
  <div class="hero-info">
    <h2>{name}</h2>
    <div class="hero-meta">
      {#if jobTitle}
        <span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          {jobTitle}{department ? `（${department}）` : ''}
        </span>
      {/if}
      {#if experience}
        <span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {experience}年经验
        </span>
      {/if}
      {#if education}
        <span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          {education}
        </span>
      {/if}
    </div>
  </div>
</div>
<div class="hero-right">
  <div class="hero-score">
    <svg class="hero-score-ring" viewBox="0 0 88 88">
      <circle class="bg" cx="44" cy="44" r="40"/>
      <circle class="fg" cx="44" cy="44" r="40" style="stroke-dashoffset: {dashoffset};"/>
    </svg>
    <div class="hero-score-value">{totalScore}</div>
  </div>
  <div class="hero-score-label">综合得分</div>
  <div class="hero-badge {badge.cls}">
    {#if badge.cls === 'badge-green'}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
    {:else if badge.cls === 'badge-yellow'}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    {:else}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    {/if}
    {badge.label}
  </div>
</div>

<style>
  /* Hero layout */
  :host, :global(.hero-card) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .hero-left {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 28px 0 28px 32px;
    flex: 1;
  }
  .hero-avatar {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #D4763C 0%, #E8954C 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .hero-info h2 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
    color: #1A1D23;
  }
  .hero-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #6B7280;
    flex-wrap: wrap;
  }
  .hero-meta span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .hero-right {
    text-align: center;
    flex-shrink: 0;
    padding: 28px 32px 28px 0;
  }
  .hero-score {
    position: relative;
    width: 88px;
    height: 88px;
  }
  .hero-score-ring {
    width: 88px;
    height: 88px;
    transform: rotate(-90deg);
  }
  .hero-score-ring circle {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
  }
  .hero-score-ring .bg { stroke: #E8E5E0; }
  .hero-score-ring .fg {
    stroke: #D4763C;
    stroke-dasharray: 251.33;
    transition: stroke-dashoffset 1.5s ease;
  }
  .hero-score-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 22px;
    font-weight: 800;
    color: #D4763C;
  }
  .hero-score-label {
    font-size: 12px;
    color: #6B7280;
    margin-top: 6px;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    margin-top: 6px;
  }
  .badge-green  { background: rgba(16,185,129,0.08);  color: #10B981; }
  .badge-yellow { background: rgba(245,158,11,0.08);  color: #F59E0B; }
  .badge-red    { background: rgba(199,84,80,0.08);   color: #C75450; }
</style>
