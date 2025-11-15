/**
 * Quiz Session Types
 *
 * Type definitions for the learning session (quiz) interface
 */

export type QuestionFormat =
  | 'true_false'
  | 'mcq_single'
  | 'mcq_multi'
  | 'fill_blank'
  | 'matching'
  | 'open_ended'

export interface QuizQuestion {
  id: string
  topic_id: string
  bloom_level: number
  question_format: QuestionFormat
  question_text: string
  options?: string[]  // For MCQ
  correct_answer: string | string[]  // Single or multiple correct answers
  explanation: string
  difficulty_score?: number
  metadata?: {
    generated_at?: string
    source?: string
    context_used?: boolean
  }
}

export interface QuizSessionQuestion extends QuizQuestion {
  // Additional runtime state for active session
  startedAt: Date
  answeredAt?: Date
  userAnswer?: string | string[]
  userConfidence?: number  // 1-5
  isCorrect?: boolean
  timeTaken?: number  // seconds
}

export interface QuizSession {
  id: string
  userId: string
  topicId: string
  topicName: string
  bloomLevel: number
  startedAt: Date
  questions: QuizSessionQuestion[]
  currentQuestionIndex: number
  score: number
  totalQuestions: number
  isComplete: boolean
}

export interface QuizStartParams {
  topicId?: string
  bloomLevel?: number
  questionCount?: number
  useRecommendations?: boolean  // Use RL engine for topic selection
}

export interface AnswerSubmission {
  sessionId: string
  questionId: string
  answer: string | string[]
  confidence: number  // 1-5
  timeTaken: number  // seconds
}

export interface AnswerResult {
  isCorrect: boolean
  correctAnswer: string | string[]
  explanation: string
  reward: number  // RL reward
  nextQuestion?: QuizQuestion
  sessionComplete?: boolean
  sessionStats?: {
    score: number
    totalQuestions: number
    averageConfidence: number
    averageTime: number
  }
}
