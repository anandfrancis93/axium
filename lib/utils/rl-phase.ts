// RL Phase utilities and constants

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
  icon: string
}

export const RL_PHASES: Record<RLPhase, RLPhaseInfo> = {
  cold_start: {
    key: 'cold_start',
    name: 'Cold Start',
    description: 'Building initial understanding - gathering first data points',
    color: 'text-gray-400',
    icon: '○'
  },
  exploration: {
    key: 'exploration',
    name: 'Exploration',
    description: 'Testing different approaches to find what works best',
    color: 'text-blue-400',
    icon: '◐'
  },
  optimization: {
    key: 'optimization',
    name: 'Optimization',
    description: 'Focusing on high-value learning strategies',
    color: 'text-cyan-400',
    icon: '◑'
  },
  stabilization: {
    key: 'stabilization',
    name: 'Stabilization',
    description: 'Performance is stable and consistent',
    color: 'text-green-400',
    icon: '●'
  },
  adaptation: {
    key: 'adaptation',
    name: 'Adaptation',
    description: 'Continuously adjusting to maintain performance',
    color: 'text-yellow-400',
    icon: '◉'
  },
  meta_learning: {
    key: 'meta_learning',
    name: 'Meta-Learning',
    description: 'Mastered how to learn - optimal learning patterns established',
    color: 'text-purple-400',
    icon: '◈'
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
