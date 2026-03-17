export function scoreColor(score: number): string {
  if (score >= 80) return '#3B9B6D'
  if (score >= 60) return '#D4763C'
  return '#C75450'
}

export function scoreBg(score: number): string {
  if (score >= 80) return 'rgba(59,155,109,0.08)'
  if (score >= 60) return 'rgba(212,118,60,0.08)'
  return 'rgba(199,84,80,0.08)'
}

export function scoreLabel(score: number): string {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '较弱'
}
