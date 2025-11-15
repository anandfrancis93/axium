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
import { Loader2 } from 'lucide-react'

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

  // Session storage key
  const STORAGE_KEY = 'axium_quiz_state'

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (currentQuestion) {
      const stateToSave = {
        currentQuestion,
        currentStep,
        userAnswer,
        confidence,
        recognitionMethod,
        startTime: startTime.toISOString(),
        answerResult,
        questionCount,
        correctCount
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    }
  }, [currentQuestion, currentStep, userAnswer, confidence, recognitionMethod, answerResult, questionCount, correctCount])

  // Load state from sessionStorage or fetch new question on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem(STORAGE_KEY)

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setCurrentQuestion(parsed.currentQuestion)
        setCurrentStep(parsed.currentStep)
        setUserAnswer(parsed.userAnswer || '')
        setConfidence(parsed.confidence)
        setRecognitionMethod(parsed.recognitionMethod)
        setStartTime(new Date(parsed.startTime))
        setAnswerResult(parsed.answerResult)
        setQuestionCount(parsed.questionCount || 0)
        setCorrectCount(parsed.correctCount || 0)
        setLoading(false)
      } catch (error) {
        console.error('Error restoring quiz state:', error)
        loadNextQuestion()
      }
    } else {
      loadNextQuestion()
    }
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

    // Move to recognition step (don't submit yet)
    setCurrentStep('recognition')
  }

  async function handleRecognitionSelect(method: RecognitionMethod) {
    if (!currentQuestion || !confidence) return

    setRecognitionMethod(method)

    try {
      setSubmitting(true)

      const timeTaken = Math.round((new Date().getTime() - startTime.getTime()) / 1000)

      console.log('Submitting answer:', {
        questionId: currentQuestion.id,
        topicId: currentQuestion.topic_id,
        confidence,
        recognitionMethod: method,
        timeTaken
      })

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          question: currentQuestion,
          answer: userAnswer,
          confidence,
          recognitionMethod: method, // Now we have the actual recognition method!
          timeTaken,
          topicId: currentQuestion.topic_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Submit API error:', data)
        throw new Error(data.details || data.error || 'Failed to submit answer')
      }

      console.log('Submit response:', data)
      setAnswerResult(data.result)

      // Update counts
      setQuestionCount(prev => prev + 1)
      if (data.result.isCorrect) {
        setCorrectCount(prev => prev + 1)
      }

      setCurrentStep('results')
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleNextQuestion() {
    // Clear saved state before loading next question
    sessionStorage.removeItem(STORAGE_KEY)
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
              <h1 className="text-2xl font-bold text-gray-200">Quiz</h1>
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

        {/* Step 1: Confidence Selection */}
        {currentStep === 'confidence' && (
          <>
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

            {/* Confidence Buttons */}
          <div className="neuro-card p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">How confident are you?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleConfidenceSelect(1)}
                className="neuro-btn text-red-400 p-6 text-center"
              >
                <div className="text-2xl font-bold mb-2">Low</div>
                <div className="text-sm text-gray-400">Not very confident</div>
              </button>
              <button
                onClick={() => handleConfidenceSelect(2)}
                className="neuro-btn text-yellow-400 p-6 text-center"
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
              Tip: Being honest about your confidence helps the system personalize your learning
            </p>
          </div>
          </>
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
        {currentStep === 'recognition' && (
          <>
            {/* Recognition Method Selection */}
            <div className="neuro-card p-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">How did you arrive at your answer?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRecognitionSelect('memory')}
                  disabled={submitting}
                  className="neuro-btn text-green-400 p-6 text-left disabled:opacity-50"
                >
                  <div className="text-lg font-bold mb-1">Recalled from Memory</div>
                  <div className="text-sm text-gray-400">I remembered this from studying</div>
                </button>
                <button
                  onClick={() => handleRecognitionSelect('recognition')}
                  disabled={submitting}
                  className="neuro-btn text-blue-400 p-6 text-left disabled:opacity-50"
                >
                  <div className="text-lg font-bold mb-1">Recognized from Options</div>
                  <div className="text-sm text-gray-400">I recognized the correct answer when I saw it</div>
                </button>
                <button
                  onClick={() => handleRecognitionSelect('educated_guess')}
                  disabled={submitting}
                  className="neuro-btn text-yellow-400 p-6 text-left disabled:opacity-50"
                >
                  <div className="text-lg font-bold mb-1">Made an Educated Guess</div>
                  <div className="text-sm text-gray-400">I used logic/reasoning to narrow it down</div>
                </button>
                <button
                  onClick={() => handleRecognitionSelect('random_guess')}
                  disabled={submitting}
                  className="neuro-btn text-red-400 p-6 text-left disabled:opacity-50"
                >
                  <div className="text-lg font-bold mb-1">Made a Random Guess</div>
                  <div className="text-sm text-gray-400">I had no idea and guessed randomly</div>
                </button>
              </div>
              {submitting && (
                <div className="mt-4 text-center">
                  <Loader2 className="animate-spin text-blue-400 mx-auto" size={24} />
                  <p className="text-gray-400 text-sm mt-2">Submitting your answer...</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 4: Results with all sections */}
        {currentStep === 'results' && answerResult && recognitionMethod && currentQuestion && (
          <>
            {/* Section 1: Question and Options with Results */}
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
              <h2 className="text-xl font-semibold text-gray-200 mb-6">
                {currentQuestion.question_text}
              </h2>

              {/* Answer Options with Result */}
              {(currentQuestion.question_format === 'mcq_single' || currentQuestion.question_format === 'mcq_multi') && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isUserAnswer = Array.isArray(userAnswer)
                      ? userAnswer.includes(option)
                      : userAnswer === option

                    // Handle different correct answer formats (with/without letter prefix)
                    const normalizeAnswer = (ans: string) => {
                      return ans.replace(/^[A-Z]\.\s*/, '').trim()
                    }

                    const normalizedOption = normalizeAnswer(option)
                    const isCorrectAnswer = Array.isArray(answerResult.correctAnswer)
                      ? answerResult.correctAnswer.some((ca: string) =>
                          ca === option || normalizeAnswer(ca) === normalizedOption
                        )
                      : answerResult.correctAnswer === option ||
                        normalizeAnswer(String(answerResult.correctAnswer)) === normalizedOption

                    return (
                      <div
                        key={idx}
                        className={`transition-all ${
                          isUserAnswer
                            ? 'neuro-raised'
                            : 'neuro-inset'
                        }`}
                      >
                        <div className="flex-1">
                          <div className={`${
                            isUserAnswer || isCorrectAnswer ? 'font-semibold' : ''
                          } ${
                            isCorrectAnswer ? 'text-green-400' :
                            isUserAnswer && !isCorrectAnswer ? 'text-red-400' :
                            'text-gray-300'
                          }`}>
                            {option}
                          </div>
                          {isUserAnswer && (
                            <div className="text-xs text-gray-500 mt-1">Your answer</div>
                          )}
                          {!isUserAnswer && isCorrectAnswer && (
                            <div className="text-xs text-gray-500 mt-1">Correct answer</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Answer Explanation */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">
                Answer Explanation
              </h3>

              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed">{answerResult.explanation}</p>
              </div>
            </div>

            {/* Section 3: Why This Question? */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">
                Why This Question?
              </h3>

              <div className="space-y-4">
                {/* Selection Method */}
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="text-sm text-white mb-2">Selection Method</div>
                  <div className="font-semibold text-blue-400">
                    {(() => {
                      const reason = (currentQuestion as any).selection_reason || ''

                      if ((currentQuestion as any).selection_method === 'spaced_repetition') {
                        return 'Spaced Repetition'
                      } else {
                        // RL-Driven: Extract phase name from selection_reason
                        const colonIndex = reason.indexOf(':')
                        if (colonIndex > 0) {
                          const phaseName = reason.substring(0, colonIndex).trim()
                          // Capitalize first letter of each word
                          const capitalizedPhase = phaseName.split(' ').map((word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')
                          return `RL - ${capitalizedPhase}`
                        }
                        return 'RL-Driven'
                      }
                    })()}
                  </div>
                  <div className="text-sm text-white mt-2">
                    {(() => {
                      const reason = (currentQuestion as any).selection_reason || ''

                      if ((currentQuestion as any).selection_method === 'spaced_repetition') {
                        return 'Reviewing topics based on optimal timing for memory retention'
                      } else {
                        // Extract explanation from selection_reason (text after colon)
                        const colonIndex = reason.indexOf(':')
                        if (colonIndex > 0) {
                          return reason.substring(colonIndex + 1).trim()
                        }
                        return 'AI-driven topic selection based on your learning progress'
                      }
                    })()}
                  </div>
                </div>

                {/* Priority Score - Only show when > 0% */}
                {(currentQuestion as any).selection_priority !== undefined && ((currentQuestion as any).selection_priority || 0) > 0 && (
                  <div className="p-4 neuro-inset rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Priority Score</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="neuro-inset rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                            style={{ width: `${((currentQuestion as any).selection_priority || 0) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {((currentQuestion as any).selection_priority * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {(() => {
                        const priority = ((currentQuestion as any).selection_priority || 0) * 100
                        if (priority <= 25) return "Optional practice - you're doing well here"
                        if (priority <= 50) return "Recommended practice - building stronger foundations"
                        if (priority <= 75) return "Important practice - needs attention"
                        return "Urgent practice - significant gap detected"
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Topic Details */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">
                Topic Details
              </h3>

              {/* Hierarchical Tree */}
              {currentQuestion.hierarchy && (
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="space-y-3">
                    {/* Subject Level */}
                    {currentQuestion.hierarchy.subject && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="neuro-raised w-8 h-8 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-blue-400 font-bold">S</span>
                          </div>
                          <div className="w-px h-6 bg-gray-700"></div>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="text-xs text-gray-500">Subject</div>
                          <div className="font-semibold text-gray-300">{currentQuestion.hierarchy.subject}</div>
                        </div>
                      </div>
                    )}

                    {/* Chapter Level */}
                    {currentQuestion.hierarchy.chapter && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="neuro-raised w-8 h-8 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-cyan-400 font-bold">C</span>
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="text-xs text-gray-500">Chapter</div>
                          <div className="font-semibold text-gray-300">{currentQuestion.hierarchy.chapter}</div>
                        </div>
                      </div>
                    )}

                    {/* Topic Level */}
                    <div className="pt-1">
                      <div className="font-semibold text-green-400">{currentQuestion.hierarchy.topic}</div>
                      {currentQuestion.hierarchy.description && (
                        <div className="text-xs text-gray-600 mt-1">{currentQuestion.hierarchy.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Your Performance */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">
                Your Performance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calibration Score */}
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="text-sm text-white mb-2">Calibration Score</div>
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${
                      answerResult.calibrationScore > 0 ? 'text-green-400' :
                      answerResult.calibrationScore < 0 ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {answerResult.calibrationScore > 0 ? '+' : ''}{answerResult.calibrationScore.toFixed(2)}
                    </div>
                    <div className="flex-1">
                      <div className="neuro-inset rounded-full h-2 overflow-hidden relative bg-gray-800/30">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600" />
                        <div
                          className={`absolute top-0 bottom-0 ${
                            answerResult.calibrationScore > 0 ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{
                            left: answerResult.calibrationScore > 0 ? '50%' : `${50 + (answerResult.calibrationScore / 1.5 * 50)}%`,
                            width: `${Math.abs(answerResult.calibrationScore) / 1.5 * 50}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>-1.5</span>
                        <span>0</span>
                        <span>+1.5</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white mt-2">
                    {(() => {
                      // Get calibration feedback based on all 24 scenarios
                      const isCorrect = answerResult.isCorrect
                      const conf = confidence
                      const method = recognitionMethod

                      // CORRECT ANSWERS
                      if (isCorrect) {
                        if (conf === 3) {
                          if (method === 'memory') return 'You were highly confident, used memory recall, and got it right. Perfect calibration!'
                          if (method === 'recognition') return 'You were highly confident, recognized the answer from options, and got it right. Great calibration!'
                          if (method === 'educated_guess') return 'You were highly confident with an educated guess and got it right. Good result, but consider being more cautious with guesses.'
                          if (method === 'random_guess') return 'You were highly confident with a random guess and got lucky. This shows poor calibration - random guesses shouldn\'t have high confidence.'
                        }
                        if (conf === 2) {
                          if (method === 'memory') return 'You had medium confidence, used memory recall, and got it right. You could trust your memory more!'
                          if (method === 'recognition') return 'You had medium confidence, recognized the answer, and got it right. Well-calibrated response!'
                          if (method === 'educated_guess') return 'You had medium confidence with an educated guess and got it right. Good reasoning and appropriate confidence level!'
                          if (method === 'random_guess') return 'You had medium confidence with a random guess and got lucky. Random guesses should have lower confidence.'
                        }
                        if (conf === 1) {
                          if (method === 'memory') return 'You had low confidence, used memory recall, and got it right. Trust your memory more - you knew it!'
                          if (method === 'recognition') return 'You had low confidence, recognized the answer, and got it right. Your intuition was better than you thought!'
                          if (method === 'educated_guess') return 'You had low confidence with an educated guess and got it right. Good calibration - appropriate uncertainty that worked out!'
                          if (method === 'random_guess') return 'You had low confidence with a random guess and got lucky. Excellent calibration - you knew it was a guess!'
                        }
                      }

                      // INCORRECT ANSWERS
                      if (!isCorrect) {
                        if (conf === 3) {
                          if (method === 'memory') return 'You were highly confident, thought you recalled from memory, but got it wrong. This is false memory - the worst calibration scenario.'
                          if (method === 'recognition') return 'You were highly confident, thought you recognized the answer, but got it wrong. Misrecognition with high confidence shows poor calibration.'
                          if (method === 'educated_guess') return 'You were highly confident with an educated guess but got it wrong. Overconfidence in your reasoning led to poor calibration.'
                          if (method === 'random_guess') return 'You were highly confident with a random guess and got it wrong. Why high confidence on a random guess? This shows miscalibration.'
                        }
                        if (conf === 2) {
                          if (method === 'memory') return 'You had medium confidence, thought you recalled from memory, but got it wrong. False memory with moderate confidence.'
                          if (method === 'recognition') return 'You had medium confidence, thought you recognized the answer, but got it wrong. Misrecognition shows miscalibration.'
                          if (method === 'educated_guess') return 'You had medium confidence with an educated guess and got it wrong. Your reasoning didn\'t work out this time.'
                          if (method === 'random_guess') return 'You had medium confidence with a random guess and got it wrong. Random guesses should have lower confidence.'
                        }
                        if (conf === 1) {
                          if (method === 'memory') return 'You had low confidence, thought you recalled from memory, but got it wrong. Good calibration - you sensed the uncertainty!'
                          if (method === 'recognition') return 'You had low confidence, thought you recognized the answer, but got it wrong. Good calibration - your doubt was warranted!'
                          if (method === 'educated_guess') return 'You had low confidence with an educated guess and got it wrong. Good calibration - you knew your logic was uncertain!'
                          if (method === 'random_guess') return 'You had low confidence with a random guess and got it wrong. Excellent calibration - you knew it was just a guess!'
                        }
                      }

                      return 'Calibration feedback unavailable'
                    })()}
                  </div>
                </div>

                {/* Your Choices Summary */}
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="text-sm text-white mb-3">Your Choices</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Confidence:</span>
                      <span className={`font-semibold ${
                        confidence === 3 ? 'text-green-400' :
                        confidence === 2 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {confidence === 3 ? 'High' : confidence === 2 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Method:</span>
                      <span className={`font-semibold ${
                        recognitionMethod === 'memory' ? 'text-green-400' :
                        recognitionMethod === 'recognition' ? 'text-blue-400' :
                        recognitionMethod === 'educated_guess' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {recognitionMethod === 'memory' && 'Memory'}
                        {recognitionMethod === 'recognition' && 'Recognition'}
                        {recognitionMethod === 'educated_guess' && 'Educated Guess'}
                        {recognitionMethod === 'random_guess' && 'Random Guess'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Result:</span>
                      <span className={`font-semibold ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {answerResult.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/subjects')}
                className="neuro-btn text-gray-300 flex-1 py-4 text-lg font-semibold"
              >
                Done
              </button>
              <button
                onClick={handleNextQuestion}
                className="neuro-btn text-blue-400 flex-1 py-4 text-lg font-semibold"
              >
                Next Question
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
