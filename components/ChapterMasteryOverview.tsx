'use client'

import { Tooltip } from './Tooltip'
import { InfoIcon } from './icons'

interface DimensionStats {
  dimension: string
  mastery: number
  rawAccuracy: number
  highConfidenceCorrect: number
  highConfidenceTotal: number
  lowConfidenceCorrect: number
  wrongAnswers: number
}

interface ChapterMasteryOverviewProps {
  topicName: string
  bloomLevel: number
  dimensions: DimensionStats[]
  unlockThreshold?: number
}

export function ChapterMasteryOverview({
  topicName,
  bloomLevel,
  dimensions,
  unlockThreshold = 80
}: ChapterMasteryOverviewProps) {
  // Calculate overall mastery (average across dimensions)
  const overallMastery =
    dimensions.reduce((sum, d) => sum + d.mastery, 0) / dimensions.length

  // Calculate overall raw accuracy
  const totalCorrect = dimensions.reduce(
    (sum, d) => sum + d.highConfidenceCorrect + d.lowConfidenceCorrect,
    0
  )
  const totalAttempts = dimensions.reduce(
    (sum, d) =>
      sum +
      d.highConfidenceTotal +
      d.lowConfidenceCorrect +
      d.wrongAnswers,
    0
  )
  const overallRawAccuracy =
    totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0

  // Check if ready to unlock
  const canUnlock = overallMastery >= unlockThreshold
  const progressToUnlock = (overallMastery / unlockThreshold) * 100

  // Count dimensions by status
  const qualifiedDimensions = dimensions.filter(
    (d) => d.mastery >= unlockThreshold
  ).length
  const strugglingDimensions = dimensions.filter((d) => d.mastery < 60).length

  // Overall tooltip
  const overallTooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold text-gray-200 border-b border-gray-700 pb-2">
        Overall Performance
      </div>

      <div className="space-y-1">
        <div className="font-medium text-gray-300">
          Mastery: {overallMastery.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Average across all dimensions
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Based on high-confidence correct answers
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Needs {unlockThreshold}% to unlock L{bloomLevel + 1}
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-gray-700">
        <div className="font-medium text-gray-300">
          Raw Accuracy: {overallRawAccuracy.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • {totalCorrect}/{totalAttempts} total correct
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Includes all confidence levels
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • Shows your overall effort
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Dimension Status:
        </div>
        <div className="text-xs text-gray-400 pl-2">
          • {qualifiedDimensions}/{dimensions.length} above {unlockThreshold}%
        </div>
        {strugglingDimensions > 0 && (
          <div className="text-xs text-gray-400 pl-2">
            • {strugglingDimensions} below 60% (focus needed)
          </div>
        )}
      </div>

      {canUnlock ? (
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-green-300">
            🎉 Ready to unlock Bloom Level {bloomLevel + 1}!
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-blue-300">
            💡 Keep going! Focus on{' '}
            {strugglingDimensions > 0 ? 'struggling' : 'weaker'} dimensions to
            reach {unlockThreshold}%.
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="neuro-raised">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-gray-200">
              {topicName}
            </h2>
            <span className="text-sm text-gray-500">(L{bloomLevel})</span>
          </div>
          <p className="text-sm text-gray-400">
            {canUnlock
              ? `Ready to unlock L${bloomLevel + 1}!`
              : `${(unlockThreshold - overallMastery).toFixed(0)}% away from unlocking L${bloomLevel + 1}`}
          </p>
        </div>
        <Tooltip content={overallTooltipContent}>
          <div className="neuro-inset w-8 h-8 rounded-lg flex items-center justify-center">
            <InfoIcon size={16} className="text-gray-400" />
          </div>
        </Tooltip>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Mastery</span>
          <span
            className={`text-3xl font-bold ${
              canUnlock
                ? 'text-green-400'
                : overallMastery >= unlockThreshold - 10
                ? 'text-yellow-400'
                : 'text-blue-400'
            }`}
          >
            {overallMastery.toFixed(0)}%
          </span>
          <span className="text-sm text-gray-500">/ {unlockThreshold}%</span>
        </div>

        {/* Progress bar */}
        <div className="neuro-inset h-3 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              canUnlock
                ? 'bg-green-500'
                : overallMastery >= unlockThreshold - 10
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, progressToUnlock)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            {qualifiedDimensions}/{dimensions.length} dimensions ≥{' '}
            {unlockThreshold}%
          </span>
          {strugglingDimensions > 0 && (
            <span className="text-red-400">
              {strugglingDimensions} below 60%
            </span>
          )}
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Dimension Breakdown
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {dimensions.map((dim) => (
            <DimensionRow
              key={dim.dimension}
              {...dim}
              threshold={unlockThreshold}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Compact dimension row for overview
function DimensionRow({
  dimension,
  mastery,
  rawAccuracy,
  highConfidenceCorrect,
  highConfidenceTotal,
  lowConfidenceCorrect,
  wrongAnswers,
  threshold
}: DimensionStats & { threshold: number }) {
  const isQualified = mastery >= threshold
  const isStruggling = mastery < 60

  const barColor = isQualified
    ? 'bg-green-500'
    : isStruggling
    ? 'bg-red-500'
    : 'bg-blue-500'

  const masteryColor = isQualified
    ? 'text-green-400'
    : isStruggling
    ? 'text-red-400'
    : 'text-gray-300'

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold text-gray-200">{dimension}</div>
      <div className="space-y-1 text-xs">
        <div>Mastery: {mastery.toFixed(0)}%</div>
        <div>Raw Accuracy: {rawAccuracy.toFixed(0)}%</div>
        <div className="pt-1 border-t border-gray-700">
          • High-conf correct: {highConfidenceCorrect}
        </div>
        {lowConfidenceCorrect > 0 && (
          <div>• Low-conf correct: {lowConfidenceCorrect}</div>
        )}
        {wrongAnswers > 0 && <div>• Wrong: {wrongAnswers}</div>}
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-3 p-2 neuro-inset rounded-lg hover:bg-gray-900/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300 truncate">{dimension}</span>
          <Tooltip content={tooltipContent}>
            <div className="flex items-center gap-2 ml-2">
              <span className={`text-sm font-semibold ${masteryColor}`}>
                {mastery.toFixed(0)}%
              </span>
              <InfoIcon size={12} className="text-gray-500" />
            </div>
          </Tooltip>
        </div>
        <div className="neuro-inset h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.min(100, mastery)}%` }}
          />
        </div>
      </div>
      {isQualified && (
        <span className="text-green-400 text-xs">✓</span>
      )}
      {isStruggling && (
        <span className="text-red-400 text-xs">⚠</span>
      )}
    </div>
  )
}
