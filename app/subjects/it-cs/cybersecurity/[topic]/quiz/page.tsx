/**
 * Topic Quiz Page
 * 
 * Quiz for a specific topic - cycles through all questions for that topic
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Check, X, Loader2, Square, Circle } from 'lucide-react'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { ConfidenceSlider } from '@/components/quiz/ConfidenceSlider'
import { RecognitionMethodSelector } from '@/components/quiz/RecognitionMethodSelector'
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
                // Map DB questions to TopicQuestion interface
                const mappedQuestions = topicQuestions.map(q => ({
                    id: q.id,
                    question_text: q.question_text,
                    question_type: q.question_format, // Map format to type
                    options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(JSON.stringify(q.options))) : null,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation || '',
                    bloom_level: q.bloom_level,
                    hierarchy: { topic: topic.name }, // Basic hierarchy since we only have topic
                    cognitive_dimension: q.cognitive_dimension
                }))

                // Shuffle questions for variety
                const shuffled = [...mappedQuestions].sort(() => Math.random() - 0.5)
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

            // Check if answer is correct (client-side check for immediate UI update if needed, but we rely on API mostly)
            let correct = false
            if (currentQ.question_type === 'true_false') {
                correct = userAnswer === currentQ.correct_answer
            } else if (currentQ.question_type === 'mcq_single' || currentQ.question_type === 'fill_blank') {
                correct = userAnswer === currentQ.correct_answer ||
                    (typeof userAnswer === 'string' && typeof currentQ.correct_answer === 'string' && userAnswer.includes(currentQ.correct_answer))
            } else if (currentQ.question_type === 'mcq_multi') {
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

            // Submit to API for tracking and detailed result
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
                    timeTaken: 30, // Approximate
                    topicId
                })
            })

            const data = await response.json()
            if (data.result) {
                setAnswerResult(data.result)
            }

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
            setAnswerResult(null)
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

    // Summary screen (Final Score)
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

    const currentQuestion = currentQ // Alias for compatibility with learn page code

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
                            <p className="text-sm text-gray-500 mb-2">Bloom Level {currentQ.bloom_level} ({BLOOM_LEVEL_NAMES[currentQ.bloom_level as BloomLevel]})</p>
                            <h2 className="text-xl font-semibold text-gray-200">
                                {currentQ.question_text}
                            </h2>
                        </div>

                        <div className="neuro-card p-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">How confident are you?</h3>
                            <ConfidenceSlider onSelect={handleConfidenceSelect} />
                        </div>
                    </>
                )}

                {/* Answer Selection */}
                {currentStep === 'answer' && currentQ && (
                    <QuestionCard
                        question={{
                            id: currentQ.id,
                            topic_id: topicId || '',
                            topic_name: topicName,
                            bloom_level: currentQ.bloom_level,
                            question_format: currentQ.question_type as QuestionFormat, // Cast as QuestionFormat
                            question_text: currentQ.question_text,
                            options: currentQ.options || [],
                            correct_answer: currentQ.correct_answer,
                            explanation: currentQ.explanation
                        }}
                        onAnswerChange={setUserAnswer}
                    />
                )}

                {/* Confirm Answer / Recognition */}
                {currentStep === 'answer' && userAnswer && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleAnswerSubmit}
                            className="neuro-btn text-blue-400 px-8 py-3 text-lg font-semibold"
                        >
                            Confirm Answer
                        </button>
                    </div>
                )}

                {/* Recognition Method Selection */}
                {currentStep === 'recognition' && currentQ && (
                    <>
                        <div className="neuro-card p-6 opacity-50 pointer-events-none">
                            <h2 className="text-xl font-semibold text-gray-200 mb-4">
                                {currentQ.question_text}
                            </h2>
                            <div className="text-gray-400">
                                Answer selected: <span className="text-white font-medium">{Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}</span>
                            </div>
                        </div>

                        <div className="neuro-card p-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">How did you arrive at your answer?</h3>
                            <RecognitionMethodSelector
                                methods={getAvailableRecognitionMethods(currentQ.question_type as QuestionFormat)}
                                onSelect={handleRecognitionSelect}
                                disabled={submitting}
                            />
                            {submitting && (
                                <div className="mt-4 text-center">
                                    <Loader2 className="animate-spin text-blue-400 mx-auto" size={24} />
                                    <p className="text-gray-400 text-sm mt-2">Submitting your answer...</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Step 4: Results with all sections (Adapted from learn/page.tsx) */}
                {currentStep === 'results' && answerResult && recognitionMethod && currentQuestion && (
                    <>
                        {/* Section 1: Question and Options with Results */}
                        <div className="neuro-card p-6">
                            <h2 className="text-xl font-semibold text-gray-200 mb-6">
                                {currentQuestion.question_text}
                            </h2>

                            {/* Answer Options with Result */}
                            {(currentQuestion.question_type === 'mcq_single' || currentQuestion.question_type === 'mcq_multi' || currentQuestion.question_type === 'fill_blank') && currentQuestion.options && (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, idx) => {
                                        const optionLetter = String.fromCharCode(65 + idx) // A, B, C, D...
                                        // For fill_blank, don't add letter prefix
                                        const optionWithLetter = currentQuestion.question_type === 'fill_blank'
                                            ? option
                                            : `${optionLetter}. ${option}`

                                        const isUserAnswer = Array.isArray(userAnswer)
                                            ? userAnswer.includes(optionWithLetter)
                                            : userAnswer === optionWithLetter

                                        // Convert letter-based correct answers (A, B, C) to actual option text
                                        let correctOptionText = answerResult.correctAnswer

                                        // Handle array of letters for mcq_multi (e.g., ["A", "B", "C"])
                                        if (Array.isArray(correctOptionText) && currentQuestion.options) {
                                            correctOptionText = correctOptionText.map(ans => {
                                                if (typeof ans === 'string' && ans.length === 1 && /^[A-Z]$/.test(ans)) {
                                                    const idx = ans.charCodeAt(0) - 65
                                                    return currentQuestion.options![idx]
                                                }
                                                return ans
                                            })
                                        } else if (typeof correctOptionText === 'string' && correctOptionText.length === 1 && /^[A-Z]$/.test(correctOptionText) && currentQuestion.options) {
                                            // Single letter (A, B, C, D), convert to index
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
                                                        {currentQuestion.question_type === 'mcq_multi' ? (
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

                            {/* True/False Answer with Result */}
                            {currentQuestion.question_type === 'true_false' && (
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

                            {/* Open Ended Answer with Result */}
                            {currentQuestion.question_type === 'open_ended' && (
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
                                                {/* Handle array or string correct answer */}
                                                {Array.isArray(answerResult.correctAnswer)
                                                    ? answerResult.correctAnswer.join(', ')
                                                    : answerResult.correctAnswer}
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

                            <div className="prose prose-invert max-w-none space-y-4">
                                {(() => {
                                    const explanation = answerResult.explanation

                                    // Check if explanation is structured (object) or string
                                    if (typeof explanation === 'object' && explanation !== null) {
                                        // Helper to convert answer to letter (handles both letter and text formats)
                                        const answerToLetter = (answer: string | string[] | undefined, options: string[] | null | undefined): string => {
                                            if (!answer) return ''

                                            // Handle array (mcq_multi)
                                            const singleAnswer = Array.isArray(answer) ? answer[0] : answer
                                            if (!singleAnswer) return ''

                                            // If it's already a single letter A-Z, return it
                                            if (singleAnswer.length === 1 && singleAnswer >= 'A' && singleAnswer <= 'Z') {
                                                return singleAnswer
                                            }

                                            // Otherwise it's text (fill_blank) - find its index in options
                                            if (options) {
                                                const idx = options.findIndex(opt => opt === singleAnswer)
                                                if (idx !== -1) {
                                                    return String.fromCharCode(65 + idx) // Convert 0->A, 1->B, etc.
                                                }
                                            }

                                            return ''
                                        }

                                        // Get correct answer letter
                                        const correctLetter = answerToLetter(answerResult.correctAnswer, currentQuestion?.options)

                                        // Get user's answer letter
                                        const userLetter = answerToLetter(userAnswer, currentQuestion?.options)

                                        // Build ordered list of option letters
                                        const allLetters = Object.keys(explanation).sort()
                                        const orderedLetters: string[] = []

                                        // 1. Correct answer first
                                        if (correctLetter && explanation[correctLetter as keyof typeof explanation]) {
                                            orderedLetters.push(correctLetter)
                                        }

                                        // 2. User's choice second (if wrong and different from correct)
                                        if (userLetter && userLetter !== correctLetter && explanation[userLetter as keyof typeof explanation]) {
                                            orderedLetters.push(userLetter)
                                        }

                                        // 3. Remaining letters in alphabetical order
                                        allLetters.forEach(letter => {
                                            if (!orderedLetters.includes(letter)) {
                                                orderedLetters.push(letter)
                                            }
                                        })

                                        return orderedLetters.map((letter, idx) => {
                                            const isCorrect = letter === correctLetter
                                            const isUserChoice = letter === userLetter
                                            const text = explanation[letter as keyof typeof explanation]

                                            return (
                                                <div key={letter} className={`p-3 rounded-lg ${isCorrect
                                                    ? 'bg-green-500/10 border border-green-500/20'
                                                    : isUserChoice
                                                        ? 'bg-red-500/10 border border-red-500/20'
                                                        : 'bg-gray-800/30'
                                                    }`}>
                                                    {(isCorrect || isUserChoice) && (
                                                        <span className={`text-sm font-medium block mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'
                                                            }`}>
                                                            {isCorrect ? 'Correct Answer' : 'Your Answer'}
                                                        </span>
                                                    )}
                                                    <p className="text-gray-300 leading-relaxed">{text}</p>
                                                </div>
                                            )
                                        })
                                    } else {
                                        // Fallback for string format (backwards compatibility)
                                        return <p className="text-gray-300 leading-relaxed whitespace-pre-line">{explanation}</p>
                                    }
                                })()}
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

                        {/* Section 4: Your Performance (Summary) */}
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
                                            {currentQuestion.question_type === 'true_false' ? 'True/False' :
                                                currentQuestion.question_type === 'mcq_single' ? 'Multiple Choice' :
                                                    currentQuestion.question_type === 'mcq_multi' ? 'Multiple Select' :
                                                        currentQuestion.question_type === 'fill_blank' ? 'Fill in the Blank' :
                                                            currentQuestion.question_type === 'open_ended' ? 'Open Ended' : 'Question'}
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
                                        {(() => {
                                            const normalized = normalizeCalibration(answerResult.calibrationScore)
                                            return (
                                                <span className={`font-semibold text-sm ${normalized >= 0.67 ? 'text-green-400' :
                                                    normalized >= 0.33 ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {normalized.toFixed(2)}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                    {answerResult.nextReviewDate && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-white text-sm font-semibold">Next Review:</span>
                                            <span className="font-semibold text-sm text-gray-400">
                                                {formatTimeUntilReview(new Date(answerResult.nextReviewDate))}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleNextQuestion}
                                className="neuro-btn text-blue-400 px-8 py-3 text-lg font-semibold"
                            >
                                {currentIndex + 1 >= questions.length ? 'Finish Quiz' : 'Next Question'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
