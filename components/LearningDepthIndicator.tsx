'use client'

import { Tooltip } from './Tooltip'

export type DepthLevel = 'foundation' | 'intermediate' | 'advanced' | 'expert'

interface DepthInfo {
  level: DepthLevel
  label: string
  color: string
  icon: string
  description: string
}

/**
 * Get depth level info for a DAG depth value
 * Depth 0 = root/foundation concepts
 * Higher depth = deeper in prerequisite graph
 */
export function getDepthInfo(depth: number | null | undefined): DepthInfo {
  const normalizedDepth = depth ?? 0

  if (normalizedDepth === 0) {
    return {
      level: 'foundation',
      label: 'Foundation',
      color: 'text-green-400',
      icon: '▼',
      description: 'Starting point - no prerequisites required'
    }
  } else if (normalizedDepth <= 2) {
    return {
      level: 'intermediate',
      label: 'Intermediate',
      color: 'text-blue-400',
      icon: '▽',
      description: 'Builds on foundational concepts'
    }
  } else if (normalizedDepth <= 4) {
    return {
      level: 'advanced',
      label: 'Advanced',
      color: 'text-purple-400',
      icon: '▿',
      description: 'Requires solid understanding of prerequisites'
    }
  } else {
    return {
      level: 'expert',
      label: 'Expert',
      color: 'text-cyan-400',
      icon: '◆',
      description: 'Deep in the knowledge graph - many prerequisites'
    }
  }
}

interface LearningDepthBadgeProps {
  depth: number | null | undefined
  showIcon?: boolean
  showLabel?: boolean
  showDepth?: boolean
  className?: string
}

/**
 * Display learning depth badge with icon and/or label
 *
 * Usage:
 * <LearningDepthBadge depth={3} showIcon showLabel />
 */
export function LearningDepthBadge({
  depth,
  showIcon = true,
  showLabel = true,
  showDepth = false,
  className = ''
}: LearningDepthBadgeProps) {
  const info = getDepthInfo(depth)
  const normalizedDepth = depth ?? 0

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
          {showDepth && (showLabel ? ` (L${normalizedDepth})` : `L${normalizedDepth}`)}
        </div>
      </div>
    </div>
  )
}

interface LearningDepthIndicatorProps {
  depth: number | null | undefined
  maxDepth?: number
  showBar?: boolean
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Display learning depth indicator with progress bar and tooltip
 *
 * Usage:
 * <LearningDepthIndicator depth={3} showBar showDescription />
 */
export function LearningDepthIndicator({
  depth,
  maxDepth = 10,
  showBar = true,
  showDescription = false,
  size = 'md'
}: LearningDepthIndicatorProps) {
  const info = getDepthInfo(depth)
  const normalizedDepth = depth ?? 0
  const percentage = Math.min((normalizedDepth / maxDepth) * 100, 100)

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
        Learning Depth: {normalizedDepth}
      </div>
      <div className="text-xs text-gray-400">
        Level: {info.label}
      </div>
      <div className="text-xs text-gray-400 pt-1 border-t border-gray-700">
        {info.description}
      </div>
      {normalizedDepth > 0 && (
        <div className="text-xs text-gray-400 pt-1 border-t border-gray-700">
          Position in prerequisite graph (0 = root)
        </div>
      )}
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
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Depth</div>
            <div className={`text-sm font-medium ${info.color}`}>
              {info.label}
            </div>
            {showDescription && (
              <div className="text-xs text-gray-400 mt-1">
                L{normalizedDepth}
              </div>
            )}
          </div>
        </div>
        {showBar && (
          <div className="neuro-inset h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-300 ${info.color.replace('text-', 'bg-')}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    </Tooltip>
  )
}

interface DepthProgressProps {
  depth: number | null | undefined
  maxDepth?: number
  className?: string
}

/**
 * Display depth progress with simple bar
 *
 * Usage:
 * <DepthProgress depth={3} maxDepth={10} />
 */
export function DepthProgress({
  depth,
  maxDepth = 10,
  className = ''
}: DepthProgressProps) {
  const info = getDepthInfo(depth)
  const normalizedDepth = depth ?? 0
  const percentage = Math.min((normalizedDepth / maxDepth) * 100, 100)

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Learning Depth</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${info.color}`}>
            {info.label}
          </span>
          <span className="text-xs text-gray-500">
            L{normalizedDepth}
          </span>
        </div>
      </div>
      <div className="neuro-inset h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${info.color.replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface DepthComparisonProps {
  items: Array<{ label: string; depth: number | null | undefined }>
  maxDepth?: number
  className?: string
}

/**
 * Compare multiple learning depths
 *
 * Usage:
 * <DepthComparison items={[
 *   { label: 'Current Topic', depth: 2 },
 *   { label: 'Next Topic', depth: 3 }
 * ]} />
 */
export function DepthComparison({
  items,
  maxDepth = 10,
  className = ''
}: DepthComparisonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">{item.label}</span>
            <LearningDepthBadge depth={item.depth} showIcon showLabel={false} showDepth />
          </div>
          <DepthProgress depth={item.depth} maxDepth={maxDepth} />
        </div>
      ))}
    </div>
  )
}

interface DepthPathVisualizerProps {
  currentDepth: number
  targetDepth: number
  maxDepth?: number
  className?: string
}

/**
 * Visualize path from current depth to target depth
 *
 * Usage:
 * <DepthPathVisualizer currentDepth={1} targetDepth={4} />
 */
export function DepthPathVisualizer({
  currentDepth,
  targetDepth,
  maxDepth = 10,
  className = ''
}: DepthPathVisualizerProps) {
  const currentInfo = getDepthInfo(currentDepth)
  const targetInfo = getDepthInfo(targetDepth)
  const steps = targetDepth - currentDepth

  return (
    <div className={`neuro-inset p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-400">Learning Path</div>
        <div className="text-xs text-gray-500">
          {steps > 0 ? `${steps} ${steps === 1 ? 'step' : 'steps'} ahead` : 'Same level'}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Current */}
        <div className="flex-1">
          <div className={`text-xs ${currentInfo.color} mb-1`}>Current</div>
          <div className="neuro-inset px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className={currentInfo.color}>{currentInfo.icon}</span>
              <span className="text-sm text-gray-300">L{currentDepth}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        {steps > 0 && (
          <div className="text-gray-600">→</div>
        )}

        {/* Target */}
        {steps > 0 && (
          <div className="flex-1">
            <div className={`text-xs ${targetInfo.color} mb-1`}>Target</div>
            <div className="neuro-inset px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <span className={targetInfo.color}>{targetInfo.icon}</span>
                <span className="text-sm text-gray-300">L{targetDepth}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar showing full path */}
      <div className="mt-3">
        <div className="neuro-inset h-2 rounded-full overflow-hidden relative">
          {/* Current progress */}
          <div
            className={`h-full absolute ${currentInfo.color.replace('text-', 'bg-')} opacity-50`}
            style={{ width: `${(currentDepth / maxDepth) * 100}%` }}
          />
          {/* Target progress */}
          <div
            className={`h-full absolute ${targetInfo.color.replace('text-', 'bg-')}`}
            style={{ width: `${(targetDepth / maxDepth) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
