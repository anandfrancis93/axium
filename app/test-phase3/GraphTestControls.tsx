/**
 * Interactive controls for testing graph features
 */

'use client'

import { useState } from 'react'
import { InteractiveKnowledgeGraph } from '@/components/InteractiveKnowledgeGraph'

export default function GraphTestControls() {
  const [scope, setScope] = useState<string>('')
  const [focusNodeId, setFocusNodeId] = useState<string>('')
  const [nodeLimit, setNodeLimit] = useState<number>(100)
  const [showGraph, setShowGraph] = useState(false)

  // Sample focus node IDs (from known entities)
  const sampleNodes = [
    { id: 'ea3e47b5-33f5-46df-a7e2-33cb9f92ed9c', name: 'Wildcard (L2 depth)' },
    { id: '6dd87ca3-71f6-4396-a0d8-6cce56c97956', name: 'Certificates' },
  ]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scope Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Scope Filter
          </label>
          <input
            type="text"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="e.g., CompTIA Security+"
            className="neuro-input w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            Leave empty for all nodes
          </div>
        </div>

        {/* Focus Node */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Focus Node ID
          </label>
          <input
            type="text"
            value={focusNodeId}
            onChange={(e) => setFocusNodeId(e.target.value)}
            placeholder="Enter node UUID"
            className="neuro-input w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            Or select:{' '}
            {sampleNodes.map((node, i) => (
              <button
                key={node.id}
                onClick={() => setFocusNodeId(node.id)}
                className="text-blue-400 hover:underline ml-2"
              >
                {node.name}
              </button>
            ))}
          </div>
        </div>

        {/* Node Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Node Limit: {nodeLimit}
          </label>
          <input
            type="range"
            min="50"
            max="300"
            step="50"
            value={nodeLimit}
            onChange={(e) => setNodeLimit(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            Adjust performance vs completeness
          </div>
        </div>

        {/* Show Graph Button */}
        <div className="flex items-end">
          <button
            onClick={() => setShowGraph(true)}
            className="neuro-btn text-blue-400 w-full"
          >
            Render Graph
          </button>
        </div>
      </div>

      {/* Current Config */}
      {showGraph && (
        <div className="neuro-inset p-4 rounded-lg text-xs text-gray-500">
          <div className="font-medium text-gray-400 mb-2">Current Configuration:</div>
          <div>Scope: {scope || 'All'}</div>
          <div>Focus Node: {focusNodeId || 'None'}</div>
          <div>Limit: {nodeLimit} nodes</div>
        </div>
      )}

      {/* Rendered Graph */}
      {showGraph && (
        <div className="mt-6">
          <InteractiveKnowledgeGraph
            scope={scope || undefined}
            focusNodeId={focusNodeId || undefined}
            height={600}
            onNodeClick={(id, name) => {
              console.log('Test controls - clicked:', id, name)
              setFocusNodeId(id)
            }}
          />
        </div>
      )}

      {/* Instructions */}
      {!showGraph && (
        <div className="neuro-inset p-6 rounded-lg text-center">
          <div className="text-gray-400 mb-2">Configure graph settings above</div>
          <div className="text-sm text-gray-600">
            Then click "Render Graph" to visualize
          </div>
        </div>
      )}
    </div>
  )
}
