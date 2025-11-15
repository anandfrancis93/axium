/**
 * Test page for Phase 2 GraphRAG components
 *
 * Demonstrates PrerequisitePathView and UnlockPreview with real data
 */

import { createClient } from '@/lib/supabase/server'
import { PrerequisitePathView, PrerequisitePathIndicator } from '@/components/PrerequisitePathView'
import { UnlockPreview, UnlockBadge } from '@/components/UnlockPreview'

export default async function TestPhase2Page() {
  const supabase = await createClient()

  // Get a sample of topics with different prerequisite depths
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, full_name, depth')
    .limit(20)
    .order('name')

  // Get some topics that we know have prerequisites (from L2 depth)
  const { data: withPrereqs } = await supabase
    .from('graphrag_prerequisite_paths')
    .select(`
      target_entity_id,
      path_depth,
      path_names
    `)
    .order('path_depth', { ascending: false })
    .limit(5)

  // Map back to topic IDs
  const entityIds = withPrereqs?.map(p => p.target_entity_id) || []
  const { data: prerequisiteTopics } = await supabase
    .from('graphrag_entities')
    .select('id, full_path, name')
    .in('id', entityIds)

  // Find matching topics
  const topicsWithPaths = prerequisiteTopics?.map(entity => {
    const path = withPrereqs?.find(p => p.target_entity_id === entity.id)
    const topic = topics?.find(t => t.full_name === entity.full_path)
    return {
      id: topic?.id || entity.id,
      name: entity.name,
      full_name: entity.full_path,
      path_depth: path?.path_depth || 0
    }
  }).filter(t => t.id) || []

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-200 mb-4">
            Phase 2: Prerequisite & Unlock Components
          </h1>
          <p className="text-lg text-gray-400">
            Testing prerequisite paths and "what this unlocks" visualization with real Neo4j data
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="neuro-stat">
            <div className="text-sm text-purple-400 font-medium mb-2">Topics with Prerequisites</div>
            <div className="text-4xl font-bold text-gray-200">325</div>
          </div>
          <div className="neuro-stat">
            <div className="text-sm text-cyan-400 font-medium mb-2">Cached Paths</div>
            <div className="text-4xl font-bold text-gray-200">325</div>
          </div>
          <div className="neuro-stat">
            <div className="text-sm text-blue-400 font-medium mb-2">L1 Depth</div>
            <div className="text-4xl font-bold text-gray-200">301</div>
          </div>
          <div className="neuro-stat">
            <div className="text-sm text-green-400 font-medium mb-2">L2 Depth</div>
            <div className="text-4xl font-bold text-gray-200">24</div>
          </div>
        </div>

        {/* Component Showcase */}
        <div className="space-y-12">
          {/* Section 1: Topics with Deepest Paths */}
          {topicsWithPaths.length > 0 && (
            <section className="neuro-card">
              <h2 className="text-2xl font-semibold text-purple-400 mb-6">
                Prerequisite Paths (Deepest First)
              </h2>

              <div className="space-y-6">
                {topicsWithPaths.map((topic) => (
                  <div key={topic.id} className="neuro-container">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-200">{topic.name}</h3>
                      <PrerequisitePathIndicator
                        topicId={topic.id}
                        topicName={topic.name}
                      />
                    </div>
                    <PrerequisitePathView
                      topicId={topic.id}
                      topicName={topic.name}
                      showCollapsed={false}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 2: What This Unlocks */}
          {topicsWithPaths.length > 0 && (
            <section className="neuro-card">
              <h2 className="text-2xl font-semibold text-cyan-400 mb-6">
                What This Unlocks
              </h2>

              <div className="space-y-6">
                {topicsWithPaths.slice(0, 3).map((topic) => (
                  <div key={`unlock-${topic.id}`} className="neuro-container">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-200">{topic.name}</h3>
                      <UnlockBadge topicId={topic.id} />
                    </div>
                    <UnlockPreview
                      topicId={topic.id}
                      topicName={topic.name}
                      compact={false}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Random Sample Topics */}
          {topics && topics.length > 0 && (
            <section className="neuro-card">
              <h2 className="text-2xl font-semibold text-gray-200 mb-6">
                Sample Topics (Mixed)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.slice(0, 6).map((topic) => (
                  <div key={`sample-${topic.id}`} className="neuro-container">
                    <h3 className="text-md font-medium text-gray-200 mb-4">{topic.name}</h3>

                    {/* Prerequisite Path */}
                    <div className="mb-4">
                      <PrerequisitePathView
                        topicId={topic.id}
                        topicName={topic.name}
                        showCollapsed={true}
                      />
                    </div>

                    {/* What This Unlocks */}
                    <UnlockPreview
                      topicId={topic.id}
                      topicName={topic.name}
                      compact={true}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Component Variants */}
          <section className="neuro-card">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">
              Component Variants
            </h2>

            <div className="space-y-6">
              {/* Indicator badges */}
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-4">Compact Badges</h3>
                <div className="flex flex-wrap items-center gap-4">
                  {topicsWithPaths.slice(0, 3).map(topic => (
                    <div key={`badge-${topic.id}`} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{topic.name}:</span>
                      <PrerequisitePathIndicator topicId={topic.id} topicName={topic.name} />
                      <UnlockBadge topicId={topic.id} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage examples */}
              <div className="neuro-inset p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300 mb-4">Integration Examples</h3>
                <div className="space-y-4 text-sm text-gray-400">
                  <div>
                    <div className="font-medium text-purple-400 mb-1">Quiz Page Feedback</div>
                    <div>After answering a question, show UnlockPreview to motivate continued learning</div>
                  </div>
                  <div>
                    <div className="font-medium text-cyan-400 mb-1">Topic Detail Page</div>
                    <div>Show PrerequisitePathView to help learners understand what to study first</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-400 mb-1">Topic Selection</div>
                    <div>Use PrerequisitePathIndicator and UnlockBadge for quick scanning</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
