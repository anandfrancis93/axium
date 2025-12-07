/**
 * Topic Quiz Page
 * 
 * Quiz for a specific topic - cycles through all questions for that topic
 * UI/UX mirrors app/subjects/it-cs/cybersecurity/learn/page.tsx EXACTLY
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Square, Circle } from 'lucide-react'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { TextSelectionChat } from '@/components/quiz/TextSelectionChat'
import Modal from '@/components/Modal'
import { getAvailableRecognitionMethods } from '@/lib/utils/recognition-method'
import { QuestionFormat, AnswerResult, RecognitionMethod } from '@/lib/types/quiz'
import { normalizeCalibration } from '@/lib/utils/calibration'
import { BLOOM_LEVEL_NAMES, BloomLevel } from '@/lib/types/database'
import { formatTimeUntilReview } from '@/lib/utils/spaced-repetition'

interface TopicQuestion {
    id: string
    question_text: string
    question_type: string
    options: string[] | null
    correct_answer: string | string[]
    explanation: string
    bloom_level: number
    hierarchy: any // JSONB
    cognitive_dimension: string | null
}

type QuizStep = 'confidence' | 'answer' | 'recognition' | 'results' | 'summary'

function capitalizeFirst(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export default function TopicQuizPage() {
    const router = useRouter()
    const params = useParams()
    const topicName = decodeURIComponent(params.topic as string)

    // Session storage key for this topic
    const STORAGE_KEY = `quiz_state_${topicName}`

    const [questions, setQuestions] = useState<TopicQuestion[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentStep, setCurrentStep] = useState<QuizStep>('confidence')
    const [userAnswer, setUserAnswer] = useState<string | string[]>('')
    const [confidence, setConfidence] = useState<number | null>(null)
    const [recognitionMethod, setRecognitionMethod] = useState<RecognitionMethod | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [correctCount, setCorrectCount] = useState(0)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [topicId, setTopicId] = useState<string | null>(null)
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
    const [showExitModal, setShowExitModal] = useState(false)

    // Save quiz state to sessionStorage
    const saveState = (questionsToSave: TopicQuestion[], index: number, step: QuizStep, correct: number) => {
        try {
            const state = {
                questionIds: questionsToSave.map(q => q.id),
                currentIndex: index,
                currentStep: step,
                correctCount: correct,
                timestamp: Date.now()
            }
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        } catch (e) {
            console.error('Failed to save quiz state:', e)
        }
    }

    // Clear quiz state
    const clearState = () => {
        try {
            sessionStorage.removeItem(STORAGE_KEY)
        } catch (e) {
            console.error('Failed to clear quiz state:', e)
        }
    }

    useEffect(() => {
        loadQuestions()
    }, [])

    async function loadQuestions() {
        try {
            setLoading(true)
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                console.error('User not logged in')
                return
            }

            // Get topic
            const { data: topic, error: topicError } = await supabase
                .from('topics')
                .select('id, name')
                .eq('name', topicName)
                .single()

            if (topicError || !topic) {
                console.error('Topic not found:', topicName)
                router.push('/subjects/it-cs/cybersecurity')
                return
            }

            setTopicId(topic.id)

            // Get all questions for this topic
            const { data: topicQuestions, error: questionsError } = await supabase
                .from('questions')
                .select('*')
                .eq('topic_id', topic.id)
                .order('bloom_level', { ascending: true })

            if (questionsError) {
                console.error('Error loading questions:', questionsError)
                return
            }

            // Get user's review status for these questions
            const { data: reviews, error: reviewsError } = await supabase
                .from('user_question_reviews')
                .select('question_id, next_review_date')
                .eq('user_id', user.id)
                .in('question_id', topicQuestions?.map(q => q.id) || [])

            if (reviewsError) {
                console.error('Error loading reviews:', reviewsError)
            }

            // Helper to check if question is due
            const isDue = (questionId: string) => {
                const review = reviews?.find(r => r.question_id === questionId)
                if (!review) return true // Never reviewed, so it's due
                return new Date(review.next_review_date) <= new Date() // Due if review date is past
            }

            if (!topicQuestions || topicQuestions.length === 0) {
                setQuestions([])
            } else {
                // Filter questions to only show those that are due (or new)
                const dueQuestions = topicQuestions.filter(q => isDue(q.id))

                // If no questions are due, allow practicing all questions
                const questionsToUse = dueQuestions.length > 0 ? dueQuestions : topicQuestions

                const mappedQuestions = questionsToUse.map(q => {
                    // Fix: Force true_false type if text starts with "True or False" (handles data inconsistencies)
                    let questionType = q.question_format
                    const cleanText = q.question_text.toLowerCase().replace(/[^a-z]/g, '')

                    if (cleanText.startsWith('trueorfalse') ||
                        cleanText.startsWith('truefalse') ||
                        (q.question_format === 'mcq_single' && (!q.options || q.options.length === 0))) {
                        questionType = 'true_false'
                    }

                    return {
                        id: q.id,
                        question_text: q.question_text,
                        question_type: questionType,
                        options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(JSON.stringify(q.options))) : null,
                        correct_answer: q.correct_answer,
                        explanation: q.explanation || '',
                        bloom_level: q.bloom_level,
                        hierarchy: { topic: topic.name },
                        cognitive_dimension: q.cognitive_dimension
                    }
                })

                // Try to restore saved state
                let savedState = null
                try {
                    const saved = sessionStorage.getItem(STORAGE_KEY)
                    if (saved) {
                        savedState = JSON.parse(saved)
                        // Only use saved state if it's less than 2 hours old
                        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000)
                        if (savedState.timestamp < twoHoursAgo) {
                            savedState = null
                            sessionStorage.removeItem(STORAGE_KEY)
                        }
                    }
                } catch (e) {
                    console.error('Failed to restore quiz state:', e)
                }

                if (savedState && savedState.questionIds) {
                    // Restore question order from saved state
                    const orderedQuestions: TopicQuestion[] = []
                    for (const id of savedState.questionIds) {
                        const q = mappedQuestions.find(mq => mq.id === id)
                        if (q) orderedQuestions.push(q)
                    }
                    // Add any new questions that weren't in the saved state
                    for (const q of mappedQuestions) {
                        if (!orderedQuestions.find(oq => oq.id === q.id)) {
                            orderedQuestions.push(q)
                        }
                    }
                    setQuestions(orderedQuestions)
                    setCurrentIndex(savedState.currentIndex || 0)
                    setCurrentStep(savedState.currentStep || 'confidence')
                    setCorrectCount(savedState.correctCount || 0)
                } else {
                    // Shuffle questions for new quiz session
                    const shuffled = [...mappedQuestions].sort(() => Math.random() - 0.5)
                    setQuestions(shuffled)
                    // Save initial state
                    saveState(shuffled, 0, 'confidence', 0)
                }
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleConfidenceSelect(level: number) {
        setConfidence(level)
        setCurrentStep('answer')
    }

    async function handleAnswerSubmit() {
        if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
            return
        }
        setCurrentStep('recognition')
    }

    async function handleRecognitionSelect(method: RecognitionMethod) {
        if (!questions[currentIndex] || !confidence) return

        setRecognitionMethod(method)
        setSubmitting(true)

        try {
            const currentQ = questions[currentIndex]

            // Optimistic check
            let correct = false
            if (currentQ.question_type === 'true_false') {
                correct = String(userAnswer).toLowerCase().trim() === String(currentQ.correct_answer).toLowerCase().trim()
            } else if (currentQ.question_type === 'mcq_single' || currentQ.question_type === 'fill_blank') {
                const userVal = String(userAnswer).toLowerCase().trim()
                const correctVal = String(currentQ.correct_answer).toLowerCase().trim()

                // Handle "A. Option" format matching if needed
                const userLetter = userVal.match(/^([a-z])\./)?.[1]
                const correctLetter = correctVal.match(/^([a-z])\./)?.[1]

                correct = userVal === correctVal ||
                    (userLetter && correctLetter && userLetter === correctLetter) ||
                    userVal.includes(correctVal) || // Lenient checks
                    correctVal.includes(userVal)
            } else if (currentQ.question_type === 'mcq_multi') {
                const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]

                // Handle correct_answer that may be stored as JSON string in database
                let correctAnswers: string[]
                if (Array.isArray(currentQ.correct_answer)) {
                    correctAnswers = currentQ.correct_answer
                } else if (typeof currentQ.correct_answer === 'string' && currentQ.correct_answer.startsWith('[')) {
                    try {
                        correctAnswers = JSON.parse(currentQ.correct_answer)
                    } catch {
                        correctAnswers = [currentQ.correct_answer]
                    }
                } else {
                    correctAnswers = [currentQ.correct_answer as string]
                }

                correct = userAnswers.length === correctAnswers.length &&
                    userAnswers.every(a => correctAnswers.some(c => a.includes(c)))
            }

            setIsCorrect(correct)
            if (correct) {
                setCorrectCount(prev => prev + 1)
            }

            const response = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: currentQ.id,
                    question: {
                        id: currentQ.id,
                        topic_id: topicId,
                        question_text: currentQ.question_text,
                        question_format: currentQ.question_type,
                        options: currentQ.options,
                        correct_answer: currentQ.correct_answer,
                        bloom_level: currentQ.bloom_level,
                        cognitive_dimension: currentQ.cognitive_dimension,
                        explanation: currentQ.explanation
                    },
                    answer: userAnswer,
                    confidence,
                    recognitionMethod: method,
                    timeTaken: 30,
                    topicId
                })
            })

            const data = await response.json()
            if (data.result) {
                setAnswerResult(data.result)
            }

            setCurrentStep('results')
            // Save state with updated correct count
            const newCorrectCount = correct ? correctCount + 1 : correctCount
            saveState(questions, currentIndex, 'results', newCorrectCount)
        } catch (error) {
            console.error('Error submitting:', error)
        } finally {
            setSubmitting(false)
        }
    }

    function handleNextQuestion() {
        if (currentIndex + 1 >= questions.length) {
            setCurrentStep('summary')
            // Clear saved state when quiz completes
            clearState()
        } else {
            const newIndex = currentIndex + 1
            setCurrentIndex(newIndex)
            setCurrentStep('confidence')
            setUserAnswer('')
            setConfidence(null)
            setRecognitionMethod(null)
            setIsCorrect(null)
            setAnswerResult(null)
            // Save state for next question
            saveState(questions, newIndex, 'confidence', correctCount)
        }
    }

    const currentQ = questions[currentIndex]

    // Map currentQ to the shape expected by QuestionCard and other components
    const currentQuestion = currentQ ? {
        id: currentQ.id,
        topic_id: topicId || '',
        topic_name: topicName,
        bloom_level: currentQ.bloom_level,
        question_format: currentQ.question_type as QuestionFormat,
        question_text: currentQ.question_text,
        options: currentQ.options || [],
        correct_answer: currentQ.correct_answer,
        explanation: currentQ.explanation,
        hierarchy: currentQ.hierarchy,
        cognitive_dimension: currentQ.cognitive_dimension
    } : null

    if (loading) {
        return (
            <div className="min-h-screen neuro-container flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-400" size={48} />
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen neuro-container flex items-center justify-center">
                <div className="neuro-card p-8 text-center max-w-md">
                    <p className="text-gray-400 mb-4">No questions available for this topic yet.</p>
                    <button
                        onClick={() => router.back()}
                        className="neuro-btn text-blue-400"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    if (currentStep === 'summary') {
        const percentage = Math.round((correctCount / questions.length) * 100)
        return (
            <div className="min-h-screen neuro-container py-8">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="neuro-card p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-200 mb-6">Quiz Complete!</h2>

                        <div className="neuro-inset p-8 rounded-lg mb-6">
                            <div className={`text-6xl font-bold mb-2 ${percentage >= 80 ? 'text-green-400' :
                                percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {percentage}%
                            </div>
                            <div className="text-gray-400">
                                {correctCount} / {questions.length} correct
                            </div>
                        </div>

                        <p className="text-gray-400 mb-6">
                            Topic: <span className="text-gray-200 font-medium">{topicName}</span>
                        </p>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    setCurrentIndex(0)
                                    setCurrentStep('confidence')
                                    setCorrectCount(0)
                                    setUserAnswer('')
                                    setConfidence(null)
                                    setIsCorrect(null)
                                    setAnswerResult(null)
                                    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5))
                                }}
                                className="neuro-btn text-blue-400 px-6 py-3"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="neuro-btn text-gray-400 px-6 py-3"
                            >
                                Back to Topic
                            </button>
                        </div>
                    </div>
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
                            <h1 className="text-2xl font-bold text-gray-200">{topicName}</h1>
                            <p className="text-sm text-gray-500 mt-1">Question {currentIndex + 1} of {questions.length}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                                <div className="text-xs text-gray-500">Correct</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-300">{currentIndex + 1}</div>
                                <div className="text-xs text-gray-500">Current</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 1: Confidence Selection */}
                {currentStep === 'confidence' && currentQuestion && (
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
                {currentStep === 'answer' && currentQuestion && (
                    <>
                        <QuestionCard
                            question={currentQuestion as any}
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
                {currentStep === 'recognition' && currentQuestion && (
                    <div className="neuro-card p-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">How did you arrive at your answer?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getAvailableRecognitionMethods(currentQuestion.question_format).includes('memory') && (
                                <button
                                    onClick={() => handleRecognitionSelect('memory')}
                                    disabled={submitting}
                                    className="neuro-btn text-green-400 p-6 text-left disabled:opacity-50"
                                >
                                    <div className="text-lg font-bold mb-1">Recalled from Memory</div>
                                    <div className="text-sm text-gray-400">I remembered this from studying</div>
                                </button>
                            )}
                            {getAvailableRecognitionMethods(currentQuestion.question_format).includes('recognition') && (
                                <button
                                    onClick={() => handleRecognitionSelect('recognition')}
                                    disabled={submitting}
                                    className="neuro-btn text-yellow-400 p-6 text-left disabled:opacity-50"
                                >
                                    <div className="text-lg font-bold mb-1">Recognized from Options</div>
                                    <div className="text-sm text-gray-400">I recognized the correct answer when I saw it</div>
                                </button>
                            )}
                            {getAvailableRecognitionMethods(currentQuestion.question_format).includes('educated_guess') && (
                                <button
                                    onClick={() => handleRecognitionSelect('educated_guess')}
                                    disabled={submitting}
                                    className="neuro-btn text-yellow-400 p-6 text-left disabled:opacity-50"
                                >
                                    <div className="text-lg font-bold mb-1">Made an Educated Guess</div>
                                    <div className="text-sm text-gray-400">I used logic/reasoning to narrow it down</div>
                                </button>
                            )}
                            {getAvailableRecognitionMethods(currentQuestion.question_format).includes('random_guess') && (
                                <button
                                    onClick={() => handleRecognitionSelect('random_guess')}
                                    disabled={submitting}
                                    className="neuro-btn text-red-400 p-6 text-left disabled:opacity-50"
                                >
                                    <div className="text-lg font-bold mb-1">Made a Random Guess</div>
                                    <div className="text-sm text-gray-400">I had no idea and guessed randomly</div>
                                </button>
                            )}
                        </div>
                        {submitting && (
                            <div className="mt-4 text-center">
                                <Loader2 className="animate-spin text-blue-400 mx-auto" size={24} />
                                <p className="text-gray-400 text-sm mt-2">Submitting your answer...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Results */}
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
                                        const optionLetter = String.fromCharCode(65 + idx)
                                        const optionWithLetter = currentQuestion.question_format === 'fill_blank'
                                            ? option
                                            : `${optionLetter}. ${option}`

                                        const isUserAnswer = Array.isArray(userAnswer)
                                            ? userAnswer.includes(optionWithLetter)
                                            : userAnswer === optionWithLetter

                                        let correctOptionText = answerResult.correctAnswer

                                        if (Array.isArray(correctOptionText) && currentQuestion.options) {
                                            correctOptionText = correctOptionText.map(ans => {
                                                if (typeof ans === 'string' && ans.length === 1 && /^[A-Z]$/.test(ans)) {
                                                    const idx = ans.charCodeAt(0) - 65
                                                    return currentQuestion.options![idx]
                                                }
                                                return ans
                                            })
                                        } else if (typeof correctOptionText === 'string' && correctOptionText.length === 1 && /^[A-Z]$/.test(correctOptionText) && currentQuestion.options) {
                                            const correctIdx = correctOptionText.charCodeAt(0) - 65
                                            correctOptionText = currentQuestion.options[correctIdx]
                                        }

                                        const isCorrectAnswer = Array.isArray(correctOptionText)
                                            ? correctOptionText.includes(option)
                                            : correctOptionText === option

                                        return (
                                            <div
                                                key={idx}
                                                className={`transition-all p-4 ${isUserAnswer
                                                    ? 'neuro-raised'
                                                    : 'neuro-inset'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-5 h-5 mt-0.5">
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
                                                    </div>
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

                            {/* True/False */}
                            {currentQuestion.question_format === 'true_false' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        {['True', 'False'].map((option) => {
                                            const isUserAnswer = userAnswer === option
                                            const isCorrectAnswer = answerResult.correctAnswer === option

                                            return (
                                                <div
                                                    key={option}
                                                    className={`flex-1 py-4 px-6 text-center text-lg font-semibold transition-all ${isUserAnswer ? 'neuro-raised' : 'neuro-inset'
                                                        }`}
                                                >
                                                    <div className={`${isCorrectAnswer ? 'text-green-400' :
                                                        isUserAnswer && !isCorrectAnswer ? 'text-red-400' :
                                                            'text-gray-300'
                                                        }`}>
                                                        {option}
                                                        {isUserAnswer && !isCorrectAnswer && (
                                                            <span className="ml-2 text-sm">(Your answer)</span>
                                                        )}
                                                        {isCorrectAnswer && (
                                                            <span className="ml-2 text-sm">(Correct)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Open Ended */}
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
                                                {Array.isArray(answerResult.correctAnswer) ? answerResult.correctAnswer.join(', ') : answerResult.correctAnswer}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Section 2: Answer Explanation */}
                        {/* (Copy logic directly from learn/page.tsx or previous implementation) */}
                        <div className="neuro-card p-6">
                            <h3 className="text-xl font-semibold text-gray-200 mb-4">
                                Answer Explanation
                            </h3>
                            <div className="prose prose-invert max-w-none space-y-4">
                                {(() => {
                                    let explanation = answerResult.explanation

                                    // Handle string explanations (for true/false or simple text)
                                    if (typeof explanation === 'string') {
                                        // Check if it's a JSON string that needs parsing
                                        if (explanation.startsWith('{') && explanation.endsWith('}')) {
                                            try {
                                                explanation = JSON.parse(explanation)
                                            } catch {
                                                // If parsing fails, just display as text
                                                return <p className="text-gray-300 leading-relaxed whitespace-pre-line">{explanation}</p>
                                            }
                                        } else {
                                            return <p className="text-gray-300 leading-relaxed whitespace-pre-line">{explanation}</p>
                                        }
                                    }

                                    // Handle object explanations (for MCQ)
                                    if (typeof explanation === 'object' && explanation !== null) {
                                        const options = currentQuestion?.options || []
                                        const correctAnswer = answerResult.correctAnswer
                                        const userAnswerStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer

                                        // Get all option keys and order them: correct first, then user's answer, then others
                                        const allKeys = Object.keys(explanation)
                                        const orderedKeys: string[] = []

                                        // Add correct answer first
                                        const correctKey = allKeys.find(k =>
                                            k === correctAnswer ||
                                            (options.indexOf(k) !== -1 && options[options.indexOf(k)] === correctAnswer)
                                        )
                                        if (correctKey) orderedKeys.push(correctKey)

                                        // Add user's answer if different
                                        const userKey = allKeys.find(k =>
                                            k === userAnswerStr ||
                                            (options.indexOf(k) !== -1 && options[options.indexOf(k)] === userAnswerStr)
                                        )
                                        if (userKey && !orderedKeys.includes(userKey)) orderedKeys.push(userKey)

                                        // Add remaining keys
                                        allKeys.forEach(key => {
                                            if (!orderedKeys.includes(key)) orderedKeys.push(key)
                                        })

                                        return orderedKeys.map((optionKey, idx) => {
                                            const text = explanation[optionKey as keyof typeof explanation] as string
                                            // Handle both single answer and array of answers (mcq_multi)
                                            const correctAnswerArr = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
                                            const userAnswerArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
                                            const isCorrect = text?.startsWith('CORRECT:') || correctAnswerArr.includes(optionKey)
                                            const isUserChoice = userAnswerArr.some(ua => ua === optionKey || ua?.includes(optionKey))

                                            // Get letter for display (A, B, C, D)
                                            const optionIndex = options.findIndex((opt: string) => opt === optionKey)
                                            const letter = optionIndex !== -1 ? String.fromCharCode(65 + optionIndex) : ''

                                            return (
                                                <div key={optionKey} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-500/10 border border-green-500/20' : isUserChoice ? 'bg-red-500/10 border border-red-500/20' : 'bg-gray-800/30'}`}>
                                                    <div className="flex items-start gap-2">
                                                        {letter && <span className={`font-bold ${isCorrect ? 'text-green-400' : isUserChoice ? 'text-red-400' : 'text-gray-400'}`}>{letter}.</span>}
                                                        <div className="flex-1">
                                                            <span className={`font-medium ${isCorrect ? 'text-green-300' : isUserChoice ? 'text-red-300' : 'text-gray-300'}`}>
                                                                {optionKey}
                                                            </span>
                                                            <p className="text-gray-400 text-sm mt-1">{text}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }

                                    return null
                                })()}
                            </div>
                        </div>



                        {/* Section 4: Your Performance */}
                        <div className="neuro-card p-6">
                            <h3 className="text-xl font-semibold text-gray-200 mb-4">Summary</h3>
                            <div className="p-4 neuro-inset rounded-lg">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-sm font-semibold">Bloom Level:</span>
                                        <span className="font-semibold text-sm text-white">{currentQuestion.bloom_level} ({BLOOM_LEVEL_NAMES[currentQuestion.bloom_level as BloomLevel]})</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-sm font-semibold">Question Type:</span>
                                        <span className="font-semibold text-sm text-white">
                                            {currentQuestion.question_format === 'true_false' ? 'True/False' :
                                                currentQuestion.question_format === 'mcq_single' ? 'Multiple Choice' :
                                                    currentQuestion.question_format === 'mcq_multi' ? 'Multiple Select' :
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
                                        <span className={`font-semibold text-sm ${confidence === 3 ? 'text-green-400' : confidence === 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {confidence === 3 ? 'High' : confidence === 2 ? 'Medium' : 'Low'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-sm font-semibold">Method:</span>
                                        <span className={`font-semibold text-sm ${recognitionMethod === 'memory' ? 'text-green-400' : recognitionMethod === 'recognition' ? 'text-yellow-400' : recognitionMethod === 'educated_guess' ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {recognitionMethod === 'memory' && 'Memory'}
                                            {recognitionMethod === 'recognition' && 'Recognition'}
                                            {recognitionMethod === 'educated_guess' && 'Educated Guess'}
                                            {recognitionMethod === 'random_guess' && 'Random Guess'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-sm font-semibold">Calibration Score:</span>
                                        {(() => {
                                            const normalized = normalizeCalibration(answerResult.calibrationScore)
                                            return (
                                                <span className={`font-semibold text-sm ${normalized >= 0.67 ? 'text-green-400' : normalized >= 0.33 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {normalized.toFixed(2)}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                    {answerResult.nextReviewDate && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-white text-sm font-semibold">Next Review:</span>
                                            <span className="font-semibold text-sm text-white">
                                                {formatTimeUntilReview(answerResult.nextReviewDate)}
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

                {/* Exit Confirmation Modal */}
                <Modal
                    isOpen={showExitModal}
                    onClose={() => setShowExitModal(false)}
                    title="End Quiz?"
                    type="warning"
                    actions={[
                        {
                            label: 'Cancel',
                            onClick: () => setShowExitModal(false),
                            variant: 'secondary'
                        },
                        {
                            label: 'Exit',
                            onClick: () => router.back(),
                            variant: 'primary'
                        }
                    ]}
                >
                    <p className="text-center">
                        Are you sure you want to end this quiz? Your progress will be saved.
                    </p>
                </Modal>

                {/* Text Selection Chat */}
                <TextSelectionChat
                    enabled={currentStep === 'results' && !!answerResult}
                    context={{
                        topicName: currentQuestion?.hierarchy?.topic || topicName,
                        bloomLevel: currentQuestion?.bloom_level,
                        questionText: currentQuestion?.question_text,
                        explanation: answerResult?.explanation
                    }}
                />
            </div>
        </div>
    )
}
