/**
 * Types for Performance Analytics (Phase 4D)
 */

export interface UserStats {
  userId: string
  totalAttempts: number
  totalQuestions: number
  correctAnswers: number
  overallAccuracy: number // 0-1
  averageConfidence: number // 0-1
  averageMastery: number // 0-100
  studyTimeMinutes: number
  questionsPerSession: number
  currentStreak: number // Days
  longestStreak: number // Days
}

export interface DomainPerformance {
  domain: string
  attempts: number
  correct: number
  accuracy: number // 0-1
  masteryScore: number // 0-100
  topicsCompleted: number
  topicsInProgress: number
  topicsNotStarted: number
  strengthAreas: string[] // Topic names
  weaknessAreas: string[] // Topic names
}

export interface BloomLevelBreakdown {
  bloomLevel: number
  bloomLevelName: string
  attempts: number
  correct: number
  accuracy: number
  masteryScore: number
  topicsAtLevel: number
  topicsCompleted: number
  isCurrentLevel: boolean
  readyToAdvance: boolean
}

export interface LearningVelocity {
  questionsPerDay: number
  questionsPerWeek: number
  averageSessionDuration: number // Minutes
  sessionsPerWeek: number
  trend: 'accelerating' | 'stable' | 'decelerating'
  projectedCompletion?: Date // When user might complete all topics
}

export interface PerformanceTrend {
  period: 'day' | 'week' | 'month'
  dataPoints: {
    date: string
    attempts: number
    correct: number
    accuracy: number
    masteryScore: number
  }[]
  overallTrend: 'improving' | 'stable' | 'declining'
  changeRate: number // Average change per period
}

export interface QuestionQualityMetrics {
  totalQuestions: number
  questionsBySource: {
    manual: number
    ai_generated_graphrag: number
    ai_generated_realtime: number
  }
  questionsByFormat: Record<string, number>
  questionsByBloomLevel: Record<number, number>
  averageAnswerTime: number // Seconds
  mostDifficultQuestions: {
    questionId: string
    questionText: string
    accuracy: number
    attempts: number
  }[]
  easiestQuestions: {
    questionId: string
    questionText: string
    accuracy: number
    attempts: number
  }[]
}

export interface CostTracking {
  totalCost: number // USD
  costPerQuestion: number // USD
  questionsByModel: Record<string, {
    count: number
    totalCost: number
    avgCost: number
  }>
  totalTokensUsed: number
  avgTokensPerQuestion: number
  generationTimeMs: number
  costByDomain: Record<string, number>
}

export interface ProgressMilestones {
  milestones: {
    name: string
    description: string
    achieved: boolean
    achievedAt?: Date
    progress: number // 0-1
    requirement: string
  }[]
}

export interface LearningInsights {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  nextSteps: string[]
  estimatedTimeToCompletion: string
  confidenceTrend: 'improving' | 'stable' | 'declining'
  motivationalMessage: string
}

export interface AnalyticsSummary {
  userStats: UserStats
  domainPerformance: DomainPerformance[]
  bloomLevelBreakdown: BloomLevelBreakdown[]
  learningVelocity: LearningVelocity
  performanceTrend: PerformanceTrend
  questionQuality: QuestionQualityMetrics
  costTracking?: CostTracking // Only for admins
  milestones: ProgressMilestones
  insights: LearningInsights
}

export interface LeaderboardEntry {
  userId: string
  username: string
  rank: number
  totalPoints: number
  masteryScore: number
  questionsAnswered: number
  currentStreak: number
  badges: string[]
}
