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

export type RecognitionMethod =
  | 'memory'          // Recalled from memory
  | 'recognition'     // Recognized from options
  | 'educated_guess'  // Made an educated guess
  | 'random_guess'    // Made a random guess

export interface QuizQuestion {
  id: string
  topic_id: string
  topic_name?: string
  bloom_level: number
  question_format: QuestionFormat
  question_text: string
  options?: string[]  // For MCQ
  correct_answer: string | string[]  // Single or multiple correct answers
  explanation: string
  difficulty_score?: number
  selection_reason?: string  // Why this question was selected (RL/SR)
  selection_priority?: number  // Priority score for selection
  selection_method?: 'rl' | 'spaced_repetition'  // Selection method used
  hierarchy?: {
    subject: string | null
    chapter: string | null
    topic: string
    description: string | null
  }
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
  question?: QuizQuestion  // Include full question for on-the-fly generated questions
  answer: string | string[]
  confidence: number  // 1-3 (Low, Medium, High)
  recognitionMethod: RecognitionMethod  // How the user arrived at their answer
  timeTaken: number  // seconds
  topicId: string  // Needed for progress tracking
}

export interface AnswerResult {
  isCorrect: boolean  // TRACK 2: Correctness (format-dependent)
  correctAnswer: string | string[]
  explanation: string
  calibrationScore: number  // TRACK 1: Calibration score (-1.5 to +1.5, format-independent)
  reward: number  // Legacy: Same as calibrationScore for backward compatibility
  calibrationBreakdown?: {  // Reward breakdown for transparency (future enhancement)
    correctness: number
    confidenceCalibration: number
    recognitionAlignment: number
  }
  nextQuestion?: QuizQuestion
  sessionComplete?: boolean
  sessionStats?: {
    score: number
    totalQuestions: number
    averageConfidence: number
    averageTime: number
  }
}
