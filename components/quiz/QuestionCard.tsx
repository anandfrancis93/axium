/**
 * QuestionCard Component
 *
 * Displays a question with appropriate input based on question format
 */

'use client'

import { useState, useEffect } from 'react'
import { QuizQuestion, QuestionFormat } from '@/lib/types/quiz'
import { CheckCircle2, Circle, Square } from 'lucide-react'

interface QuestionCardProps {
  question: QuizQuestion
  onAnswerChange: (answer: string | string[]) => void
  disabled?: boolean
  showCorrectAnswer?: boolean
}

export function QuestionCard({
  question,
  onAnswerChange,
  disabled = false,
  showCorrectAnswer = false
}: QuestionCardProps) {
  const [answer, setAnswer] = useState<string | string[]>('')
  const [multipleAnswers, setMultipleAnswers] = useState<string[]>([])

  // Reset when question changes
  useEffect(() => {
    setAnswer('')
    setMultipleAnswers([])
  }, [question.id])

  const handleAnswerChange = (value: string | string[]) => {
    setAnswer(value)
    onAnswerChange(value)
  }

  const handleMultipleChoice = (option: string) => {
    if (disabled) return

    if (question.question_format === 'mcq_multi') {
      // Multiple selection
      const newAnswers = multipleAnswers.includes(option)
        ? multipleAnswers.filter(a => a !== option)
        : [...multipleAnswers, option]
      setMultipleAnswers(newAnswers)
      handleAnswerChange(newAnswers)
    } else {
      // Single selection
      handleAnswerChange(option)
    }
  }

  const isOptionSelected = (option: string) => {
    if (question.question_format === 'mcq_multi') {
      return multipleAnswers.includes(option)
    }
    return answer === option
  }

  const isCorrectOption = (option: string) => {
    if (!showCorrectAnswer) return false
    if (Array.isArray(question.correct_answer)) {
      return question.correct_answer.includes(option)
    }
    return question.correct_answer === option
  }

  // Capitalize first letter for better readability
  const capitalizeFirst = (str: string) => {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  return (
    <div className="neuro-card p-6 space-y-6">
      {/* Question Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-200">
          {question.question_text}
        </h2>
      </div>

      {/* Answer Input */}
      <div className="space-y-3">
        {/* MCQ (Single or Multiple) and Fill in the Blank */}
        {(question.question_format === 'mcq_single' || question.question_format === 'mcq_multi' || question.question_format === 'fill_blank') && question.options && (
          <div className="space-y-2">
            {question.question_format === 'mcq_multi' && (
              <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
            )}
            {question.question_format === 'fill_blank' && (
              <p className="text-sm text-gray-500 mb-3">Select the correct word or phrase to complete the sentence</p>
            )}
            {question.options.map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx) // A, B, C, D...
              // Only add letter prefix for MCQ questions, not for fill_blank
              const submissionValue = question.question_format === 'fill_blank'
                ? option
                : `${optionLetter}. ${option}`

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleMultipleChoice(submissionValue)}
                  disabled={disabled}
                  className={`
                    w-full text-left transition-all
                    ${isOptionSelected(submissionValue)
                      ? 'neuro-raised text-blue-400'
                      : 'neuro-inset text-gray-300'
                    }
                    ${showCorrectAnswer && isCorrectOption(option)
                      ? 'text-green-400'
                      : ''
                    }
                    ${showCorrectAnswer && isOptionSelected(submissionValue) && !isCorrectOption(option)
                      ? 'text-red-400'
                      : ''
                    }
                    ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {question.question_format === 'mcq_multi' ? (
                      <Square
                        size={20}
                        className={isOptionSelected(submissionValue) ? 'fill-current' : ''}
                      />
                    ) : (
                      <Circle
                        size={20}
                        className={isOptionSelected(submissionValue) ? 'fill-current' : ''}
                      />
                    )}
                    <span>{capitalizeFirst(option)}</span>
                    {showCorrectAnswer && isCorrectOption(option) && (
                      <CheckCircle2 size={20} className="ml-auto text-green-400" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* True/False */}
        {question.question_format === 'true_false' && (
          <div className="flex gap-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswerChange(option)}
                disabled={disabled}
                className={`
                  flex-1 transition-all
                  ${answer === option
                    ? 'neuro-raised text-blue-400'
                    : 'neuro-inset text-gray-300'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Open Ended (essay-style answer) */}
        {question.question_format === 'open_ended' && (
          <div>
            <textarea
              value={answer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer here..."
              rows={6}
              className="neuro-input w-full"
            />
            {showCorrectAnswer && (
              <div className="mt-3 p-3 neuro-inset rounded-lg">
                <span className="text-sm text-gray-500">Correct answer: </span>
                <span className="text-green-400 font-medium">
                  {capitalizeFirst(question.correct_answer as string)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Matching (simplified - TODO: enhance) */}
        {question.question_format === 'matching' && (
          <div className="p-4 neuro-inset rounded-lg text-center text-gray-500">
            <p>Matching questions coming soon!</p>
            <p className="text-sm mt-2">For now, please describe your matches below:</p>
            <textarea
              value={answer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={disabled}
              placeholder="Example: A-1, B-2, C-3"
              rows={4}
              className="neuro-input w-full mt-3"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function formatQuestionType(format: QuestionFormat): string {
  const types: Record<QuestionFormat, string> = {
    true_false: 'True/False',
    mcq_single: 'Multiple Choice',
    mcq_multi: 'Multiple Select',
    fill_blank: 'Fill in the Blank',
    matching: 'Matching',
    open_ended: 'Open Ended'
  }
  return types[format] || format
}
