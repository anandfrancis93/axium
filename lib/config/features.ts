/**
 * Feature Flags Configuration
 *
 * Enables/disables experimental features without affecting production.
 *
 * Usage:
 *   import { features } from '@/lib/config/features'
 *   if (features.graphRAG.enabled) { ... }
 */

export interface FeatureConfig {
  enabled: boolean
  description: string
  adminOnly?: boolean
}

export interface Features {
  graphRAG: FeatureConfig & {
    modes: {
      vectorOnly: boolean      // Current production RAG
      graphOnly: boolean       // GraphRAG only (experimental)
      hybrid: boolean          // Intelligent routing between both
      sideBySide: boolean      // Show both results for comparison
    }
  }
}

export const features: Features = {
  graphRAG: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_GRAPH_RAG === 'true',
    description: 'Knowledge Graph-based RAG for improved question generation',
    adminOnly: true,
    modes: {
      vectorOnly: true,        // Default: use current system
      graphOnly: false,        // Experimental: pure GraphRAG
      hybrid: false,           // Smart routing (Bloom 1-3 → vector, 4-6 → graph)
      sideBySide: false,       // Admin comparison mode
    }
  }
}

/**
 * Get current RAG mode based on feature flags
 */
export type RAGMode = 'vector' | 'graph' | 'hybrid' | 'side-by-side'

export function getCurrentRAGMode(): RAGMode {
  if (!features.graphRAG.enabled) return 'vector'

  if (features.graphRAG.modes.sideBySide) return 'side-by-side'
  if (features.graphRAG.modes.graphOnly) return 'graph'
  if (features.graphRAG.modes.hybrid) return 'hybrid'

  return 'vector'
}

/**
 * Determine which RAG to use based on Bloom level (for hybrid mode)
 */
export function selectRAGForBloomLevel(bloomLevel: number): 'vector' | 'graph' {
  const mode = getCurrentRAGMode()

  if (mode === 'vector') return 'vector'
  if (mode === 'graph') return 'graph'
  if (mode === 'hybrid') {
    // Bloom 1-3: Vector RAG (fast, simple)
    // Bloom 4-6: GraphRAG (complex reasoning)
    return bloomLevel >= 4 ? 'graph' : 'vector'
  }

  return 'vector' // Fallback
}
