/**
 * AnswerFeedback Component
 *
 * Shows feedback after answering a question (correct/incorrect, explanation, stats)
 */

'use client'

import { CheckCircle2, XCircle, BookOpen, TrendingUp, Brain, Eye, Lightbulb, Shuffle } from 'lucide-react'
import { AnswerResult, RecognitionMethod } from '@/lib/types/quiz'

interface AnswerFeedbackProps {
  result: AnswerResult
  userAnswer: string | string[]
  confidence: number
  recognitionMethod: RecognitionMethod
  onContinue: () => void
  showNextButton?: boolean
}

const recognitionMethodInfo = {
  memory: { label: 'Recalled from Memory', icon: Brain, color: 'text-purple-400' },
  recognition: { label: 'Recognized from Options', icon: Eye, color: 'text-blue-400' },
  educated_guess: { label: 'Made an Educated Guess', icon: Lightbulb, color: 'text-yellow-400' },
  random_guess: { label: 'Made a Random Guess', icon: Shuffle, color: 'text-red-400' }
}

export function AnswerFeedback({
  result,
  userAnswer,
  confidence,
  recognitionMethod,
  onContinue,
  showNextButton = true
}: AnswerFeedbackProps) {
  const confidenceLabel = ['Low', 'Medium', 'High'][confidence - 1]
  const isWellCalibrated = (result.isCorrect && confidence === 3) || (!result.isCorrect && confidence === 1)

  const methodInfo = recognitionMethodInfo[recognitionMethod]
  const MethodIcon = methodInfo.icon

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
                  {confidenceLabel} ({confidence}/3)
                </span>
                {isWellCalibrated && (
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
                    Well calibrated!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500">How you answered:</span>
                <div className="flex items-center gap-2">
                  <MethodIcon size={16} className={methodInfo.color} />
                  <span className={`font-medium ${methodInfo.color}`}>
                    {methodInfo.label}
                  </span>
                </div>
              </div>

              {result.reward !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">RL Reward:</span>
                  <span className={`font-bold ${result.reward > 0 ? 'text-green-400' : result.reward < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {result.reward > 0 ? '+' : ''}{result.reward.toFixed(2)}
                  </span>
                </div>
              )}
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
      <div className="neuro-inset p-4 rounded-lg border-l-4 border-blue-400">
        <div className="flex items-start gap-3">
          <TrendingUp size={20} className="text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h5 className="text-sm font-semibold text-blue-400 mb-2">Calibration Analysis</h5>
            <p className="text-sm text-gray-400 mb-2">
              {getCalibrationMessage(result.isCorrect, confidence, recognitionMethod)}
            </p>
            <div className="text-xs text-gray-500 mt-2">
              <strong>Why this matters:</strong> Self-awareness about how you arrive at answers helps you learn more effectively.
            </div>
          </div>
        </div>
      </div>

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

function getCalibrationMessage(
  isCorrect: boolean,
  confidence: number,
  recognitionMethod: RecognitionMethod
): string {
  // Perfect calibration messages
  if (isCorrect && confidence === 3 && recognitionMethod === 'memory') {
    return "🎯 Perfect! High confidence with memory recall - this shows strong mastery."
  }
  if (isCorrect && confidence === 2 && recognitionMethod === 'recognition') {
    return "✅ Good calibration! Medium confidence with recognition is appropriate."
  }
  if (isCorrect && confidence === 1 && recognitionMethod === 'random_guess') {
    return "👍 Excellent self-awareness! Low confidence on a lucky guess shows good calibration."
  }

  // Underconfidence
  if (isCorrect && confidence === 1 && recognitionMethod === 'memory') {
    return "💡 You recalled it from memory but lacked confidence - trust your knowledge more!"
  }
  if (isCorrect && confidence === 1 && recognitionMethod === 'recognition') {
    return "💭 You recognized the answer but weren't confident - build more trust in your recognition skills."
  }

  // Overconfidence
  if (!isCorrect && confidence === 3 && recognitionMethod === 'memory') {
    return "⚠️ High confidence with false memory - this is a common pitfall. Double-check your recall."
  }
  if (!isCorrect && confidence === 3 && recognitionMethod === 'random_guess') {
    return "🤔 High confidence on a random guess that failed - be more honest about uncertainty."
  }

  // Good calibration on wrong answers
  if (!isCorrect && confidence === 1 && recognitionMethod === 'educated_guess') {
    return "✓ Good self-awareness! You knew your logic was uncertain and were appropriately cautious."
  }
  if (!isCorrect && confidence === 1 && recognitionMethod === 'random_guess') {
    return "✓ Excellent calibration! Low confidence on a random guess shows strong metacognition."
  }

  // Moderate confidence scenarios
  if (isCorrect && confidence === 2 && recognitionMethod === 'educated_guess') {
    return "👌 Reasonable calibration! Medium confidence on educated reasoning that worked."
  }
  if (!isCorrect && confidence === 2 && recognitionMethod === 'educated_guess') {
    return "📊 Fair calibration. Your reasoning didn't work this time, but moderate confidence was appropriate."
  }

  // Lucky guesses
  if (isCorrect && recognitionMethod === 'random_guess') {
    return "🍀 Lucky! But random guessing isn't a learning strategy - focus on understanding concepts."
  }
  if (isCorrect && recognitionMethod === 'educated_guess' && confidence === 3) {
    return "⚖️ Be cautious! High confidence on an educated guess can be overconfident."
  }

  // Default
  return isCorrect
    ? "You got it right! Consider how your confidence aligns with your recognition method."
    : "Keep learning! Reflect on how your confidence matched your certainty level."
}
