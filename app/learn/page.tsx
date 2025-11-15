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
import { Loader2, Trophy, Clock, Target, BookOpen, TrendingUp } from 'lucide-react'

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
              💡 Tip: Being honest about your confidence helps the system personalize your learning
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
        {currentStep === 'recognition' && answerResult && (
          <>
            {/* Question with Result */}
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
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, idx) => {
                    const isUserAnswer = Array.isArray(userAnswer)
                      ? userAnswer.includes(option)
                      : userAnswer === option

                    // Handle different correct answer formats (with/without letter prefix)
                    const normalizeAnswer = (ans: string) => {
                      // Remove letter prefix like "A. ", "B. ", etc.
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
                        className={`p-4 rounded-lg border-2 ${
                          isUserAnswer && isCorrectAnswer
                            ? 'bg-green-400/10 border-green-400'
                            : isUserAnswer && !isCorrectAnswer
                            ? 'bg-red-400/10 border-red-400'
                            : isCorrectAnswer
                            ? 'bg-green-400/5 border-green-400/50'
                            : 'bg-gray-800/30 border-gray-700/30'
                        }`}
                      >
                        <div className="flex-1">
                          <div className={`${
                            isUserAnswer || isCorrectAnswer ? 'font-semibold' : ''
                          } ${
                            isCorrectAnswer ? 'text-green-400' :
                            isUserAnswer ? 'text-red-400' :
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

            {/* Recognition Method Selection */}
            <div className="neuro-card p-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">How did you arrive at your answer?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRecognitionSelect('memory')}
                  className="neuro-btn text-green-400 p-6 text-left"
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
          </>
        )}

        {/* Step 4: Results with all sections */}
        {currentStep === 'results' && answerResult && recognitionMethod && currentQuestion && (
          <>
            {/* Section 1: Explanation */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <BookOpen size={24} className="text-blue-400" />
                Answer Explanation
              </h3>

              {/* Explanation */}
              <div className="prose prose-invert max-w-none mb-6">
                <p className="text-gray-300 leading-relaxed">{answerResult.explanation}</p>
              </div>

              {/* Why Other Options Are Wrong (for MCQ) */}
              {(currentQuestion.question_format === 'mcq_single' || currentQuestion.question_format === 'mcq_multi') && currentQuestion.options && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Understanding All Options:</h4>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, idx) => {
                      // Handle different correct answer formats (with/without letter prefix)
                      const normalizeAnswer = (ans: string) => {
                        return ans.replace(/^[A-Z]\.\s*/, '').trim()
                      }

                      const normalizedOption = normalizeAnswer(option)
                      const isCorrect = Array.isArray(answerResult.correctAnswer)
                        ? answerResult.correctAnswer.some((ca: string) =>
                            ca === option || normalizeAnswer(ca) === normalizedOption
                          )
                        : answerResult.correctAnswer === option ||
                          normalizeAnswer(String(answerResult.correctAnswer)) === normalizedOption

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? 'bg-green-400/5 border-green-400/30'
                              : 'bg-gray-800/30 border-gray-700/30'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isCorrect ? (
                              <span className="text-green-400 mt-0.5">✓</span>
                            ) : (
                              <span className="text-gray-600 mt-0.5">✗</span>
                            )}
                            <div className="flex-1">
                              <div className={`font-medium ${isCorrect ? 'text-green-400' : 'text-gray-400'}`}>
                                {option}
                              </div>
                              {isCorrect && (
                                <div className="text-xs text-gray-500 mt-1">Correct answer</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Why This Question? */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Target size={24} className="text-purple-400" />
                Why This Question?
              </h3>

              <div className="space-y-4">
                {/* Selection Method */}
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Selection Method</div>
                  <div className="flex items-center gap-3">
                    {(currentQuestion as any).selection_method === 'spaced_repetition' ? (
                      <>
                        <Clock size={20} className="text-blue-400" />
                        <div>
                          <div className="font-semibold text-blue-400">Spaced Repetition (20%)</div>
                          <div className="text-sm text-gray-500">Reviewing this topic to prevent forgetting</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="font-semibold text-blue-400">RL-Driven</div>
                          <div className="text-sm text-gray-500">Optimizing based on your learning patterns</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Selection Reason */}
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Why This Topic?</div>
                  <div className="text-gray-300">
                    {(() => {
                      const reason = (currentQuestion as any).selection_reason || 'Selected to optimize your learning progress'
                      const colonIndex = reason.indexOf(':')
                      if (colonIndex > 0) {
                        const phaseName = reason.substring(0, colonIndex)
                        const description = reason.substring(colonIndex + 1)
                        return (
                          <>
                            <span className="text-blue-400 font-semibold">{phaseName}</span>
                            <span>:{description}</span>
                          </>
                        )
                      }
                      return reason
                    })()}
                  </div>
                </div>

                {/* Priority Score */}
                {(currentQuestion as any).selection_priority !== undefined && (
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
                      Higher priority = more critical for your learning
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Topic Hierarchy Tree */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Topic Details
              </h3>

              <div className="space-y-4">
                {/* Hierarchical Tree */}
                {currentQuestion.hierarchy && (
                  <div className="p-4 neuro-inset rounded-lg">
                    <div className="text-xs text-gray-500 mb-3">Learning Path</div>
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
                            <div className="w-px h-6 bg-gray-700"></div>
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="text-xs text-gray-500">Chapter</div>
                            <div className="font-semibold text-gray-300">{currentQuestion.hierarchy.chapter}</div>
                          </div>
                        </div>
                      )}

                      {/* Topic Level */}
                      <div className="flex items-start gap-3">
                        <div className="neuro-raised w-8 h-8 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-green-400 font-bold">T</span>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="text-xs text-gray-500">Topic</div>
                          <div className="font-semibold text-green-400">{currentQuestion.hierarchy.topic}</div>
                          {currentQuestion.hierarchy.description && (
                            <div className="text-xs text-gray-600 mt-1">{currentQuestion.hierarchy.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bloom Level */}
                <div className="flex items-start gap-3 p-4 neuro-inset rounded-lg">
                  <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">{currentQuestion.bloom_level}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Bloom Level</div>
                    <div className="font-semibold text-gray-200">
                      {currentQuestion.bloom_level === 1 && 'Remember - Recall facts and basic concepts'}
                      {currentQuestion.bloom_level === 2 && 'Understand - Explain ideas or concepts'}
                      {currentQuestion.bloom_level === 3 && 'Apply - Use information in new situations'}
                      {currentQuestion.bloom_level === 4 && 'Analyze - Draw connections among ideas'}
                      {currentQuestion.bloom_level === 5 && 'Evaluate - Justify a stand or decision'}
                      {currentQuestion.bloom_level === 6 && 'Create - Produce new or original work'}
                    </div>
                  </div>
                </div>

                {/* Question Format */}
                <div className="flex items-start gap-3 p-4 neuro-inset rounded-lg">
                  <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 font-bold">Q</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Question Format</div>
                    <div className="font-semibold text-gray-200">
                      {currentQuestion.question_format === 'mcq_single' && 'Multiple Choice (Single Answer)'}
                      {currentQuestion.question_format === 'mcq_multi' && 'Multiple Choice (Multiple Answers)'}
                      {currentQuestion.question_format === 'true_false' && 'True/False'}
                      {currentQuestion.question_format === 'fill_blank' && 'Fill in the Blank'}
                      {currentQuestion.question_format === 'open_ended' && 'Open Ended'}
                      {currentQuestion.question_format === 'matching' && 'Matching'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Your Rewards */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Trophy size={24} className="text-yellow-400" />
                Your Performance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calibration Score */}
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Calibration Score</div>
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${
                      answerResult.calibrationScore > 0 ? 'text-green-400' :
                      answerResult.calibrationScore < 0 ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {answerResult.calibrationScore > 0 ? '+' : ''}{answerResult.calibrationScore.toFixed(2)}
                    </div>
                    <div className="flex-1">
                      <div className="neuro-inset rounded-full h-2 overflow-hidden relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600" />
                        <div
                          className={`absolute h-full ${
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
                  <div className="text-xs text-gray-500 mt-2">
                    {answerResult.calibrationScore > 1.0 && '🎯 Excellent! Your confidence matched your performance perfectly'}
                    {answerResult.calibrationScore > 0.5 && answerResult.calibrationScore <= 1.0 && '👍 Good calibration! You assessed yourself well'}
                    {answerResult.calibrationScore > 0 && answerResult.calibrationScore <= 0.5 && '✓ Fair calibration'}
                    {answerResult.calibrationScore === 0 && 'Neutral calibration'}
                    {answerResult.calibrationScore < 0 && answerResult.calibrationScore >= -0.5 && '⚠️ Slight miscalibration'}
                    {answerResult.calibrationScore < -0.5 && '⚠️ Poor calibration - try to be more honest about your confidence'}
                  </div>
                </div>

                {/* Your Choices Summary */}
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="text-sm text-gray-400 mb-3">Your Choices</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Confidence:</span>
                      <span className={`font-semibold ${
                        confidence === 3 ? 'text-green-400' :
                        confidence === 2 ? 'text-blue-400' :
                        'text-yellow-400'
                      }`}>
                        {confidence === 3 ? 'High' : confidence === 2 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Method:</span>
                      <span className={`font-semibold ${
                        recognitionMethod === 'memory' ? 'text-purple-400' :
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
                      <span className="text-gray-500 text-sm">Result:</span>
                      <span className={`font-semibold ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {answerResult.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Question Button */}
            <button
              onClick={handleNextQuestion}
              className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold"
            >
              Next Question →
            </button>
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
