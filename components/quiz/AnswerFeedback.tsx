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
  topicName?: string
  bloomLevel?: number
  selectionReason?: string
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
  showNextButton = true,
  topicName,
  bloomLevel,
  selectionReason
}: AnswerFeedbackProps) {
  const confidenceLabel = ['Low', 'Medium', 'High'][confidence - 1]
  const isWellCalibrated = (result.isCorrect && confidence === 3) || (!result.isCorrect && confidence === 1)

  const methodInfo = recognitionMethodInfo[recognitionMethod]
  const MethodIcon = methodInfo.icon

  const bloomLevelNames: Record<number, string> = {
    1: 'Remember',
    2: 'Understand',
    3: 'Apply',
    4: 'Analyze',
    5: 'Evaluate',
    6: 'Create'
  }

  return (
    <div className="space-y-4">
      {/* Topic Reveal (if RL-driven) */}
      {topicName && bloomLevel && (
        <div className="neuro-card p-6 border-l-4 border-purple-400">
          <div className="flex items-start gap-3">
            <BookOpen size={20} className="text-purple-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-purple-400 mb-2">Question Topic Revealed</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Topic:</span>
                  <span className="font-medium text-gray-200">{topicName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Bloom Level:</span>
                  <span className="font-medium text-gray-200">
                    {bloomLevel} - {bloomLevelNames[bloomLevel]}
                  </span>
                </div>
                {selectionReason && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-800/50 rounded p-2">
                    <strong className="text-blue-400">Why this topic?</strong> {selectionReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

              {result.calibrationScore !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Calibration Score:</span>
                  <span
                    className={`font-bold ${result.calibrationScore > 0 ? 'text-green-400' : result.calibrationScore < 0 ? 'text-red-400' : 'text-gray-400'}`}
                    title="How well your confidence matched your performance (-1.5 to +1.5)"
                  >
                    {result.calibrationScore > 0 ? '+' : ''}{result.calibrationScore.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-600">
                    (TRACK 1: RL metric)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Score Explanation Card */}
      {result.calibrationScore !== undefined && (
        <div className="neuro-card p-6 border-l-4 border-blue-400">
          <div className="flex items-start gap-3 mb-3">
            <TrendingUp size={20} className="text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">
                Calibration Score: {result.calibrationScore > 0 ? '+' : ''}{result.calibrationScore.toFixed(2)}
              </h4>
              <p className="text-sm text-gray-400 mb-3">
                This measures how well your confidence matched your actual performance.
              </p>

              {/* Visual scale */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Poor</span>
                  <span>Perfect</span>
                </div>
                <div className="neuro-inset rounded-full h-3 overflow-hidden relative">
                  <div
                    className={`absolute h-full transition-all ${
                      result.calibrationScore > 0 ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{
                      left: '50%',
                      width: `${Math.abs(result.calibrationScore) * 33.33}%`,
                      transformOrigin: result.calibrationScore > 0 ? 'left' : 'right'
                    }}
                  />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                  <span>-1.5</span>
                  <span>0</span>
                  <span>+1.5</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <strong>What this means:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>
                    <strong className="text-green-400">Positive (+):</strong> Good calibration - your confidence matched your performance
                  </li>
                  <li>
                    <strong className="text-red-400">Negative (-):</strong> Poor calibration - overconfident when wrong or underconfident when right
                  </li>
                  <li>
                    <strong>Magnitude:</strong> Higher absolute value = stronger calibration quality (good or bad)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

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
