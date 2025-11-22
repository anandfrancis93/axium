/**
 * Learn Page - Quiz Interface
 *
 * Main quiz page where students answer questions
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { ConfidenceSlider } from '@/components/quiz/ConfidenceSlider'
import { RecognitionMethodSelector } from '@/components/quiz/RecognitionMethodSelector'
import { AnswerFeedback } from '@/components/quiz/AnswerFeedback'
import { QuizSession, QuizQuestion, AnswerResult, RecognitionMethod } from '@/lib/types/quiz'
import { BLOOM_LEVEL_NAMES, BloomLevel } from '@/lib/types/database'
import { Loader2, Circle, Square } from 'lucide-react'
import Modal from '@/components/Modal'

type QuizStep = 'confidence' | 'answer' | 'recognition' | 'results'

function LearnPageContent() {
  const router = useRouter()
  const pathname = usePathname()

  // Extract subject from URL path
  // e.g., /subjects/it-cs/cybersecurity/learn → category: it-cs, subject: cybersecurity
  const pathParts = pathname?.split('/').filter(Boolean) || []
  const category = pathParts[1] || 'it-cs' // URL category (e.g., 'it-cs', 'science')
  const subject = pathParts[2] || 'cybersecurity' // Subject slug (matches subjects.slug in DB)
  const chapterPageUrl = `/subjects/${category}/${subject}`

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
  const [showExitModal, setShowExitModal] = useState(false)

  // Session storage key
  const STORAGE_KEY = 'axium_quiz_state'

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Guard: Check if user is authorized to access quiz page
  useEffect(() => {
    const authorized = sessionStorage.getItem('quiz_authorized')
    const savedQuizState = sessionStorage.getItem(STORAGE_KEY)

    // Allow access if either:
    // 1. User has authorization flag (just clicked "Start Quiz")
    // 2. User has saved quiz state (refreshed during active quiz)
    if (!authorized && !savedQuizState) {
      // User accessed page directly without authorization or saved state - redirect
      router.push(chapterPageUrl)
      return
    }

    // Clear authorization flag on first load (prevents back button access)
    // But keep it if there's a saved state (allows refresh)
    if (authorized && !savedQuizState) {
      sessionStorage.removeItem('quiz_authorized')
    }

    // Prevent browser back button by replacing history entry
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      // If user tries to go back, redirect them away
      router.push(chapterPageUrl)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router, chapterPageUrl])

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

        // Validate question ID is a proper UUID (not old "generated-..." format)
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.currentQuestion?.id || '')

        if (!isValidUUID) {
          console.log('Cached question has invalid ID format, clearing cache and loading new question')
          sessionStorage.removeItem(STORAGE_KEY)
          loadNextQuestion()
          return
        }

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
        sessionStorage.removeItem(STORAGE_KEY)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject // Subject slug to filter topics by subject
        })
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
                  className="neuro-btn text-yellow-400 p-6 text-left disabled:opacity-50"
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
              <h2 className="text-xl font-semibold text-gray-200 mb-6">
                {currentQuestion.question_text}
              </h2>

              {/* Answer Options with Result */}
              {(currentQuestion.question_format === 'mcq_single' || currentQuestion.question_format === 'mcq_multi' || currentQuestion.question_format === 'fill_blank') && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const optionLetter = String.fromCharCode(65 + idx) // A, B, C, D...
                    // For fill_blank, don't add letter prefix
                    const optionWithLetter = currentQuestion.question_format === 'fill_blank'
                      ? option
                      : `${optionLetter}. ${option}` // Match what's sent to API

                    const isUserAnswer = Array.isArray(userAnswer)
                      ? userAnswer.includes(optionWithLetter)
                      : userAnswer === optionWithLetter

                    // Convert letter-based correct answers (A, B, C) to actual option text
                    let correctOptionText = answerResult.correctAnswer
                    if (typeof correctOptionText === 'string' && correctOptionText.length === 1 && /^[A-Z]$/.test(correctOptionText) && currentQuestion.options) {
                      // It's a letter (A, B, C, D), convert to index
                      const correctIdx = correctOptionText.charCodeAt(0) - 65
                      correctOptionText = currentQuestion.options[correctIdx]
                    }

                    const isCorrectAnswer = Array.isArray(correctOptionText)
                      ? correctOptionText.includes(option)
                      : correctOptionText === option

                    return (
                      <div
                        key={idx}
                        className={`transition-all ${isUserAnswer
                            ? 'neuro-raised'
                            : 'neuro-inset'
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {currentQuestion.question_format === 'mcq_multi' ? (
                            <Square
                              size={20}
                              className={`${isUserAnswer
                                  ? isCorrectAnswer
                                    ? 'fill-current text-green-400'
                                    : 'fill-current text-red-400'
                                  : isCorrectAnswer
                                    ? 'text-green-400'
                                    : 'text-gray-300'
                                }`}
                            />
                          ) : (
                            <Circle
                              size={20}
                              className={`${isUserAnswer
                                  ? isCorrectAnswer
                                    ? 'fill-current text-green-400'
                                    : 'fill-current text-red-400'
                                  : isCorrectAnswer
                                    ? 'text-green-400'
                                    : 'text-gray-300'
                                }`}
                            />
                          )}
                          <div className="flex-1">
                            <div className={`${isUserAnswer || isCorrectAnswer ? 'font-semibold' : ''
                              } ${isCorrectAnswer ? 'text-green-400' :
                                isUserAnswer && !isCorrectAnswer ? 'text-red-400' :
                                  'text-gray-300'
                              }`}>
                              {capitalizeFirst(option)}
                            </div>
                            {!isUserAnswer && isCorrectAnswer && (
                              <div className="text-xs text-gray-500 mt-1">Correct answer</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* True/False Answer Options with Result */}
              {currentQuestion.question_format === 'true_false' && (
                <div className="flex gap-4">
                  {['True', 'False'].map((option) => {
                    const isUserAnswer = userAnswer === option
                    const isCorrectAnswer = answerResult.correctAnswer === option

                    return (
                      <div
                        key={option}
                        className={`flex-1 transition-all ${isUserAnswer
                            ? 'neuro-raised'
                            : 'neuro-inset'
                          }`}
                      >
                        <div className={`text-center ${isUserAnswer || isCorrectAnswer ? 'font-semibold' : ''
                          } ${isCorrectAnswer ? 'text-green-400' :
                            isUserAnswer && !isCorrectAnswer ? 'text-red-400' :
                              'text-gray-300'
                          }`}>
                          {option}
                        </div>
                        {isUserAnswer && (
                          <div className="text-xs text-gray-500 mt-1 text-center">Your answer</div>
                        )}
                        {!isUserAnswer && isCorrectAnswer && (
                          <div className="text-xs text-gray-500 mt-1 text-center">Correct answer</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Open Ended Answer with Result */}
              {currentQuestion.question_format === 'open_ended' && (
                <div className="space-y-4">
                  <div className="neuro-inset p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Your answer:</div>
                    <div className={`font-medium ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {userAnswer || '(No answer provided)'}
                    </div>
                  </div>
                  {!answerResult.isCorrect && (
                    <div className="neuro-inset p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">Correct answer:</div>
                      <div className="text-green-400 font-medium">
                        {answerResult.correctAnswer}
                      </div>
                    </div>
                  )}
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

            {/* Section 3: Topic Details */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">
                Topic Details
              </h3>

              {/* Hierarchical Tree */}
              {currentQuestion.hierarchy && (
                <div className="p-4 neuro-inset rounded-lg">
                  <div className="space-y-3">
                    {/* Domain Level */}
                    {currentQuestion.hierarchy.subject && (
                      <div>
                        <div className="text-xs text-gray-500">Domain</div>
                        <div className="text-sm font-semibold text-white">{currentQuestion.hierarchy.subject}</div>
                      </div>
                    )}

                    {/* Learning Objective */}
                    {(currentQuestion.hierarchy as any).learningObjective && (
                      <div>
                        <div className="text-xs text-gray-500">Learning Objective</div>
                        <div className="text-sm font-semibold text-white">{(currentQuestion.hierarchy as any).learningObjective}</div>
                      </div>
                    )}

                    {/* Topic Level */}
                    <div>
                      <div className="text-xs text-gray-500">Topic</div>
                      <div className="text-sm font-semibold text-white">{currentQuestion.hierarchy.topic}</div>
                    </div>

                    {/* Cognitive Dimension */}
                    {currentQuestion.cognitive_dimension && (
                      <div>
                        <div className="text-xs text-gray-500">Cognitive Dimension</div>
                        <div className="text-sm font-semibold text-white">{currentQuestion.cognitive_dimension}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Your Performance */}
            <div className="neuro-card p-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">
                Summary
              </h3>

              <div className="p-4 neuro-inset rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Bloom Level:</span>
                    <span className="font-semibold text-sm text-white">
                      {currentQuestion.bloom_level} ({BLOOM_LEVEL_NAMES[currentQuestion.bloom_level as BloomLevel]})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Question Type:</span>
                    <span className="font-semibold text-sm text-white">
                      {currentQuestion.question_format === 'mcq_single' ? 'Multiple Choice' :
                        currentQuestion.question_format === 'mcq_multi' ? 'Multiple Select' :
                          currentQuestion.question_format === 'true_false' ? 'True/False' :
                            currentQuestion.question_format === 'fill_blank' ? 'Fill in the Blank' :
                              currentQuestion.question_format === 'open_ended' ? 'Open Ended' : 'Question'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Result:</span>
                    <span className={`font-semibold text-sm ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {answerResult.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Confidence:</span>
                    <span className={`font-semibold text-sm ${confidence === 3 ? 'text-green-400' :
                        confidence === 2 ? 'text-yellow-400' :
                          'text-red-400'
                      }`}>
                      {confidence === 3 ? 'High' : confidence === 2 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Method:</span>
                    <span className={`font-semibold text-sm ${recognitionMethod === 'memory' ? 'text-green-400' :
                        recognitionMethod === 'recognition' ? 'text-yellow-400' :
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
                    <span className="text-white text-sm font-semibold">Calibration Score:</span>
                    <span className={`font-semibold text-sm ${answerResult.calibrationScore > 0 ? 'text-green-400' :
                        answerResult.calibrationScore < 0 ? 'text-red-400' :
                          'text-yellow-400'
                      }`}>
                      {answerResult.calibrationScore > 0 ? '+' : ''}{answerResult.calibrationScore.toFixed(2)}
                    </span>
                  </div>
                  {answerResult.nextReviewDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Next Review:</span>
                      <span className="font-semibold text-sm text-white">
                        {(() => {
                          const reviewDate = new Date(answerResult.nextReviewDate)
                          const now = new Date()
                          const timeDiff = reviewDate.getTime() - now.getTime()
                          const hoursUntil = Math.ceil(timeDiff / (1000 * 60 * 60))
                          const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

                          if (hoursUntil < 1) {
                            return 'Due now'
                          } else if (hoursUntil < 24) {
                            return `In ${hoursUntil} ${hoursUntil === 1 ? 'hour' : 'hours'}`
                          } else {
                            return `In ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowExitModal(true)}
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

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="End Quiz Session?"
        type="warning"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowExitModal(false),
            variant: 'secondary'
          },
          {
            label: 'OK',
            onClick: () => {
              // Clear quiz state and authorization from sessionStorage
              sessionStorage.removeItem(STORAGE_KEY)
              sessionStorage.removeItem('quiz_authorized')
              // Navigate back to chapter page
              router.push(chapterPageUrl)
            },
            variant: 'primary'
          }
        ]}
      >
        <p className="text-center">
          Your progress has been saved. Are you sure you want to end this quiz session?
        </p>
      </Modal>
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
