'use client'

import { getRLPhaseInfo, type RLPhase } from '@/lib/utils/rl-phase'

interface RLPhaseBadgeProps {
  phase: RLPhase | string | null | undefined
  showIcon?: boolean
  showDescription?: boolean
  className?: string
}

export function RLPhaseBadge({ phase, showIcon = true, showDescription = false, className = '' }: RLPhaseBadgeProps) {
  const phaseInfo = getRLPhaseInfo(phase as RLPhase)

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && (
        <span className={`text-2xl ${phaseInfo.color}`}>
          {phaseInfo.icon}
        </span>
      )}
      <div>
        <div className={`font-medium ${phaseInfo.color}`}>
          {phaseInfo.name}
        </div>
        {showDescription && (
          <div className="text-xs text-gray-500 mt-1">
            {phaseInfo.description}
          </div>
        )}
      </div>
    </div>
  )
}

interface RLPhaseIndicatorProps {
  phase: RLPhase | string | null | undefined
}

export function RLPhaseIndicator({ phase }: RLPhaseIndicatorProps) {
  const phaseInfo = getRLPhaseInfo(phase as RLPhase)

  return (
    <div
      className="neuro-inset px-3 py-2 rounded-lg cursor-help"
      title={phaseInfo.description}
    >
      <div className="flex items-center gap-2">
        <span className={`text-lg ${phaseInfo.color}`}>
          {phaseInfo.icon}
        </span>
        <div>
          <div className="text-xs text-gray-500">RL Phase</div>
          <div className={`text-sm font-medium ${phaseInfo.color}`}>
            {phaseInfo.name}
          </div>
        </div>
      </div>
    </div>
  )
}
