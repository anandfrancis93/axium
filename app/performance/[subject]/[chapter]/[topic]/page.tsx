'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import HamburgerMenu from '@/components/HamburgerMenu'
import { RLPhaseBadge } from '@/components/RLPhaseBadge'
import { getRLPhaseContext } from '@/lib/utils/rl-phase'

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
    // Special handling for deep mastery
    if (status === 'mastered' && masteryLevel === 'deep') {
      return 'text-green-700'
    }

    // Insufficient data (< 3 unique questions)
    if (status === 'insufficient_data' || uniqueCount < 3) {
      if (uniqueCount === 0) return 'text-gray-500'
      return 'text-yellow-500'
    }

    // Normal mastery statuses
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
          <div className="text-blue-400 text-lg">Loading dimension matrix...</div>
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
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0 flex-shrink">
              <div className="text-sm text-gray-500 truncate">{chapterData?.subjects?.name} • {chapterData?.name}</div>
              <h1 className="text-2xl font-bold text-gray-200 truncate">
                {topic}
              </h1>
              {rlPhase && (
                <div className="mt-3">
                  <RLPhaseBadge phase={rlPhase} showDescription={false} />
                  <div className="mt-2 neuro-inset p-3 rounded-lg max-w-2xl">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-400 text-lg flex-shrink-0">ℹ️</div>
                      <div className="text-sm text-gray-400 leading-relaxed">
                        {getRLPhaseContext(rlPhase)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <HamburgerMenu />
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="neuro-stat cursor-help" title="6 Bloom × {dimensions.length} Dimensions">
                <div className="text-sm text-blue-400 mb-1">Total Cells</div>
                <div className="text-3xl font-bold text-gray-200">{summary.total_cells}</div>
              </div>
              <div className="neuro-stat cursor-help" title={`${summary.tested_cells}/${summary.total_cells} tested`}>
                <div className="text-sm text-cyan-400 mb-1">Coverage</div>
                <div className="text-3xl font-bold text-gray-200">{summary.coverage_percentage}%</div>
              </div>
              <div className="neuro-stat cursor-help" title="cells with 3+ unique">
                <div className="text-sm text-blue-400 mb-1">Min Questions</div>
                <div className="text-3xl font-bold text-gray-200">{summary.cells_with_min_questions}</div>
              </div>
              <div className="neuro-stat cursor-help" title={`${summary.mastery_percentage}% of total`}>
                <div className="text-sm text-green-400 mb-1">Initial Mastery</div>
                <div className="text-3xl font-bold text-gray-200">{summary.mastered_cells}</div>
              </div>
              <div className="neuro-stat cursor-help" title="5+ unique questions">
                <div className="text-sm text-cyan-400 mb-1">Deep Mastery</div>
                <div className="text-3xl font-bold text-gray-200">
                  {summary.deep_mastery_cells || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Legend */}
        <div className="neuro-card mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Adaptive Mastery Levels:</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 cursor-help" title="0 unique questions">
              <div className="w-4 h-4 rounded bg-gray-800"></div>
              <span className="text-gray-500">Not Tested</span>
            </div>
            <div className="flex items-center gap-2 cursor-help" title="<3 unique questions">
              <div className="w-4 h-4 rounded bg-gray-700 border border-yellow-500/30"></div>
              <span className="text-gray-500">Insufficient Data</span>
            </div>
            <div className="flex items-center gap-2 cursor-help" title="3+ unique, <40%">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-gray-500">Struggling</span>
            </div>
            <div className="flex items-center gap-2 cursor-help" title="3+ unique, 40-59%">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-gray-500">Developing</span>
            </div>
            <div className="flex items-center gap-2 cursor-help" title="3+ unique, 60-79%">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-gray-500">Proficient</span>
            </div>
            <div className="flex items-center gap-2 cursor-help" title="3+ unique, 80%+">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-500">Initial Mastery</span>
            </div>
            <div className="flex items-center gap-2 cursor-help" title="5+ unique, 80%+">
              <div className="w-4 h-4 rounded bg-green-700"></div>
              <span className="text-gray-500">Deep Mastery</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <strong>Note:</strong> Spaced repetition repeats do not count toward unique questions. Only new questions count for mastery progress.
          </div>
        </div>

        {/* Dimension Matrix */}
        <div className="neuro-card overflow-x-auto scrollbar-custom pb-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">
            Comprehensive Mastery Matrix (Bloom × Dimension)
          </h2>

          {dimensions.length > 0 ? (
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
                          <div
                            className={`${getStatusColor(status, masteryLevel, uniqueCount)} cursor-help relative inline-block`}
                            title={`${topic} - ${bloomLevel.name} - ${dim.name}\nScore: ${cell?.average_score || 0}%\nUnique Questions: ${uniqueCount}\nTotal Attempts: ${totalAttempts} (${totalAttempts - uniqueCount} repeats)\nStatus: ${getStatusLabel(status, masteryLevel, uniqueCount, totalAttempts)}`}
                          >
                            {uniqueCount > 0 ? (
                              <>
                                <div className="font-bold text-lg">
                                  {Math.round(cell.average_score)}%
                                </div>
                                <div className="text-xs opacity-75 flex items-center gap-1 justify-center">
                                  <span>{uniqueCount}</span>
                                  {totalAttempts > uniqueCount && (
                                    <span>+{totalAttempts - uniqueCount}</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-lg">-</div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-lg mb-2">No data yet</div>
              <div className="text-sm">Start learning to see your mastery matrix!</div>
              <Link
                href={`/subjects/${subject}/${chapter}/quiz`}
                className="neuro-btn inline-block mt-4 text-blue-400"
              >
                Start Learning
              </Link>
            </div>
          )}
        </div>

        {/* Bloom Level Breakdown */}
        {summary?.dimensions_per_bloom && (
          <div className="neuro-card mt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Progress by Bloom Level</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {BLOOM_LEVELS.map(level => {
                const stats = summary.dimensions_per_bloom[level.num.toString()]
                return (
                  <div key={level.num} className="neuro-inset p-4 rounded-lg">
                    <div className="text-blue-400 font-bold mb-2">Level {level.num}</div>
                    <div className="text-sm text-gray-500 mb-3">{level.name}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tested:</span>
                        <span className="text-cyan-400">{stats?.tested || 0}/{stats?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mastered:</span>
                        <span className="text-green-400">{stats?.mastered || 0}/{stats?.total || 0}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
