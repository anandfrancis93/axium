'use client'

import { Tooltip } from './Tooltip'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

interface DifficultyInfo {
  level: DifficultyLevel
  label: string
  color: string
  icon: string
  description: string
}

/**
 * Get difficulty info for a score (1-10 scale)
 */
export function getDifficultyInfo(score: number | null | undefined): DifficultyInfo {
  const normalizedScore = score ?? 5 // Default to medium if null/undefined

  if (normalizedScore <= 3) {
    return {
      level: 'beginner',
      label: 'Beginner',
      color: 'text-green-400',
      icon: '◐',
      description: 'Introductory concepts, minimal prerequisites'
    }
  } else if (normalizedScore <= 6) {
    return {
      level: 'intermediate',
      label: 'Intermediate',
      color: 'text-yellow-400',
      icon: '◑',
      description: 'Builds on foundational knowledge'
    }
  } else {
    return {
      level: 'advanced',
      label: 'Advanced',
      color: 'text-red-400',
      icon: '●',
      description: 'Complex concepts, multiple prerequisites'
    }
  }
}

interface DifficultyBadgeProps {
  score: number | null | undefined
  showIcon?: boolean
  showScore?: boolean
  showLabel?: boolean
  className?: string
}

/**
 * Display difficulty badge with icon and/or label
 *
 * Usage:
 * <DifficultyBadge score={7} showIcon showLabel />
 */
export function DifficultyBadge({
  score,
  showIcon = true,
  showScore = false,
  showLabel = true,
  className = ''
}: DifficultyBadgeProps) {
  const info = getDifficultyInfo(score)
  const normalizedScore = score ?? 5

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && (
        <span className={`text-lg ${info.color}`}>
          {info.icon}
        </span>
      )}
      <div>
        <div className={`font-medium text-sm ${info.color}`}>
          {showLabel && info.label}
          {showScore && (showLabel ? ` (${normalizedScore}/10)` : `${normalizedScore}/10`)}
        </div>
      </div>
    </div>
  )
}

interface DifficultyIndicatorProps {
  score: number | null | undefined
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Display difficulty indicator with tooltip
 *
 * Usage:
 * <DifficultyIndicator score={7} showDescription />
 */
export function DifficultyIndicator({
  score,
  showDescription = false,
  size = 'md'
}: DifficultyIndicatorProps) {
  const info = getDifficultyInfo(score)
  const normalizedScore = score ?? 5

  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-2',
    lg: 'px-4 py-3'
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold text-gray-200">
        Difficulty: {normalizedScore}/10
      </div>
      <div className="text-xs text-gray-400">
        Level: {info.label}
      </div>
      <div className="text-xs text-gray-400 pt-1 border-t border-gray-700">
        {info.description}
      </div>
    </div>
  )

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`neuro-inset ${sizeClasses[size]} rounded-lg cursor-help inline-block`}
      >
        <div className="flex items-center gap-2">
          <span className={`${iconSizes[size]} ${info.color}`}>
            {info.icon}
          </span>
          <div>
            <div className="text-xs text-gray-500">Difficulty</div>
            <div className={`text-sm font-medium ${info.color}`}>
              {info.label}
            </div>
            {showDescription && (
              <div className="text-xs text-gray-400 mt-1">
                {normalizedScore}/10
              </div>
            )}
          </div>
        </div>
      </div>
    </Tooltip>
  )
}

interface DifficultyScoreProps {
  score: number | null | undefined
  max?: number
  showBar?: boolean
  className?: string
}

/**
 * Display difficulty score with optional progress bar
 *
 * Usage:
 * <DifficultyScore score={7} showBar />
 */
export function DifficultyScore({
  score,
  max = 10,
  showBar = false,
  className = ''
}: DifficultyScoreProps) {
  const info = getDifficultyInfo(score)
  const normalizedScore = score ?? 5
  const percentage = (normalizedScore / max) * 100

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Difficulty</span>
        <span className={`text-lg font-bold ${info.color}`}>
          {normalizedScore}
          <span className="text-xs text-gray-500">/{max}</span>
        </span>
      </div>
      {showBar && (
        <div className="neuro-inset h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${info.color.replace('text-', 'bg-')}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface DifficultyComparisonProps {
  scores: Array<{ label: string; score: number | null | undefined }>
  className?: string
}

/**
 * Compare multiple difficulty scores
 *
 * Usage:
 * <DifficultyComparison scores={[
 *   { label: 'Current', score: 5 },
 *   { label: 'Next', score: 7 }
 * ]} />
 */
export function DifficultyComparison({ scores, className = '' }: DifficultyComparisonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {scores.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{item.label}</span>
          <DifficultyBadge score={item.score} showIcon showLabel={false} showScore />
        </div>
      ))}
    </div>
  )
}
