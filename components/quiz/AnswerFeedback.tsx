/**
 * AnswerFeedback Component
 *
 * Shows feedback after answering a question (correct/incorrect, explanation, stats)
 */

'use client'

import { CheckCircle2, XCircle, BookOpen, TrendingUp } from 'lucide-react'
import { AnswerResult } from '@/lib/types/quiz'

interface AnswerFeedbackProps {
  result: AnswerResult
  userAnswer: string | string[]
  confidence: number
  onContinue: () => void
  showNextButton?: boolean
}

export function AnswerFeedback({
  result,
  userAnswer,
  confidence,
  onContinue,
  showNextButton = true
}: AnswerFeedbackProps) {
  const confidenceLabel = ['Guessing', 'Unsure', 'Moderate', 'Confident', 'Certain'][confidence - 1]
  const isWellCalibrated = (result.isCorrect && confidence >= 4) || (!result.isCorrect && confidence <= 2)

  return (
    <div className="space-y-4">
      {/* Result Banner */}
      <div className={`
        neuro-card p-6 border-2
        ${result.isCorrect ? 'border-green-400' : 'border-red-400'}
      `}>
        <div className="flex items-start gap-4">
          {result.isCorrect ? (
            <CheckCircle2 size={32} className="text-green-400 flex-shrink-0 mt-1" />
          ) : (
            <XCircle size={32} className="text-red-400 flex-shrink-0 mt-1" />
          )}

          <div className="flex-1">
            <h3 className={`text-2xl font-bold mb-2 ${result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {result.isCorrect ? 'Correct!' : 'Not Quite'}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Your answer:</span>
                <span className={`font-medium ${result.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {formatAnswer(userAnswer)}
                </span>
              </div>

              {!result.isCorrect && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Correct answer:</span>
                  <span className="font-medium text-green-400">
                    {formatAnswer(result.correctAnswer)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-500">Your confidence:</span>
                <span className={`font-medium ${
                  isWellCalibrated ? 'text-blue-400' : 'text-yellow-400'
                }`}>
                  {confidenceLabel} ({confidence}/5)
                </span>
                {isWellCalibrated && (
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
                    Well calibrated!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {result.explanation && (
        <div className="neuro-card p-6">
          <div className="flex items-start gap-3 mb-3">
            <BookOpen size={20} className="text-blue-400 flex-shrink-0 mt-1" />
            <h4 className="text-lg font-semibold text-gray-200">Explanation</h4>
          </div>
          <p className="text-gray-400 leading-relaxed">
            {result.explanation}
          </p>
        </div>
      )}

      {/* Calibration Feedback */}
      {!isWellCalibrated && (
        <div className="neuro-inset p-4 rounded-lg border-l-4 border-yellow-400">
          <div className="flex items-start gap-3">
            <TrendingUp size={20} className="text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h5 className="text-sm font-semibold text-yellow-400 mb-1">Calibration Tip</h5>
              <p className="text-sm text-gray-500">
                {result.isCorrect && confidence <= 2 ? (
                  "You got it right but weren't confident! Trust your knowledge more."
                ) : (
                  "You were confident but got it wrong. Be more cautious when uncertain."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Session Stats (if provided) */}
      {result.sessionStats && (
        <div className="neuro-card p-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-4">Session Progress</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round((result.sessionStats.score / result.sessionStats.totalQuestions) * 100)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {result.sessionStats.averageConfidence.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {result.sessionStats.averageTime.toFixed(0)}s
              </div>
              <div className="text-xs text-gray-500 mt-1">Avg Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {showNextButton && (
        <button
          onClick={onContinue}
          className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold"
        >
          {result.sessionComplete ? 'View Results' : 'Next Question →'}
        </button>
      )}
    </div>
  )
}

function formatAnswer(answer: string | string[]): string {
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  return answer
}
