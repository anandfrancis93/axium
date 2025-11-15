/**
 * Test page for GraphRAG UI components with real data
 */

import { createClient } from '@/lib/supabase/server'
import { DifficultyBadge, DifficultyIndicator, DifficultyScore, DifficultyComparison } from '@/components/DifficultyBadge'
import { LearningDepthBadge, LearningDepthIndicator, DepthProgress, DepthComparison, DepthPathVisualizer } from '@/components/LearningDepthIndicator'

export default async function TestGraphRAGUIPage() {
  const supabase = await createClient()

  // Fetch sample entities with varying difficulty and depth
  const { data: entities, error } = await supabase
    .from('graphrag_entities')
    .select('id, name, difficulty_score, learning_depth, type, domain_name')
    .not('difficulty_score', 'is', null)
    .order('difficulty_score', { ascending: true })
    .limit(20)

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Error Loading Data</h1>
        <pre className="text-red-400">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  // Group by difficulty level
  const beginner = entities?.filter(e => e.difficulty_score && e.difficulty_score <= 3) || []
  const intermediate = entities?.filter(e => e.difficulty_score && e.difficulty_score > 3 && e.difficulty_score <= 6) || []
  const advanced = entities?.filter(e => e.difficulty_score && e.difficulty_score > 6) || []

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-200 mb-4">
            GraphRAG UI Components Test
          </h1>
          <p className="text-lg text-gray-400">
            Testing DifficultyBadge and LearningDepthIndicator with real data from Neo4j cache
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="neuro-stat">
            <div className="text-sm text-blue-400 font-medium mb-2">Total Entities</div>
            <div className="text-4xl font-bold text-gray-200">{entities?.length || 0}</div>
          </div>
          <div className="neuro-stat">
            <div className="text-sm text-green-400 font-medium mb-2">Beginner</div>
            <div className="text-4xl font-bold text-gray-200">{beginner.length}</div>
          </div>
          <div className="neuro-stat">
            <div className="text-sm text-yellow-400 font-medium mb-2">Intermediate</div>
            <div className="text-4xl font-bold text-gray-200">{intermediate.length}</div>
          </div>
          <div className="neuro-stat">
            <div className="text-sm text-red-400 font-medium mb-2">Advanced</div>
            <div className="text-4xl font-bold text-gray-200">{advanced.length}</div>
          </div>
        </div>

        {/* Component Showcase */}
        <div className="space-y-12">
          {/* Beginner Topics */}
          {beginner.length > 0 && (
            <section className="neuro-card">
              <h2 className="text-2xl font-semibold text-green-400 mb-6">
                Beginner Topics (Difficulty 1-3)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {beginner.map((entity) => (
                  <div key={entity.id} className="neuro-inset p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-200 mb-4">{entity.name}</h3>

                    <div className="space-y-4">
                      {/* Difficulty Indicator */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Difficulty Indicator</div>
                        <DifficultyIndicator score={entity.difficulty_score} showDescription size="sm" />
                      </div>

                      {/* Difficulty Score with Bar */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Difficulty Score</div>
                        <DifficultyScore score={entity.difficulty_score} showBar />
                      </div>

                      {/* Learning Depth */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Learning Depth</div>
                        <LearningDepthIndicator
                          depth={entity.learning_depth || 0}
                          maxDepth={5}
                          showBar
                          size="sm"
                        />
                      </div>

                      {/* Metadata */}
                      <div className="pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-4 text-sm">
                          <DifficultyBadge score={entity.difficulty_score} showIcon showDescription={false} />
                          <LearningDepthBadge depth={entity.learning_depth || 0} showIcon showDepth />
                          {entity.domain_name && (
                            <span className="text-gray-500">{entity.domain_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Intermediate Topics */}
          {intermediate.length > 0 && (
            <section className="neuro-card">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
                Intermediate Topics (Difficulty 4-6)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {intermediate.map((entity) => (
                  <div key={entity.id} className="neuro-inset p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-200 mb-4">{entity.name}</h3>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Difficulty Indicator</div>
                        <DifficultyIndicator score={entity.difficulty_score} showDescription size="sm" />
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-2">Difficulty Score</div>
                        <DifficultyScore score={entity.difficulty_score} showBar />
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-2">Learning Depth</div>
                        <LearningDepthIndicator
                          depth={entity.learning_depth || 0}
                          maxDepth={5}
                          showBar
                          size="sm"
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-4 text-sm">
                          <DifficultyBadge score={entity.difficulty_score} showIcon showDescription={false} />
                          <LearningDepthBadge depth={entity.learning_depth || 0} showIcon showDepth />
                          {entity.domain_name && (
                            <span className="text-gray-500">{entity.domain_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Advanced Topics */}
          {advanced.length > 0 && (
            <section className="neuro-card">
              <h2 className="text-2xl font-semibold text-red-400 mb-6">
                Advanced Topics (Difficulty 7-10)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advanced.map((entity) => (
                  <div key={entity.id} className="neuro-inset p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-200 mb-4">{entity.name}</h3>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Difficulty Indicator</div>
                        <DifficultyIndicator score={entity.difficulty_score} showDescription size="sm" />
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-2">Difficulty Score</div>
                        <DifficultyScore score={entity.difficulty_score} showBar />
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-2">Learning Depth</div>
                        <LearningDepthIndicator
                          depth={entity.learning_depth || 0}
                          maxDepth={5}
                          showBar
                          size="sm"
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-4 text-sm">
                          <DifficultyBadge score={entity.difficulty_score} showIcon showDescription={false} />
                          <LearningDepthBadge depth={entity.learning_depth || 0} showIcon showDepth />
                          {entity.domain_name && (
                            <span className="text-gray-500">{entity.domain_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comparison Examples */}
          <section className="neuro-card">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">
              Component Variants
            </h2>

            <div className="space-y-8">
              {/* Difficulty Comparison */}
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-4">Difficulty Comparison</h3>
                <DifficultyComparison
                  scores={entities?.slice(0, 5).map(e => ({
                    label: e.name,
                    score: e.difficulty_score || 0
                  })) || []}
                />
              </div>

              {/* Depth Comparison */}
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-4">Depth Comparison</h3>
                <DepthComparison
                  items={entities?.slice(0, 5).map(e => ({
                    label: e.name,
                    depth: e.learning_depth || 0
                  })) || []}
                />
              </div>

              {/* Depth Path Visualizer */}
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-4">Depth Path Visualizer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DepthPathVisualizer currentDepth={0} targetDepth={3} maxDepth={5} />
                  <DepthPathVisualizer currentDepth={2} targetDepth={4} maxDepth={5} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
