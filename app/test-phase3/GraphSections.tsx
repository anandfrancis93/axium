/**
 * Client Components for test-phase3 page
 *
 * These components handle the interactive onNodeClick functionality
 */

'use client'

import { InteractiveKnowledgeGraph } from '@/components/InteractiveKnowledgeGraph'

interface GraphSectionProps {
  scope?: string
  focusNodeId?: string
  highlightPath?: string[]
  animatePath?: boolean
  animationSpeed?: number
  height?: number
}

export function FullGraphSection() {
  return (
    <InteractiveKnowledgeGraph
      height={600}
      onNodeClick={(id, name) => {
        console.log('Clicked node:', id, name)
        alert(`Clicked: ${name}\nID: ${id}`)
      }}
    />
  )
}

export function ScopedGraphSection() {
  return (
    <InteractiveKnowledgeGraph
      scope="CompTIA Security+"
      height={600}
      onNodeClick={(id, name) => {
        console.log('Clicked CompTIA node:', id, name)
      }}
    />
  )
}

export function StaticPathSection({
  focusNodeId,
  highlightPath
}: {
  focusNodeId: string
  highlightPath: string[]
}) {
  return (
    <InteractiveKnowledgeGraph
      scope="CompTIA Security+"
      focusNodeId={focusNodeId}
      highlightPath={highlightPath}
      height={600}
    />
  )
}

export function AnimatedPathSection({
  focusNodeId,
  highlightPath
}: {
  focusNodeId: string
  highlightPath: string[]
}) {
  return (
    <InteractiveKnowledgeGraph
      scope="CompTIA Security+"
      focusNodeId={focusNodeId}
      highlightPath={highlightPath}
      animatePath={true}
      animationSpeed={2000}
      height={600}
    />
  )
}
