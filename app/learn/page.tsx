/**
 * Learn Page - Quiz Interface
 *
 * Main quiz page where students answer questions
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { ConfidenceSlider } from '@/components/quiz/ConfidenceSlider'
import { RecognitionMethodSelector } from '@/components/quiz/RecognitionMethodSelector'
import { AnswerFeedback } from '@/components/quiz/AnswerFeedback'
import { QuizSession, QuizQuestion, AnswerResult, RecognitionMethod } from '@/lib/types/quiz'
import { Loader2, Trophy, Clock, Target } from 'lucide-react'

type QuizStep = 'confidence' | 'answer' | 'recognition' | 'results'

function LearnPageContent() {
  const router = useRouter()

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [currentStep, setCurrentStep] = useState<QuizStep>('confidence')
  const [userAnswer, setUserAnswer] = useState<string | string[]>('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [recognitionMethod, setRecognitionMethod] = useState<RecognitionMethod | null>(null)
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState<{ message: string; details?: string; action?: string } | null>(null)

  // Load first question on mount
  useEffect(() => {
    loadNextQuestion()
  }, [])

  async function loadNextQuestion() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/quiz/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError({
          message: errorData.error || 'Failed to load question',
          details: errorData.details,
          action: errorData.action
        })
        return
      }

      const data = await response.json()
      setCurrentQuestion(data.question)
      setStartTime(new Date())
      setCurrentStep('confidence')
      setAnswerResult(null)
      setUserAnswer('')
      setConfidence(null)
      setRecognitionMethod(null)
    } catch (error) {
      console.error('Error loading question:', error)
      setError({
        message: 'Failed to load question',
        details: error instanceof Error ? error.message : 'Unknown error',
        action: 'Please try again or contact support.'
      })
    } finally {
      setLoading(false)
    }
  }

  function handleConfidenceSelect(level: number) {
    setConfidence(level)
    setCurrentStep('answer')
  }

  async function handleAnswerSubmit() {
    if (!currentQuestion || !confidence) return

    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      alert('Please provide an answer before submitting.')
      return
    }

    try {
      setSubmitting(true)

      const timeTaken = Math.round((new Date().getTime() - startTime.getTime()) / 1000)

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          question: currentQuestion,
          answer: userAnswer,
          confidence,
          recognitionMethod: 'pending', // Will be updated after recognition selection
          timeTaken,
          topicId: currentQuestion.topic_id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }

      const data = await response.json()
      setAnswerResult(data.result)
      setCurrentStep('recognition')
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRecognitionSelect(method: RecognitionMethod) {
    setRecognitionMethod(method)
    // Update counts
    setQuestionCount(prev => prev + 1)
    if (answerResult?.isCorrect) {
      setCorrectCount(prev => prev + 1)
    }
    setCurrentStep('results')
  }

  function handleNextQuestion() {
    // Load next RL-selected question
    loadNextQuestion()
  }

  if (loading) {
    return (
      <div className="min-h-screen neuro-container flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-400 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading your quiz...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen neuro-container flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto">
          <div className="neuro-card p-8 border-l-4 border-red-400">
            <div className="flex items-start gap-4">
              <div className="neuro-inset w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-red-400 mb-2">{error.message}</h2>
                {error.details && (
                  <p className="text-gray-400 mb-4">{error.details}</p>
                )}
                {error.action && (
                  <div className="neuro-inset p-4 rounded-lg mb-4 bg-blue-400/5">
                    <p className="text-sm text-blue-400">
                      <strong>Next steps:</strong> {error.action}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setError(null)
                      loadNextQuestion()
                    }}
                    className="neuro-btn text-blue-400"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/subjects')}
                    className="neuro-btn text-gray-300"
                  >
                    Return to Dashboard
                  </button>
                  {error.action?.includes('Admin') && (
                    <button
                      onClick={() => router.push('/admin/graphrag')}
                      className="neuro-btn text-green-400"
                    >
                      Go to Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen neuro-container flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No question loaded</p>
          <button
            onClick={() => router.push('/subjects')}
            className="neuro-btn text-blue-400"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen neuro-container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="neuro-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-200">RL-Driven Quiz</h1>
              <p className="text-sm text-gray-500">Topic selected by AI · Answer to reveal</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                <div className="text-xs text-gray-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-300">{questionCount}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Text */}
        <div className="neuro-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
              Bloom Level {currentQuestion.bloom_level}
            </span>
            <span className="text-xs font-medium text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
              {currentQuestion.question_format === 'mcq_single' ? 'Multiple Choice' :
               currentQuestion.question_format === 'mcq_multi' ? 'Multiple Select' :
               currentQuestion.question_format === 'true_false' ? 'True/False' :
               currentQuestion.question_format === 'fill_blank' ? 'Fill in the Blank' :
               currentQuestion.question_format === 'open_ended' ? 'Open Ended' : 'Question'}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-200">
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Step 1: Confidence Selection */}
        {currentStep === 'confidence' && (
          <div className="neuro-card p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">How confident are you?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleConfidenceSelect(1)}
                className="neuro-btn text-yellow-400 p-6 text-center"
              >
                <div className="text-2xl font-bold mb-2">Low</div>
                <div className="text-sm text-gray-400">Not very confident</div>
              </button>
              <button
                onClick={() => handleConfidenceSelect(2)}
                className="neuro-btn text-blue-400 p-6 text-center"
              >
                <div className="text-2xl font-bold mb-2">Medium</div>
                <div className="text-sm text-gray-400">Somewhat confident</div>
              </button>
              <button
                onClick={() => handleConfidenceSelect(3)}
                className="neuro-btn text-green-400 p-6 text-center"
              >
                <div className="text-2xl font-bold mb-2">High</div>
                <div className="text-sm text-gray-400">Very confident</div>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              💡 Tip: Being honest about your confidence helps the system personalize your learning
            </p>
          </div>
        )}

        {/* Step 2: Answer Selection */}
        {currentStep === 'answer' && (
          <>
            <QuestionCard
              question={currentQuestion}
              onAnswerChange={setUserAnswer}
              disabled={submitting}
            />
            <button
              onClick={handleAnswerSubmit}
              disabled={submitting || !userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)}
              className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Checking...
                </span>
              ) : (
                'Submit Answer'
              )}
            </button>
          </>
        )}

        {/* Step 3: Recognition Method Selection */}
        {currentStep === 'recognition' && answerResult && (
          <div className="neuro-card p-6">
            {/* Correct/Incorrect Indicator */}
            <div className={`p-4 rounded-lg mb-6 text-center ${answerResult.isCorrect ? 'bg-green-400/10 border border-green-400' : 'bg-red-400/10 border border-red-400'}`}>
              <div className={`text-3xl font-bold ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {answerResult.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-200 mb-4">How did you arrive at your answer?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleRecognitionSelect('memory')}
                className="neuro-btn text-purple-400 p-6 text-left"
              >
                <div className="text-lg font-bold mb-1">Recalled from Memory</div>
                <div className="text-sm text-gray-400">I remembered this from studying</div>
              </button>
              <button
                onClick={() => handleRecognitionSelect('recognition')}
                className="neuro-btn text-blue-400 p-6 text-left"
              >
                <div className="text-lg font-bold mb-1">Recognized from Options</div>
                <div className="text-sm text-gray-400">I recognized the correct answer when I saw it</div>
              </button>
              <button
                onClick={() => handleRecognitionSelect('educated_guess')}
                className="neuro-btn text-yellow-400 p-6 text-left"
              >
                <div className="text-lg font-bold mb-1">Made an Educated Guess</div>
                <div className="text-sm text-gray-400">I used logic/reasoning to narrow it down</div>
              </button>
              <button
                onClick={() => handleRecognitionSelect('random_guess')}
                className="neuro-btn text-red-400 p-6 text-left"
              >
                <div className="text-lg font-bold mb-1">Made a Random Guess</div>
                <div className="text-sm text-gray-400">I had no idea and guessed randomly</div>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              💡 Why we ask: This helps us understand your learning process and provide better recommendations
            </p>
          </div>
        )}

        {/* Step 4: Results with all sections */}
        {currentStep === 'results' && answerResult && recognitionMethod && currentQuestion && (
          <>
            {/* TODO: Implement results sections */}
            <div className="neuro-card p-6">
              <h3 className="text-lg font-semibold text-gray-200">Results coming next...</h3>
              <button
                onClick={handleNextQuestion}
                className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold mt-4"
              >
                Next Question →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen neuro-container flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-400 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading quiz...</p>
        </div>
      </div>
    }>
      <LearnPageContent />
    </Suspense>
  )
}
