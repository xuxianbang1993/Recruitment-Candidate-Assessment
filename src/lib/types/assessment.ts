export interface Assessment {
  id: string
  candidateId: string
  jobId: string
  scores: ScoreDimension[]
  totalScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  aiProvider: string
  createdAt: string
}

export interface ScoreDimension {
  name: string
  weight: number
  score: number
}

export interface Job {
  id: string
  title: string
  department: string
  category: string
  description: string
  requirements: string[]
  skills: string[]
  weights: ScoreDimension[]
  createdAt: string
}
