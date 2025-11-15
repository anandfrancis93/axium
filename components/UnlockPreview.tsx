/**
 * UnlockPreview Component
 *
 * Shows what concepts/topics become accessible after mastering the current topic.
 * Motivates learners by showing the "why" - what they're working toward.
 *
 * Data source: graphrag_relationships (PREREQUISITE type, reversed lookup)
 */

'use client'

import { useState, useEffect } from 'react'
import { DifficultyBadge } from './DifficultyBadge'
import { LearningDepthBadge } from './LearningDepthIndicator'

interface UnlockedConcept {
  id: string
  name: string
  difficulty_score: number | null
  learning_depth: number | null
  type: string
}

interface UnlockPreviewProps {
  topicId: string
  topicName: string
  className?: string
  compact?: boolean
}

/**
 * Main component: Shows what becomes unlocked after mastering this topic
 */
export function UnlockPreview({
  topicId,
  topicName,
  className = '',
  compact = false
}: UnlockPreviewProps) {
  const [unlocks, setUnlocks] = useState<UnlockedConcept[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(!compact)

  useEffect(() => {
    async function fetchUnlocks() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/semantic/unlocks?topicId=${topicId}`)

        if (!response.ok) {
          if (response.status === 404) {
            // No concepts unlocked - this might be an endpoint concept
            setUnlocks([])
            setError(null)
          } else {
            throw new Error(`Failed to fetch unlocks: ${response.statusText}`)
          }
        } else {
          const data = await response.json()
          setUnlocks(data.unlocks || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchUnlocks()
  }, [topicId])

  if (loading) {
    return (
      <div className={`neuro-card ${className}`}>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`neuro-card ${className}`}>
        <div className="text-center p-4">
          <div className="text-red-400 text-sm mb-1">Failed to load unlocks</div>
          <div className="text-xs text-gray-500">{error}</div>
        </div>
      </div>
    )
  }

  // No unlocks - this is likely an advanced/endpoint topic
  if (unlocks.length === 0) {
    return (
      <div className={`neuro-card ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Advanced Topic</h3>
            <div className="text-xs text-gray-500">Mastering this builds comprehensive expertise</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`neuro-card ${className}`}>
      {/* Header */}
      {compact ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-200">What This Unlocks</h3>
              <div className="text-xs text-gray-500">
                {unlocks.length} concept{unlocks.length !== 1 ? 's' : ''} become{unlocks.length === 1 ? 's' : ''} available
              </div>
            </div>
          </div>
          <span className="text-gray-400 text-xl">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3 mb-6">
          <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-200">What This Unlocks</h3>
            <div className="text-xs text-gray-500">
              Master <span className="text-cyan-400 font-medium">{topicName}</span> to access these concepts
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <>
          {/* Unlocked concepts grid */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            {unlocks.map((concept, idx) => (
              <div key={concept.id} className="neuro-inset p-4 rounded-lg hover:ring-2 hover:ring-cyan-400 transition-all">
                <div className="flex items-start justify-between gap-3">
                  {/* Concept info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="neuro-inset w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-cyan-400">{idx + 1}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-200 flex-1 truncate" title={concept.name}>
                        {concept.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap ml-10">
                      {concept.difficulty_score !== null && (
                        <DifficultyBadge score={concept.difficulty_score} showIcon showLabel={false} showScore />
                      )}
                      {concept.learning_depth !== null && (
                        <LearningDepthBadge depth={concept.learning_depth} showIcon showLabel={false} showDepth />
                      )}
                      <span className="text-xs text-gray-500 capitalize">{concept.type}</span>
                    </div>
                  </div>

                  {/* Unlock icon */}
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Motivation message */}
          <div className="neuro-inset p-4 rounded-lg bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-300">
                <span className="font-medium text-cyan-400">Why this matters:</span> Mastering this topic is a stepping stone to {unlocks.length} more advanced concept{unlocks.length !== 1 ? 's' : ''}. Each builds on your understanding!
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Compact badge: Shows unlock count with hover tooltip
 */
export function UnlockBadge({
  topicId,
  className = ''
}: { topicId: string; className?: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        const response = await fetch(`/api/semantic/unlocks?topicId=${topicId}`)
        if (response.ok) {
          const data = await response.json()
          setCount(data.unlocks?.length || 0)
        } else {
          setCount(0)
        }
      } catch {
        setCount(0)
      }
    }

    fetchCount()
  }, [topicId])

  if (count === null || count === 0) {
    return null
  }

  return (
    <div
      className={`inline-flex items-center gap-2 neuro-inset px-3 py-2 rounded-lg ${className}`}
      title={`Unlocks ${count} concept${count !== 1 ? 's' : ''}`}
    >
      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
      <span className="text-sm text-cyan-400 font-medium">
        +{count}
      </span>
    </div>
  )
}
