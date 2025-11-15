/**
 * PrerequisitePathView Component
 *
 * Displays the learning path (prerequisite chain) to reach a target topic.
 * Shows the DAG path from root concepts through all prerequisites to the target.
 *
 * Data source: graphrag_prerequisite_paths table (cached from Neo4j)
 */

'use client'

import { useState, useEffect } from 'react'
import { DifficultyBadge } from './DifficultyBadge'
import { LearningDepthBadge } from './LearningDepthIndicator'

interface PrerequisitePath {
  target_entity_id: string
  path_depth: number
  path_names: string[]
  path_entity_ids: string[]
  total_difficulty: number | null
  estimated_total_time: number | null
}

interface PathNode {
  id: string
  name: string
  difficulty: number | null
  depth: number
}

interface PrerequisitePathViewProps {
  topicId: string
  topicName: string
  className?: string
  showCollapsed?: boolean
}

/**
 * Main component: Shows prerequisite path with visual progression
 */
export function PrerequisitePathView({
  topicId,
  topicName,
  className = '',
  showCollapsed = true
}: PrerequisitePathViewProps) {
  const [path, setPath] = useState<PrerequisitePath | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(!showCollapsed)

  useEffect(() => {
    async function fetchPath() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/semantic/prerequisite-path?topicId=${topicId}`)

        if (!response.ok) {
          if (response.status === 404) {
            // No prerequisites - this is a root concept
            setPath(null)
            setError(null)
          } else {
            throw new Error(`Failed to fetch path: ${response.statusText}`)
          }
        } else {
          const data = await response.json()
          setPath(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPath()
  }, [topicId])

  if (loading) {
    return (
      <div className={`neuro-card ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-200">Loading Prerequisites...</h3>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`neuro-card ${className}`}>
        <div className="text-center p-6">
          <div className="text-red-400 mb-2">Failed to load prerequisite path</div>
          <div className="text-sm text-gray-500">{error}</div>
        </div>
      </div>
    )
  }

  // No prerequisites - this is a foundation topic
  if (!path || path.path_depth === 0) {
    return (
      <div className={`neuro-card ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-200">Foundation Topic</h3>
        </div>
        <div className="neuro-inset p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">
            <span className="font-medium text-green-400">{topicName}</span> is a foundation concept
          </div>
          <div className="text-xs text-gray-500">
            No prerequisites required - start learning right away!
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`neuro-card ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-200">Learning Path</h3>
            <div className="text-xs text-gray-500">
              {path.path_depth} step{path.path_depth !== 1 ? 's' : ''} to reach this topic
            </div>
          </div>
        </div>
        <span className="text-gray-400 text-xl">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <>
          {/* Path visualization */}
          <div className="space-y-3 mb-6">
            {path.path_names.map((name, idx) => {
              const isLast = idx === path.path_names.length - 1
              const isTarget = isLast

              return (
                <div key={idx}>
                  {/* Path node */}
                  <div className={`flex items-center gap-3 ${isTarget ? 'neuro-raised' : 'neuro-inset'} p-4 rounded-lg transition-all`}>
                    {/* Step number */}
                    <div className={`neuro-inset w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isTarget ? 'ring-2 ring-purple-400' : ''}`}>
                      <span className={`text-sm font-semibold ${isTarget ? 'text-purple-400' : 'text-gray-400'}`}>
                        {idx + 1}
                      </span>
                    </div>

                    {/* Topic info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium mb-1 ${isTarget ? 'text-purple-400' : 'text-gray-200'}`}>
                        {name}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <LearningDepthBadge depth={idx} showIcon showLabel={false} showDepth />
                        {isTarget && (
                          <span className="text-xs text-purple-400 font-medium">
                            (Current Topic)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {!isLast && (
                    <div className="flex justify-center py-2">
                      <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Path summary */}
          <div className="neuro-inset p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Steps</div>
                <div className="text-lg font-semibold text-blue-400">
                  {path.path_depth} topic{path.path_depth !== 1 ? 's' : ''}
                </div>
              </div>
              {path.total_difficulty !== null && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Combined Difficulty</div>
                  <div className="text-lg font-semibold text-yellow-400">
                    {path.total_difficulty}/10
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="text-xs text-gray-500 mb-2">Learning Strategy</div>
              <div className="text-sm text-gray-400">
                Master each topic in order from top to bottom for optimal understanding
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Compact version: Shows prerequisite count with expandable details
 */
export function PrerequisitePathIndicator({
  topicId,
  topicName,
  className = ''
}: PrerequisitePathViewProps) {
  const [count, setCount] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    async function fetchCount() {
      try {
        const response = await fetch(`/api/semantic/prerequisite-path?topicId=${topicId}`)
        if (response.ok) {
          const data = await response.json()
          setCount(data.path_depth || 0)
        } else {
          setCount(0)
        }
      } catch {
        setCount(0)
      }
    }

    fetchCount()
  }, [topicId])

  if (count === null) {
    return null
  }

  if (count === 0) {
    return (
      <div className={`inline-flex items-center gap-2 neuro-inset px-3 py-2 rounded-lg ${className}`}>
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-gray-400">Foundation topic</span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className={`inline-flex items-center gap-2 neuro-inset px-3 py-2 rounded-lg hover:ring-2 hover:ring-purple-400 transition-all ${className}`}
      >
        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-sm text-gray-400">
          {count} prerequisite{count !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Modal with full path */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="neuro-container max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <PrerequisitePathView
              topicId={topicId}
              topicName={topicName}
              showCollapsed={false}
            />
            <button
              onClick={() => setShowDetails(false)}
              className="neuro-btn text-gray-300 w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
