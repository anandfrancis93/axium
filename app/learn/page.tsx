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

function LearnPageContent() {
  const router = useRouter()

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [userAnswer, setUserAnswer] = useState<string | string[]>('')
  const [confidence, setConfidence] = useState<number>(2)
  const [recognitionMethod, setRecognitionMethod] = useState<RecognitionMethod>('recognition')
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [showFeedback, setShowFeedback] = useState(false)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  // Load first question on mount
  useEffect(() => {
    loadNextQuestion()
  }, [])

  async function loadNextQuestion() {
    try {
      setLoading(true)

      const response = await fetch('/api/quiz/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load question')
      }

      const data = await response.json()
      setCurrentQuestion(data.question)
      setStartTime(new Date())
      setShowFeedback(false)
      setAnswerResult(null)
      setUserAnswer('')
      setConfidence(2)
      setRecognitionMethod('recognition')
    } catch (error) {
      console.error('Error loading question:', error)
      alert('Failed to load question. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!currentQuestion) return

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
          question: currentQuestion,  // Include full question for on-the-fly questions
          answer: userAnswer,
          confidence,
          recognitionMethod,
          timeTaken,
          topicId: currentQuestion.topic_id  // Include topicId for progress tracking
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }

      const data = await response.json()

      // Update counts
      setQuestionCount(prev => prev + 1)
      if (data.result.isCorrect) {
        setCorrectCount(prev => prev + 1)
      }

      // Show feedback
      setAnswerResult(data.result)
      setShowFeedback(true)
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen neuro-container flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load quiz</p>
          <button
            onClick={() => router.push('/dashboard')}
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

        {!showFeedback ? (
          <>
            {/* Question */}
            <QuestionCard
              question={currentQuestion}
              onAnswerChange={setUserAnswer}
              disabled={submitting}
            />

            {/* Confidence */}
            <ConfidenceSlider
              value={confidence}
              onChange={setConfidence}
              disabled={submitting}
            />

            {/* Recognition Method */}
            <RecognitionMethodSelector
              value={recognitionMethod}
              onChange={setRecognitionMethod}
              questionFormat={currentQuestion.question_format}
              disabled={submitting}
            />

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !userAnswer}
              className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Submitting...
                </span>
              ) : (
                'Submit Answer'
              )}
            </button>
          </>
        ) : (
          answerResult && currentQuestion && (
            <AnswerFeedback
              result={answerResult}
              userAnswer={userAnswer}
              confidence={confidence}
              recognitionMethod={recognitionMethod}
              onContinue={handleNextQuestion}
              topicName={(currentQuestion as any).topic_name}
              bloomLevel={(currentQuestion as any).bloom_level}
              selectionReason={(currentQuestion as any).selection_reason}
            />
          )
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
