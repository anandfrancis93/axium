/**
 * Topic Quiz Page
 * 
 * Quiz for a specific topic - cycles through all questions for that topic
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { getAvailableRecognitionMethods } from '@/lib/utils/recognition-method'
import { RecognitionMethod } from '@/lib/types/quiz'
import { QuestionFormat } from '@/lib/utils/question-format'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Circle, Square, ArrowLeft, Check, X } from 'lucide-react'

interface TopicQuestion {
    id: string
    question_text: string
    question_type: string
    options: string[] | null
    correct_answer: string
    explanation: string
    bloom_level: number
}

type QuizStep = 'confidence' | 'answer' | 'recognition' | 'results' | 'summary'

export default function TopicQuizPage() {
    const router = useRouter()
    const params = useParams()
    const topicName = decodeURIComponent(params.topic as string)

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

    useEffect(() => {
        loadQuestions()
    }, [])

    async function loadQuestions() {
        try {
            setLoading(true)
            const supabase = createClient()

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

            if (!topicQuestions || topicQuestions.length === 0) {
                // No questions - show message
                setQuestions([])
            } else {
                // Shuffle questions for variety
                const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5)
                setQuestions(shuffled)
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

            // Check if answer is correct
            let correct = false
            if (currentQ.question_type === 'true_false') {
                correct = userAnswer === currentQ.correct_answer
            } else if (currentQ.question_type === 'mcq_single' || currentQ.question_type === 'fill_blank') {
                // Handle both full option text and just the answer
                correct = userAnswer === currentQ.correct_answer ||
                    (typeof userAnswer === 'string' && userAnswer.includes(currentQ.correct_answer))
            } else if (currentQ.question_type === 'mcq_multi') {
                // For multi-select
                const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
                const correctAnswers = Array.isArray(currentQ.correct_answer)
                    ? currentQ.correct_answer
                    : [currentQ.correct_answer]
                correct = userAnswers.length === correctAnswers.length &&
                    userAnswers.every(a => correctAnswers.some(c => a.includes(c)))
            }

            setIsCorrect(correct)
            if (correct) {
                setCorrectCount(prev => prev + 1)
            }

            // Submit to API for tracking
            await fetch('/api/quiz/submit', {
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
                        bloom_level: currentQ.bloom_level
                    },
                    answer: userAnswer,
                    confidence,
                    recognitionMethod: method,
                    timeTaken: 30, // Approximate
                    topicId
                })
            })

            setCurrentStep('results')
        } catch (error) {
            console.error('Error submitting:', error)
        } finally {
            setSubmitting(false)
        }
    }

    function handleNextQuestion() {
        if (currentIndex + 1 >= questions.length) {
            // Quiz complete
            setCurrentStep('summary')
        } else {
            setCurrentIndex(prev => prev + 1)
            setCurrentStep('confidence')
            setUserAnswer('')
            setConfidence(null)
            setRecognitionMethod(null)
            setIsCorrect(null)
        }
    }

    const currentQ = questions[currentIndex]

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-400 mx-auto mb-4" size={48} />
                    <p className="text-gray-400">Loading quiz...</p>
                </div>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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

    // Summary screen
    if (currentStep === 'summary') {
        const percentage = Math.round((correctCount / questions.length) * 100)
        return (
            <div className="min-h-screen bg-[#0a0a0a] py-8">
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
                                    // Reshuffle
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
        <div className="min-h-screen bg-[#0a0a0a] py-8">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Header */}
                <div className="neuro-card p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="neuro-btn p-2 text-gray-400 hover:text-gray-200"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-200">{topicName}</h1>
                                <p className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                                <div className="text-xs text-gray-500">Correct</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Confidence Selection */}
                {currentStep === 'confidence' && currentQ && (
                    <>
                        <div className="neuro-card p-6">
                            <p className="text-sm text-gray-500 mb-2">Bloom Level {currentQ.bloom_level}</p>
                            <h2 className="text-xl font-semibold text-gray-200">
                                {currentQ.question_text}
                            </h2>
                        </div>

                        <div className="neuro-card p-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">How confident are you?</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => handleConfidenceSelect(1)} className="neuro-btn text-red-400 p-6 text-center">
                                    <div className="text-2xl font-bold mb-2">Low</div>
                                    <div className="text-sm text-gray-400">Not confident</div>
                                </button>
                                <button onClick={() => handleConfidenceSelect(2)} className="neuro-btn text-yellow-400 p-6 text-center">
                                    <div className="text-2xl font-bold mb-2">Medium</div>
                                    <div className="text-sm text-gray-400">Somewhat</div>
                                </button>
                                <button onClick={() => handleConfidenceSelect(3)} className="neuro-btn text-green-400 p-6 text-center">
                                    <div className="text-2xl font-bold mb-2">High</div>
                                    <div className="text-sm text-gray-400">Very confident</div>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Answer Selection */}
                {currentStep === 'answer' && currentQ && (
                    <>
                        <QuestionCard
                            question={{
                                id: currentQ.id,
                                topic_id: topicId || '',
                                question_text: currentQ.question_text,
                                question_format: currentQ.question_type as QuestionFormat,
                                options: currentQ.options || undefined,
                                correct_answer: currentQ.correct_answer,
                                bloom_level: currentQ.bloom_level,
                                explanation: currentQ.explanation || ''
                            }}
                            onAnswerChange={setUserAnswer}
                            disabled={submitting}
                        />
                        <button
                            onClick={handleAnswerSubmit}
                            disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)}
                            className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold disabled:opacity-50"
                        >
                            Submit Answer
                        </button>
                    </>
                )}

                {/* Recognition Method */}
                {currentStep === 'recognition' && currentQ && (
                    <div className="neuro-card p-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">How did you arrive at your answer?</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {getAvailableRecognitionMethods(currentQ.question_type as QuestionFormat).includes('memory') && (
                                <button onClick={() => handleRecognitionSelect('memory')} disabled={submitting} className="neuro-btn text-green-400 p-6 text-left disabled:opacity-50">
                                    <div className="text-lg font-bold mb-1">Recalled from Memory</div>
                                    <div className="text-sm text-gray-400">I remembered this</div>
                                </button>
                            )}
                            {getAvailableRecognitionMethods(currentQ.question_type as QuestionFormat).includes('recognition') && (
                                <button onClick={() => handleRecognitionSelect('recognition')} disabled={submitting} className="neuro-btn text-yellow-400 p-6 text-left disabled:opacity-50">
                                    <div className="text-lg font-bold mb-1">Recognized</div>
                                    <div className="text-sm text-gray-400">I recognized it when I saw it</div>
                                </button>
                            )}
                            {getAvailableRecognitionMethods(currentQ.question_type as QuestionFormat).includes('educated_guess') && (
                                <button onClick={() => handleRecognitionSelect('educated_guess')} disabled={submitting} className="neuro-btn text-yellow-400 p-6 text-left disabled:opacity-50">
                                    <div className="text-lg font-bold mb-1">Educated Guess</div>
                                    <div className="text-sm text-gray-400">Used logic to narrow down</div>
                                </button>
                            )}
                            {getAvailableRecognitionMethods(currentQ.question_type as QuestionFormat).includes('random_guess') && (
                                <button onClick={() => handleRecognitionSelect('random_guess')} disabled={submitting} className="neuro-btn text-red-400 p-6 text-left disabled:opacity-50">
                                    <div className="text-lg font-bold mb-1">Random Guess</div>
                                    <div className="text-sm text-gray-400">I had no idea</div>
                                </button>
                            )}
                        </div>
                        {submitting && (
                            <div className="mt-4 text-center">
                                <Loader2 className="animate-spin text-blue-400 mx-auto" size={24} />
                            </div>
                        )}
                    </div>
                )}

                {/* Results */}
                {currentStep === 'results' && currentQ && (
                    <>
                        <div className={`neuro-card p-6 border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                {isCorrect ? (
                                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <Check className="text-green-400" size={24} />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                        <X className="text-red-400" size={24} />
                                    </div>
                                )}
                                <h3 className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    {isCorrect ? 'Correct!' : 'Incorrect'}
                                </h3>
                            </div>

                            {!isCorrect && (
                                <div className="neuro-inset p-4 rounded-lg mb-4">
                                    <div className="text-sm text-gray-500 mb-1">Correct Answer:</div>
                                    <div className="text-green-400 font-medium">{currentQ.correct_answer}</div>
                                </div>
                            )}

                            {currentQ.explanation && (
                                <div className="neuro-inset p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 mb-1">Explanation:</div>
                                    <div className="text-gray-300">{currentQ.explanation}</div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleNextQuestion}
                            className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold"
                        >
                            {currentIndex + 1 >= questions.length ? 'View Results' : 'Next Question'}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
