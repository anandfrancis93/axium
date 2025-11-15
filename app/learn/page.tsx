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
import { RecognitionMethodSelector, RecognitionMethod } from '@/components/quiz/RecognitionMethodSelector'
import { AnswerFeedback } from '@/components/quiz/AnswerFeedback'
import { QuizSession, QuizQuestion, AnswerResult } from '@/lib/types/quiz'
import { Loader2, Trophy, Clock, Target } from 'lucide-react'

function LearnPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicId = searchParams.get('topicId')
  const bloomLevel = Number(searchParams.get('bloomLevel')) || 1

  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [userAnswer, setUserAnswer] = useState<string | string[]>('')
  const [confidence, setConfidence] = useState<number>(2)
  const [recognitionMethod, setRecognitionMethod] = useState<RecognitionMethod>('recognition')
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [showFeedback, setShowFeedback] = useState(false)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Initialize session
  useEffect(() => {
    if (!topicId) {
      // No topic selected, redirect to topic selection
      router.push('/learn/select')
      return
    }

    startSession()
  }, [topicId, bloomLevel])

  async function startSession() {
    try {
      setLoading(true)

      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          bloomLevel,
          questionCount: 10
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start session')
      }

      const data = await response.json()
      setSession(data.session)
      setCurrentQuestion(data.firstQuestion)
      setStartTime(new Date())
    } catch (error) {
      console.error('Error starting session:', error)
      alert('Failed to start quiz session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!currentQuestion || !session) return

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
          sessionId: session.id,
          questionId: currentQuestion.id,
          question: currentQuestion,  // Include full question for on-the-fly questions
          answer: userAnswer,
          confidence,
          recognitionMethod,
          timeTaken,
          topicId: session.topicId  // Include topicId for progress tracking
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }

      const data = await response.json()

      // Update session score
      const newScore = session.score + (data.result.isCorrect ? 1 : 0)
      setSession({ ...session, score: newScore })

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
    if (!session) return

    const nextIndex = session.currentQuestionIndex + 1

    if (nextIndex >= session.questions.length) {
      // Session complete
      router.push(`/learn/results?sessionId=${session.id}`)
      return
    }

    // Load next question
    setSession({ ...session, currentQuestionIndex: nextIndex })
    setCurrentQuestion(session.questions[nextIndex])
    setUserAnswer('')
    setConfidence(2)
    setRecognitionMethod('recognition')
    setStartTime(new Date())
    setShowFeedback(false)
    setAnswerResult(null)
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

  if (!session || !currentQuestion) {
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

  const progress = ((session.currentQuestionIndex + 1) / session.totalQuestions) * 100

  return (
    <div className="min-h-screen neuro-container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="neuro-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-200">{session.topicName}</h1>
              <p className="text-sm text-gray-500">Bloom Level {session.bloomLevel}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{session.score}</div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-300">
                  {session.currentQuestionIndex + 1}/{session.totalQuestions}
                </div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="neuro-inset rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
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
          answerResult && (
            <AnswerFeedback
              result={answerResult}
              userAnswer={userAnswer}
              confidence={confidence}
              recognitionMethod={recognitionMethod}
              onContinue={handleNextQuestion}
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
