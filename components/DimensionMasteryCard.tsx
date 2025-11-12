'use client'

import { Tooltip } from './Tooltip'
import { InfoIcon } from './icons'

interface DimensionMasteryCardProps {
  dimension: string
  mastery: number // Percentage (0-100) based on high-confidence correct
  rawAccuracy: number // Percentage (0-100) of all correct attempts
  highConfidenceCorrect: number
  highConfidenceTotal: number
  lowConfidenceCorrect: number
  wrongAnswers: number
  threshold?: number // Default 80% for unlock
  showStatus?: boolean
}

export function DimensionMasteryCard({
  dimension,
  mastery,
  rawAccuracy,
  highConfidenceCorrect,
  highConfidenceTotal,
  lowConfidenceCorrect,
  wrongAnswers,
  threshold = 80,
  showStatus = true
}: DimensionMasteryCardProps) {
  // Determine status
  const isQualified = mastery >= threshold
  const isClose = mastery >= threshold - 10 && mastery < threshold
  const isStruggling = mastery < 60

  // Status colors
  const masteryColor = isQualified
    ? 'text-green-400'
    : isClose
    ? 'text-yellow-400'
    : isStruggling
    ? 'text-red-400'
    : 'text-blue-400'

  // Progress bar color
  const barColor = isQualified
    ? 'bg-green-500'
    : isClose
    ? 'bg-yellow-500'
    : isStruggling
    ? 'bg-red-500'
    : 'bg-blue-500'

  // Tooltip content
  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold text-gray-200 border-b border-gray-700 pb-2">
        {dimension} Dimension Details
      </div>

      <div className="space-y-1">
        <div className="font-medium text-gray-300">
          Mastery: {mastery.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • High-confidence correct: {highConfidenceCorrect}
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • High-confidence attempts: {highConfidenceTotal}
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Good recognition memory
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-gray-700">
        <div className="font-medium text-gray-300">
          Raw Accuracy: {rawAccuracy.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • All attempts counted
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Includes low-confidence answers
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Breakdown:
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Confidence 4-5 correct: {highConfidenceCorrect} ✓
        </div>
        {lowConfidenceCorrect > 0 && (
          <div className="text-xs text-gray-400 pl-2">
            • Confidence 1-3 correct: {lowConfidenceCorrect} (practice)
          </div>
        )}
        {wrongAnswers > 0 && (
          <div className="text-xs text-gray-400 pl-2">
            • Wrong answers: {wrongAnswers}
          </div>
        )}
      </div>

      {mastery < rawAccuracy && (
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-blue-300">
            💡 You're getting questions right, but many with low confidence.
            Review this material to build stronger understanding!
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="neuro-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">{dimension}</h3>
        <Tooltip content={tooltipContent}>
          <div className="neuro-inset w-6 h-6 rounded-lg flex items-center justify-center">
            <InfoIcon size={14} className="text-gray-400" />
          </div>
        </Tooltip>
      </div>

      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-gray-500">Mastery</span>
          <span className={`text-xl font-bold ${masteryColor}`}>
            {mastery.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="neuro-inset h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.min(100, mastery)}%` }}
          />
        </div>

        <div className="text-xs text-gray-500 mt-1">
          {highConfidenceCorrect}/{highConfidenceTotal} high-confidence correct
        </div>
      </div>

      {showStatus && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          {isQualified && (
            <div className="text-xs text-green-400 flex items-center gap-1">
              <span>✓</span>
              <span>Above {threshold}%</span>
            </div>
          )}
          {isClose && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <span>⚠</span>
              <span>Need {(threshold - mastery).toFixed(0)}% more</span>
            </div>
          )}
          {isStruggling && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span>
              <span>Focus here! Below 60%</span>
            </div>
          )}
          {!isQualified && !isClose && !isStruggling && (
            <div className="text-xs text-blue-400 flex items-center gap-1">
              <span>Need {(threshold - mastery).toFixed(0)}% more</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
