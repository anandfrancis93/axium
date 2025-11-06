'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import HamburgerMenu from '@/components/HamburgerMenu'
import { RLPhaseBadge } from '@/components/RLPhaseBadge'
import { getAllRLPhasesData } from '@/lib/utils/rl-phase'
import { Tooltip } from '@/components/Tooltip'

const BLOOM_LEVELS = [
  { num: 1, name: 'Remember' },
  { num: 2, name: 'Understand' },
  { num: 3, name: 'Apply' },
  { num: 4, name: 'Analyze' },
  { num: 5, name: 'Evaluate' },
  { num: 6, name: 'Create' }
]

export default function TopicMasteryPage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const chapter = params.chapter as string
  const topic = decodeURIComponent(params.topic as string)

  const [loading, setLoading] = useState(true)
  const [matrix, setMatrix] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [chapterData, setChapterData] = useState<any>(null)
  const [rlPhase, setRlPhase] = useState<string | null>(null)
  const [statsExpanded, setStatsExpanded] = useState(true)
  const [matrixExpanded, setMatrixExpanded] = useState(true)
  const [bloomExpanded, setBloomExpanded] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get chapter details by slug
      const { data: fetchedChapter } = await supabase
        .from('chapters')
        .select('id, name, slug, subject_id, subjects(name)')
        .eq('slug', chapter)
        .single()

      setChapterData(fetchedChapter)

      if (!fetchedChapter) return

      // Get dimension matrix
      const { data: matrixData } = await supabase.rpc('get_topic_dimension_matrix', {
        p_user_id: user.id,
        p_chapter_id: fetchedChapter.id,
        p_topic: topic
      })

      setMatrix(matrixData || [])

      // Get summary statistics
      const { data: summaryData } = await supabase.rpc('get_topic_dimension_summary', {
        p_user_id: user.id,
        p_chapter_id: fetchedChapter.id,
        p_topic: topic
      })

      setSummary(summaryData?.[0] || null)

      // Get RL phase from user_progress
      const { data: topicData } = await supabase
        .from('topics')
        .select('id')
        .eq('chapter_id', fetchedChapter.id)
        .eq('name', topic)
        .single()

      if (topicData) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('rl_phase')
          .eq('user_id', user.id)
          .eq('topic_id', topicData.id)
          .single()

        setRlPhase(progressData?.rl_phase || null)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading dimension matrix:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string, masteryLevel: string, uniqueCount: number) => {
    if (status === 'mastered' && masteryLevel === 'deep') {
      return 'text-green-700'
    }

    if (status === 'insufficient_data' || uniqueCount < 3) {
      if (uniqueCount === 0) return 'text-gray-500'
      return 'text-yellow-500'
    }

    switch (status) {
      case 'mastered': return 'text-green-500'
      case 'proficient': return 'text-blue-500'
      case 'developing': return 'text-yellow-500'
      case 'struggling': return 'text-red-500'
      case 'not_tested': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusLabel = (status: string, masteryLevel: string, uniqueCount: number, totalAttempts: number) => {
    if (uniqueCount === 0) return 'Not Tested'
    if (uniqueCount < 3) return `Need More (${uniqueCount}/3 min)`

    if (status === 'mastered') {
      if (masteryLevel === 'deep') {
        return `Deep Mastery (${uniqueCount} unique)`
      }
      return `Mastered (${uniqueCount} unique)`
    }

    const labels: {[key: string]: string} = {
      'proficient': 'Proficient',
      'developing': 'Developing',
      'struggling': 'Struggling',
    }

    return `${labels[status] || status} (${uniqueCount} unique)`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="neuro-card max-w-md text-center">
          <div className="text-blue-400 text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // Group matrix by bloom level
  const matrixByBloom = BLOOM_LEVELS.map(level => ({
    ...level,
    dimensions: matrix.filter(m => m.bloom_level === level.num)
  }))

  // Get unique dimensions for header
  const dimensions = matrix.length > 0
    ? [...new Set(matrix.map(m => ({ key: m.dimension, name: m.dimension_name })))]
        .filter((v, i, a) => a.findIndex(t => t.key === v.key) === i)
    : []

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="neuro-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-gray-200 truncate">
                {topic}
              </h1>
            </div>
            <HamburgerMenu />
          </div>

          {/* RL Phase Badge */}
          {rlPhase && (
            <Tooltip content={
              <div className="space-y-3">
                {getAllRLPhasesData(rlPhase).map((phase) => (
                  <div key={phase.key}>
                    <div className={phase.isCurrent ? 'text-blue-400 font-semibold' : 'text-gray-300 font-medium'}>
                      {phase.name}{phase.isCurrent && ' (Current)'}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {phase.description}
                    </div>
                  </div>
                ))}
              </div>
            }>
              <RLPhaseBadge phase={rlPhase} showDescription={false} showIcon={false} />
            </Tooltip>
          )}
        </div>

        {/* Summary Stats Section */}
        {summary && (
          <div className="neuro-card mb-8">
            <button
              type="button"
              onClick={() => setStatsExpanded(!statsExpanded)}
              className="w-full flex items-center justify-between mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-200">
                Mastery Overview
              </h2>
              <span className="text-gray-400 text-xl">
                {statsExpanded ? '▼' : '▶'}
              </span>
            </button>

            {statsExpanded && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <Tooltip content={`6 Bloom levels × ${dimensions.length} Dimensions`}>
                  <div className="neuro-stat group">
                    <div className="text-sm text-blue-400 font-medium mb-3">Total Cells</div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                      {summary.total_cells}
                    </div>
                  </div>
                </Tooltip>

                <Tooltip content={`${summary.tested_cells}/${summary.total_cells} cells tested`}>
                  <div className="neuro-stat group">
                    <div className="text-sm text-cyan-400 font-medium mb-3">Coverage</div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                      {summary.coverage_percentage}%
                    </div>
                  </div>
                </Tooltip>

                <Tooltip content="Cells with 3+ unique questions">
                  <div className="neuro-stat group">
                    <div className="text-sm text-blue-400 font-medium mb-3">Min Questions</div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                      {summary.cells_with_min_questions}
                    </div>
                  </div>
                </Tooltip>

                <Tooltip content={`${summary.mastery_percentage}% of total cells`}>
                  <div className="neuro-stat group">
                    <div className="text-sm text-green-400 font-medium mb-3">Mastered</div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                      {summary.mastered_cells}
                    </div>
                  </div>
                </Tooltip>

                <Tooltip content="5+ unique questions at 80%+">
                  <div className="neuro-stat group">
                    <div className="text-sm text-green-400 font-medium mb-3">Deep Mastery</div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                      {summary.deep_mastery_cells || 0}
                    </div>
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        )}

        {/* Mastery Matrix Section */}
        <div className="neuro-card mb-8">
          <button
            type="button"
            onClick={() => setMatrixExpanded(!matrixExpanded)}
            className="w-full flex items-center justify-between mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-200">
              Comprehensive Mastery Matrix
            </h2>
            <span className="text-gray-400 text-xl">
              {matrixExpanded ? '▼' : '▶'}
            </span>
          </button>

          {matrixExpanded && (
            <>
              {/* Legend */}
              <div className="mb-6 p-4 neuro-inset rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Mastery Levels:</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Tooltip content="0 unique questions">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-800"></div>
                      <span className="text-gray-500">Not Tested</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="<3 unique questions">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-700 border border-yellow-500/30"></div>
                      <span className="text-gray-500">Insufficient</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="3+ unique, <40%">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-gray-500">Struggling</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="3+ unique, 40-59%">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-gray-500">Developing</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="3+ unique, 60-79%">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-gray-500">Proficient</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="3+ unique, 80%+">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-gray-500">Mastered</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="5+ unique, 80%+">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-700"></div>
                      <span className="text-gray-500">Deep Mastery</span>
                    </div>
                  </Tooltip>
                </div>
              </div>

              {/* Matrix Table */}
              {dimensions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-[#0a0a0a] text-left p-4 text-gray-400 font-medium border-r border-gray-800">
                          Bloom Level
                        </th>
                        {dimensions.map(dim => (
                          <th key={dim.key} className="p-4 text-center text-gray-400 font-medium min-w-[120px]">
                            <div className="text-sm">{dim.name}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixByBloom.map(bloomLevel => (
                        <tr key={bloomLevel.num} className="border-t border-gray-800">
                          <td className="sticky left-0 z-10 bg-[#0a0a0a] p-4 font-medium text-gray-200 border-r border-gray-800">
                            <div className="flex items-center gap-2">
                              <span className="text-white">L{bloomLevel.num}</span>
                              <span className="text-sm text-gray-500">{bloomLevel.name}</span>
                            </div>
                          </td>
                          {dimensions.map(dim => {
                            const cell = bloomLevel.dimensions.find(d => d.dimension === dim.key)
                            const uniqueCount = cell?.unique_questions_count || 0
                            const totalAttempts = cell?.total_attempts || 0
                            const status = cell?.mastery_status || 'not_tested'
                            const masteryLevel = cell?.mastery_level || 'none'

                            return (
                              <td key={`${bloomLevel.num}-${dim.key}`} className="p-4 text-center">
                                <Tooltip
                                  content={`${topic} - ${bloomLevel.name} - ${dim.name}\nScore: ${cell?.average_score || 0}%\nUnique Questions: ${uniqueCount}\nTotal Attempts: ${totalAttempts} (${totalAttempts - uniqueCount} repeats)\nStatus: ${getStatusLabel(status, masteryLevel, uniqueCount, totalAttempts)}`}
                                >
                                  <div className={`${getStatusColor(status, masteryLevel, uniqueCount)} relative inline-block`}>
                                    {uniqueCount > 0 ? (
                                      <div className="font-bold text-lg">
                                        {Math.round(cell.average_score)}%
                                      </div>
                                    ) : (
                                      <div className="text-lg">-</div>
                                    )}
                                  </div>
                                </Tooltip>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="neuro-inset p-8 rounded-lg text-center">
                  <div className="text-gray-400 text-lg font-semibold mb-2">
                    No data yet
                  </div>
                  <div className="text-sm text-gray-600">
                    Start learning to see your mastery matrix
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bloom Level Breakdown Section */}
        {summary?.dimensions_per_bloom && (
          <div className="neuro-card">
            <button
              type="button"
              onClick={() => setBloomExpanded(!bloomExpanded)}
              className="w-full flex items-center justify-between mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-200">
                Progress by Bloom Level
              </h2>
              <span className="text-gray-400 text-xl">
                {bloomExpanded ? '▼' : '▶'}
              </span>
            </button>

            {bloomExpanded && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {BLOOM_LEVELS.map(level => {
                  const stats = summary.dimensions_per_bloom[level.num.toString()]
                  return (
                    <div key={level.num} className="neuro-stat group">
                      <div className="text-blue-400 font-bold mb-2">Level {level.num}</div>
                      <div className="text-sm text-gray-500 mb-4">{level.name}</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tested:</span>
                          <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">
                            {stats?.tested || 0}/{stats?.total || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mastered:</span>
                          <span className="text-green-400 group-hover:text-green-300 transition-colors">
                            {stats?.mastered || 0}/{stats?.total || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
