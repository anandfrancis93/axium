'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ConfidenceLevel = 'low' | 'medium' | 'high'
type RecognitionMethod = 'memory' | 'recognition' | 'educated_guess' | 'random'

type Step = 'confidence' | 'options' | 'recognition' | 'feedback'

export default function LearnPage() {
  const router = useRouter()
  const params = useParams()
  const chapterId = params.chapterId as string

  const [session, setSession] = useState<any>(null)
  const [question, setQuestion] = useState<any>(null)
  const [questionMetadata, setQuestionMetadata] = useState<any>(null)
  const [armSelected, setArmSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 4-step flow state
  const [currentStep, setCurrentStep] = useState<Step>('confidence')
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [recognitionMethod, setRecognitionMethod] = useState<RecognitionMethod | null>(null)
  const [feedback, setFeedback] = useState<any>(null)

  useEffect(() => {
    startSession()
  }, [])

  const startSession = async () => {
    try {
      setLoading(true)
      setError('')

      // Start new session
      const response = await fetch('/api/rl/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterId,
          num_questions: 10
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start session')
      }

      setSession(data)

      // Get first question
      await getNextQuestion(data.session_id)

    } catch (err: any) {
      console.error('Error starting session:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const getNextQuestion = async (sessionId: string) => {
    try {
      const response = await fetch('/api/rl/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get question')
      }

      if (data.session_complete) {
        router.push(`/session-complete/${sessionId}`)
        return
      }

      setQuestion(data.question)
      setQuestionMetadata(data.question_metadata) // Store for submission
      setArmSelected(data.arm_selected)

      // Reset state for new question
      setCurrentStep('confidence')
      setConfidence(null)
      setSelectedAnswer(null)
      setRecognitionMethod(null)
      setFeedback(null)
      setLoading(false)

    } catch (err: any) {
      console.error('Error getting question:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleConfidenceSubmit = () => {
    if (!confidence) return
    setCurrentStep('options')
  }

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return
    setCurrentStep('recognition')
  }

  const handleRecognitionSubmit = async () => {
    if (!recognitionMethod || !session || !question) return

    try {
      setLoading(true)

      const response = await fetch('/api/rl/submit-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          question_id: question.id,
          user_answer: selectedAnswer,
          confidence,
          recognition_method: recognitionMethod,
          arm_selected: armSelected,
          question_metadata: questionMetadata // Include for ephemeral questions
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response')
      }

      setFeedback(data)
      setCurrentStep('feedback')
      setLoading(false)

    } catch (err: any) {
      console.error('Error submitting response:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleNextQuestion = () => {
    if (!session) return
    setLoading(true)
    getNextQuestion(session.session_id)
  }

  if (loading && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="neuro-card max-w-md text-center">
          <div className="text-blue-400 text-lg mb-2">Loading...</div>
          <div className="text-gray-500 text-sm">Preparing your adaptive learning session</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="neuro-card max-w-md">
          <div className="text-red-400 text-lg mb-4">Error</div>
          <div className="text-gray-400 mb-6">{error}</div>
          <button onClick={() => router.push('/home')} className="neuro-btn">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="neuro-card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500 mb-1">Question {feedback?.session_progress?.questions_answered || 0 + 1} of {session?.questions_remaining || 10}</div>
              <div className="text-2xl font-bold text-gray-200">
                Score: {feedback?.session_progress?.current_score || 0}/{feedback?.session_progress?.questions_answered || 0}
              </div>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="neuro-btn text-sm"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Main Question Card */}
        <div className="neuro-card">
          {/* Question Text */}
          <div className="mb-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="neuro-inset w-10 h-10 rounded-full flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                Q
              </div>
              <div className="flex-1">
                <p className="text-xl text-gray-200 leading-relaxed">
                  {question.question_text}
                </p>
              </div>
            </div>

            {armSelected && (
              <div className="flex gap-2 text-xs">
                <span className="neuro-inset px-3 py-1 rounded-full text-purple-400">
                  Bloom Level {armSelected.bloom_level}
                </span>
                <span className="neuro-inset px-3 py-1 rounded-full text-blue-400">
                  {armSelected.topic}
                </span>
              </div>
            )}
          </div>

          {/* STEP 1: Confidence Selection */}
          {currentStep === 'confidence' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                How confident are you about this answer?
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {(['low', 'medium', 'high'] as ConfidenceLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={`neuro-raised p-6 text-center transition-all ${
                      confidence === level ? 'ring-2 ring-blue-400' : ''
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {level === 'low' && '😕'}
                      {level === 'medium' && '🤔'}
                      {level === 'high' && '😊'}
                    </div>
                    <div className="font-medium text-gray-200 capitalize">{level}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleConfidenceSubmit}
                disabled={!confidence}
                className="neuro-btn-primary w-full py-4 text-lg disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2: Answer Options */}
          {currentStep === 'options' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Select your answer:
              </h3>
              <div className="space-y-3 mb-6">
                {Object.entries(question.options as { [key: string]: string }).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAnswer(key)}
                    className={`neuro-raised p-4 w-full text-left transition-all ${
                      selectedAnswer === key ? 'ring-2 ring-blue-400' : ''
                    }`}
                  >
                    <span className="font-bold text-blue-400 mr-3">{key}.</span>
                    <span className="text-gray-200">{value}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer}
                className="neuro-btn-primary w-full py-4 text-lg disabled:opacity-50"
              >
                Submit Answer →
              </button>
            </div>
          )}

          {/* STEP 3: Recognition Method */}
          {currentStep === 'recognition' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                How did you arrive at your answer?
              </h3>
              <div className="space-y-3 mb-6">
                {[
                  { value: 'memory', label: 'I knew the answer from memory before seeing the options', emoji: '🧠' },
                  { value: 'recognition', label: "I wasn't sure, but recognized the right answer in the options", emoji: '👀' },
                  { value: 'educated_guess', label: 'I narrowed it down and made an educated guess', emoji: '🎯' },
                  { value: 'random', label: 'I guessed randomly', emoji: '🎲' }
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setRecognitionMethod(method.value as RecognitionMethod)}
                    className={`neuro-raised p-4 w-full text-left transition-all ${
                      recognitionMethod === method.value ? 'ring-2 ring-purple-400' : ''
                    }`}
                  >
                    <span className="text-2xl mr-3">{method.emoji}</span>
                    <span className="text-gray-200">{method.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleRecognitionSubmit}
                disabled={!recognitionMethod || loading}
                className="neuro-btn-primary w-full py-4 text-lg disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Get Feedback →'}
              </button>
            </div>
          )}

          {/* STEP 4: Feedback */}
          {currentStep === 'feedback' && feedback && (
            <div>
              {/* Correctness */}
              <div className={`neuro-inset p-6 rounded-lg mb-6 ${
                feedback.is_correct ? 'ring-2 ring-green-400' : 'ring-2 ring-red-400'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">
                    {feedback.is_correct ? '✅' : '❌'}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-200">
                      {feedback.is_correct ? 'Correct!' : 'Incorrect'}
                    </div>
                    <div className="text-sm text-gray-500">
                      The correct answer was: <span className="text-green-400 font-bold">{feedback.correct_answer}</span>
                    </div>
                  </div>
                </div>

                <div className="neuro-raised p-4 mt-4">
                  <div className="text-sm text-gray-500 mb-1">Explanation:</div>
                  <div className="text-gray-200">{feedback.explanation}</div>
                </div>
              </div>

              {/* Mastery Updates */}
              <div className="neuro-inset p-4 rounded-lg mb-6">
                <div className="text-sm font-medium text-gray-400 mb-3">Mastery Changes:</div>
                <div className="space-y-2">
                  {feedback.mastery_updates?.map((update: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-gray-300">{update.topic}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{update.old_mastery}%</span>
                        <span className={update.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {update.change >= 0 ? '+' : ''}{update.change}%
                        </span>
                        <span className="text-blue-400 font-medium">{update.new_mastery}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward Breakdown */}
              <div className="neuro-inset p-4 rounded-lg mb-6">
                <div className="text-sm font-medium text-gray-400 mb-3">Reward Components:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Learning Gain: <span className="text-blue-400">{feedback.reward_components?.learningGain?.toFixed(1)}</span></div>
                  <div>Calibration: <span className="text-purple-400">{feedback.reward_components?.calibration?.toFixed(1)}</span></div>
                  <div>Recognition: <span className="text-green-400">{feedback.reward_components?.recognition?.toFixed(1)}</span></div>
                  <div>Spacing: <span className="text-yellow-400">{feedback.reward_components?.spacing?.toFixed(1)}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="font-medium">Total Reward: <span className="text-blue-400">{feedback.reward_components?.total?.toFixed(1)}</span></div>
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                className="neuro-btn-primary w-full py-4 text-lg"
              >
                Next Question →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
