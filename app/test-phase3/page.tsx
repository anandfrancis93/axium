/**
 * Test page for Phase 3 Interactive Knowledge Graph
 *
 * Demonstrates interactive graph visualization with:
 * - Full knowledge graph
 * - Scoped view (CompTIA Security+)
 * - Focus node highlighting
 * - Prerequisite path highlighting
 * - Click-to-navigate functionality
 */

import { createClient } from '@/lib/supabase/server'
import GraphTestControls from './GraphTestControls'
import {
  FullGraphSection,
  ScopedGraphSection,
  StaticPathSection,
  AnimatedPathSection
} from './GraphSections'

export default async function TestPhase3Page() {
  const supabase = await createClient()

  // Get a sample topic with prerequisites for path highlighting demo
  const { data: samplePath } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('target_entity_id, path_entity_ids, path_names')
    .eq('path_depth', 2)
    .limit(1)
    .single()

  // Get stats
  const { count: entityCount } = await supabase
    .from('graphrag_entities')
    .select('*', { count: 'exact', head: true })

  const { count: relationshipCount } = await supabase
    .from('graphrag_relationships')
    .select('*', { count: 'exact', head: true })

  const { count: pathCount } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-200 mb-4">
            Phase 3: Interactive Knowledge Graph
          </h1>
          <p className="text-lg text-gray-400 mb-6">
            Explore prerequisite relationships with interactive force-directed visualization
          </p>

          {/* System Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="neuro-stat">
              <div className="text-sm text-purple-400 font-medium mb-2">Total Entities</div>
              <div className="text-4xl font-bold text-gray-200">{entityCount || 0}</div>
            </div>
            <div className="neuro-stat">
              <div className="text-sm text-cyan-400 font-medium mb-2">Relationships</div>
              <div className="text-4xl font-bold text-gray-200">{relationshipCount || 0}</div>
            </div>
            <div className="neuro-stat">
              <div className="text-sm text-blue-400 font-medium mb-2">Prerequisite Paths</div>
              <div className="text-4xl font-bold text-gray-200">{pathCount || 0}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Full Graph (Limited) */}
        <section className="neuro-card mb-12">
          <h2 className="text-2xl font-semibold text-purple-400 mb-6">
            Full Knowledge Graph
          </h2>
          <p className="text-gray-400 mb-6">
            Showing all entities and relationships (limited to 200 nodes for performance)
          </p>
          <FullGraphSection />
        </section>

        {/* Section 2: Scoped Graph (CompTIA Security+) */}
        <section className="neuro-card mb-12">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6">
            Scoped View: CompTIA Security+
          </h2>
          <p className="text-gray-400 mb-6">
            Filtered to show only CompTIA Security+ topics
          </p>
          <ScopedGraphSection />
        </section>

        {/* Section 3: Path Highlighting Demo (Static) */}
        {samplePath && (
          <section className="neuro-card mb-12">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
              Prerequisite Path Highlighting (Static)
            </h2>
            <p className="text-gray-400 mb-4">
              Showing complete path from root to:{' '}
              <span className="font-semibold text-gray-200">
                {samplePath.path_names[samplePath.path_names.length - 1]}
              </span>
            </p>
            <div className="mb-6 neuro-inset p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">Path:</div>
              <div className="text-gray-300">
                {samplePath.path_names.join(' → ')}
              </div>
            </div>
            <StaticPathSection
              focusNodeId={samplePath.target_entity_id}
              highlightPath={samplePath.path_entity_ids}
            />
          </section>
        )}

        {/* Section 3b: Path Traversal Animation */}
        {samplePath && (
          <section className="neuro-card mb-12">
            <h2 className="text-2xl font-semibold text-green-400 mb-6">
              Prerequisite Path Traversal Animation
            </h2>
            <p className="text-gray-400 mb-4">
              Watch the animated progression through the prerequisite path step-by-step
            </p>
            <div className="mb-6 neuro-inset p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">Animating Path:</div>
              <div className="text-gray-300">
                {samplePath.path_names.join(' → ')}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Animation speed: 2 seconds per step
              </div>
            </div>
            <AnimatedPathSection
              focusNodeId={samplePath.target_entity_id}
              highlightPath={samplePath.path_entity_ids}
            />
          </section>
        )}

        {/* Section 4: Interactive Controls (Client Component) */}
        <section className="neuro-card">
          <h2 className="text-2xl font-semibold text-green-400 mb-6">
            Interactive Controls
          </h2>
          <p className="text-gray-400 mb-6">
            Test different graph configurations and features
          </p>
          <GraphTestControls />
        </section>

        {/* Usage Guide */}
        <section className="neuro-card mt-12">
          <h2 className="text-2xl font-semibold text-gray-200 mb-6">
            Usage Guide
          </h2>
          <div className="space-y-4 text-sm text-gray-400">
            <div>
              <div className="font-medium text-blue-400 mb-1">Zoom & Pan</div>
              <div>Use mouse wheel to zoom, click and drag background to pan</div>
            </div>
            <div>
              <div className="font-medium text-cyan-400 mb-1">Node Interaction</div>
              <div>Click nodes to navigate (alert demo), hover for details</div>
            </div>
            <div>
              <div className="font-medium text-purple-400 mb-1">Node Colors</div>
              <div>
                Nodes are colored by learning depth: Gray (L0) → Green (L1) → Cyan (L2) →
                Purple (L3) → Yellow (L4) → Red (L5+)
              </div>
            </div>
            <div>
              <div className="font-medium text-yellow-400 mb-1">Path Highlighting</div>
              <div>
                When a prerequisite path is active, nodes and edges in the path are highlighted
                in yellow
              </div>
            </div>
            <div>
              <div className="font-medium text-green-400 mb-1">Drag Nodes</div>
              <div>Click and drag individual nodes to reposition them in the graph</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
