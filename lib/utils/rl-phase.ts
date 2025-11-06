// RL Phase utilities and constants
import {
  ColdStartIcon,
  ExplorationIcon,
  OptimizationIcon,
  StabilizationIcon,
  AdaptationIcon,
  MetaLearningIcon
} from '@/components/icons'

export type RLPhase =
  | 'cold_start'
  | 'exploration'
  | 'optimization'
  | 'stabilization'
  | 'adaptation'
  | 'meta_learning'

export interface RLPhaseInfo {
  key: RLPhase
  name: string
  description: string
  color: string
  icon: any // React component
}

export const RL_PHASES: Record<RLPhase, RLPhaseInfo> = {
  cold_start: {
    key: 'cold_start',
    name: 'Cold Start',
    description: 'Building initial understanding - gathering first data points',
    color: 'text-gray-400',
    icon: ColdStartIcon
  },
  exploration: {
    key: 'exploration',
    name: 'Exploration',
    description: 'Testing different approaches to find what works best',
    color: 'text-blue-400',
    icon: ExplorationIcon
  },
  optimization: {
    key: 'optimization',
    name: 'Optimization',
    description: 'Focusing on high-value learning strategies',
    color: 'text-cyan-400',
    icon: OptimizationIcon
  },
  stabilization: {
    key: 'stabilization',
    name: 'Stabilization',
    description: 'Performance is stable and consistent',
    color: 'text-green-400',
    icon: StabilizationIcon
  },
  adaptation: {
    key: 'adaptation',
    name: 'Adaptation',
    description: 'Continuously adjusting to maintain performance',
    color: 'text-yellow-400',
    icon: AdaptationIcon
  },
  meta_learning: {
    key: 'meta_learning',
    name: 'Meta-Learning',
    description: 'Mastered how to learn - optimal learning patterns established',
    color: 'text-purple-400',
    icon: MetaLearningIcon
  }
}

export function getRLPhaseInfo(phase: RLPhase | string | null | undefined): RLPhaseInfo {
  if (!phase || !(phase in RL_PHASES)) {
    return RL_PHASES.cold_start
  }
  return RL_PHASES[phase as RLPhase]
}

export function getRLPhaseProgress(phase: RLPhase | string | null | undefined): number {
  const phaseKey = phase as RLPhase || 'cold_start'
  const phases: RLPhase[] = ['cold_start', 'exploration', 'optimization', 'stabilization', 'adaptation', 'meta_learning']
  const index = phases.indexOf(phaseKey)
  return index === -1 ? 0 : ((index + 1) / phases.length) * 100
}

// Get user-facing explanation of what this phase means for their learning
export function getRLPhaseContext(phase: RLPhase | string | null | undefined): string {
  const phaseKey = (phase as RLPhase) || 'cold_start'

  const contexts: Record<RLPhase, string> = {
    cold_start: 'The system is gathering initial data about your learning patterns. You may see a variety of question types and topics as we build your baseline.',
    exploration: 'The system is testing different question types, topics, and difficulty levels to find what works best for you. Expect variety in your questions.',
    optimization: 'The system has identified effective learning strategies for you and is focusing on high-value questions to maximize your progress.',
    stabilization: 'Your learning pattern has stabilized. The system is maintaining your progress with optimized question selection.',
    adaptation: 'The system detected changes in your performance and is adjusting its teaching strategy to keep you on track.',
    meta_learning: 'You have achieved optimal learning efficiency. The system has learned your ideal learning patterns and is applying them consistently.'
  }

  return contexts[phaseKey] || contexts.cold_start
}

// Get all RL phases with their descriptions for tooltip display
export function getAllRLPhasesInfo(currentPhase?: RLPhase | string | null) {
  const phases: Array<{ key: RLPhase; name: string; description: string }> = [
    {
      key: 'cold_start',
      name: 'Cold Start',
      description: 'Building initial understanding - gathering first data points'
    },
    {
      key: 'exploration',
      name: 'Exploration',
      description: 'Testing different approaches to find what works best'
    },
    {
      key: 'optimization',
      name: 'Optimization',
      description: 'Focusing on high-value learning strategies'
    },
    {
      key: 'stabilization',
      name: 'Stabilization',
      description: 'Performance is stable and consistent'
    },
    {
      key: 'adaptation',
      name: 'Adaptation',
      description: 'Continuously adjusting to maintain performance'
    },
    {
      key: 'meta_learning',
      name: 'Meta-Learning',
      description: 'Mastered how to learn - optimal learning patterns established'
    }
  ]

  return (
    <div className="space-y-3">
      {phases.map((phase, index) => {
        const isCurrent = currentPhase === phase.key
        return (
          <div key={phase.key}>
            <div className={isCurrent ? 'text-blue-400 font-semibold' : 'text-gray-300 font-medium'}>
              {phase.name}{isCurrent && ' (Current)'}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {phase.description}
            </div>
          </div>
        )
      })}
    </div>
  )
}
