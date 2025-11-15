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

  return (
    <div className="neuro-card p-6 space-y-6">
      {/* Question Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
            Bloom Level {question.bloom_level}
          </span>
          <span className="text-xs font-medium text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
            {formatQuestionType(question.question_format)}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-200">
          {question.question_text}
        </h2>
      </div>

      {/* Answer Input */}
      <div className="space-y-3">
        {/* MCQ (Single or Multiple) */}
        {(question.question_format === 'mcq_single' || question.question_format === 'mcq_multi') && question.options && (
          <div className="space-y-2">
            {question.question_format === 'mcq_multi' && (
              <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
            )}
            {question.options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleMultipleChoice(option)}
                disabled={disabled}
                className={`
                  w-full text-left p-4 rounded-lg transition-all
                  ${isOptionSelected(option)
                    ? 'neuro-raised border-2 border-blue-400 text-blue-400'
                    : 'neuro-inset text-gray-300 hover:border-blue-400/30 border-2 border-transparent'
                  }
                  ${showCorrectAnswer && isCorrectOption(option)
                    ? 'border-green-400 text-green-400'
                    : ''
                  }
                  ${showCorrectAnswer && isOptionSelected(option) && !isCorrectOption(option)
                    ? 'border-red-400 text-red-400'
                    : ''
                  }
                  ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  {question.question_format === 'mcq_multi' ? (
                    <Square
                      size={20}
                      className={isOptionSelected(option) ? 'fill-current' : ''}
                    />
                  ) : (
                    <Circle
                      size={20}
                      className={isOptionSelected(option) ? 'fill-current' : ''}
                    />
                  )}
                  <span>{option}</span>
                  {showCorrectAnswer && isCorrectOption(option) && (
                    <CheckCircle2 size={20} className="ml-auto text-green-400" />
                  )}
                </div>
              </button>
            ))}
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
                  flex-1 p-4 rounded-lg transition-all
                  ${answer === option
                    ? 'neuro-raised border-2 border-blue-400 text-blue-400'
                    : 'neuro-inset text-gray-300 hover:border-blue-400/30 border-2 border-transparent'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Fill in the Blank / Open Ended */}
        {(question.question_format === 'fill_blank' || question.question_format === 'open_ended') && (
          <div>
            {question.question_format === 'open_ended' ? (
              <textarea
                value={answer as string}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={disabled}
                placeholder="Type your answer here..."
                rows={6}
                className="neuro-input w-full"
              />
            ) : (
              <input
                type="text"
                value={answer as string}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={disabled}
                placeholder="Type your answer..."
                className="neuro-input w-full"
              />
            )}
            {showCorrectAnswer && (
              <div className="mt-3 p-3 neuro-inset rounded-lg">
                <span className="text-sm text-gray-500">Correct answer: </span>
                <span className="text-green-400 font-medium">{question.correct_answer}</span>
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
