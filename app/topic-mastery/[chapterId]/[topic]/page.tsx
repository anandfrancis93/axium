'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
  const chapterId = params.chapterId as string
  const topic = decodeURIComponent(params.topic as string)

  const [loading, setLoading] = useState(true)
  const [matrix, setMatrix] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [chapter, setChapter] = useState<any>(null)

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

      // Get chapter details
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('id, name, subject_id, subjects(name)')
        .eq('id', chapterId)
        .single()

      setChapter(chapterData)

      // Get dimension matrix
      const { data: matrixData } = await supabase.rpc('get_topic_dimension_matrix', {
        p_user_id: user.id,
        p_chapter_id: chapterId,
        p_topic: topic
      })

      setMatrix(matrixData || [])

      // Get summary statistics
      const { data: summaryData } = await supabase.rpc('get_topic_dimension_summary', {
        p_user_id: user.id,
        p_chapter_id: chapterId,
        p_topic: topic
      })

      setSummary(summaryData?.[0] || null)

      setLoading(false)
    } catch (error) {
      console.error('Error loading dimension matrix:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string, masteryLevel: string, uniqueCount: number) => {
    // Special handling for deep mastery
    if (status === 'mastered' && masteryLevel === 'deep') {
      return 'bg-gradient-to-br from-green-600 to-green-400'
    }

    // Insufficient data (< 3 unique questions)
    if (status === 'insufficient_data' || uniqueCount < 3) {
      if (uniqueCount === 0) return 'bg-gray-800'
      return 'bg-gray-700 border border-yellow-500/30'
    }

    // Normal mastery statuses
    switch (status) {
      case 'mastered': return 'bg-green-500'
      case 'proficient': return 'bg-blue-500'
      case 'developing': return 'bg-yellow-500'
      case 'struggling': return 'bg-red-500'
      case 'not_tested': return 'bg-gray-800'
      default: return 'bg-gray-800'
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
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/performance/${chapterId}`} className="neuro-btn">
              ← Back to Performance
            </Link>
            <div>
              <div className="text-sm text-gray-500">{chapter?.subjects?.name} • {chapter?.name}</div>
              <h1 className="text-2xl font-bold text-gray-200">
                {topic}
              </h1>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="neuro-stat">
                <div className="text-sm text-blue-400 mb-1">Total Cells</div>
                <div className="text-3xl font-bold text-gray-200">{summary.total_cells}</div>
                <div className="text-xs text-gray-600">6 Bloom × {dimensions.length} Dimensions</div>
              </div>
              <div className="neuro-stat">
                <div className="text-sm text-purple-400 mb-1">Coverage</div>
                <div className="text-3xl font-bold text-gray-200">{summary.coverage_percentage}%</div>
                <div className="text-xs text-gray-600">{summary.tested_cells}/{summary.total_cells} tested</div>
              </div>
              <div className="neuro-stat">
                <div className="text-sm text-cyan-400 mb-1">Min Questions</div>
                <div className="text-3xl font-bold text-gray-200">{summary.cells_with_min_questions}</div>
                <div className="text-xs text-gray-600">cells with 3+ unique</div>
              </div>
              <div className="neuro-stat">
                <div className="text-sm text-green-400 mb-1">Initial Mastery</div>
                <div className="text-3xl font-bold text-gray-200">{summary.mastered_cells}</div>
                <div className="text-xs text-gray-600">{summary.mastery_percentage}% of total</div>
              </div>
              <div className="neuro-stat">
                <div className="text-sm text-yellow-400 mb-1 flex items-center gap-1">
                  Deep Mastery <span className="text-lg">★</span>
                </div>
                <div className="text-3xl font-bold text-gray-200">
                  {summary.deep_mastery_cells || 0}
                </div>
                <div className="text-xs text-gray-600">5+ unique questions</div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Legend */}
        <div className="neuro-card mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Adaptive Mastery Levels:</h3>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-800"></div>
              <span className="text-gray-500">Not Tested (0 unique)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-700 border border-yellow-500/30"></div>
              <span className="text-gray-500">Insufficient Data (&lt;3 unique)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-gray-500">Struggling (3+ unique, &lt;40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-gray-500">Developing (3+ unique, 40-59%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-gray-500">Proficient (3+ unique, 60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-500">Initial Mastery (3+ unique, 80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-green-600 to-green-400 relative">
                <span className="absolute -top-0.5 -right-0.5 text-yellow-300 text-xs">★</span>
              </div>
              <span className="text-gray-500">Deep Mastery (5+ unique, 80%+)</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <strong>Note:</strong> Spaced repetition repeats do not count toward unique questions. Only new questions count for mastery progress.
          </div>
        </div>

        {/* Dimension Matrix */}
        <div className="neuro-card overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">
            Comprehensive Mastery Matrix (Bloom × Dimension)
          </h2>

          {dimensions.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-[#1a1a1a] text-left p-3 text-gray-400 font-medium border-r border-gray-800">
                    Bloom Level
                  </th>
                  {dimensions.map(dim => (
                    <th key={dim.key} className="p-3 text-center text-gray-400 font-medium min-w-[120px]">
                      <div className="text-xs">{dim.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixByBloom.map(bloomLevel => (
                  <tr key={bloomLevel.num} className="border-t border-gray-800">
                    <td className="sticky left-0 bg-[#1a1a1a] p-3 font-medium text-gray-300 border-r border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400">L{bloomLevel.num}</span>
                        <span className="text-xs text-gray-600">{bloomLevel.name}</span>
                      </div>
                    </td>
                    {dimensions.map(dim => {
                      const cell = bloomLevel.dimensions.find(d => d.dimension === dim.key)
                      const uniqueCount = cell?.unique_questions_count || 0
                      const totalAttempts = cell?.total_attempts || 0
                      const status = cell?.mastery_status || 'not_tested'
                      const masteryLevel = cell?.mastery_level || 'none'

                      return (
                        <td key={`${bloomLevel.num}-${dim.key}`} className="p-2">
                          <div
                            className={`w-full h-16 rounded ${getStatusColor(status, masteryLevel, uniqueCount)} flex flex-col items-center justify-center text-white text-xs transition-all hover:scale-105 cursor-help relative`}
                            title={`${topic} - ${bloomLevel.name} - ${dim.name}\nScore: ${cell?.average_score || 0}%\nUnique Questions: ${uniqueCount}\nTotal Attempts: ${totalAttempts} (${totalAttempts - uniqueCount} repeats)\nStatus: ${getStatusLabel(status, masteryLevel, uniqueCount, totalAttempts)}`}
                          >
                            {uniqueCount > 0 ? (
                              <>
                                <div className="font-bold text-lg">
                                  {Math.round(cell.average_score)}%
                                </div>
                                <div className="text-[10px] opacity-75 flex items-center gap-1">
                                  <span>{uniqueCount} unique</span>
                                  {totalAttempts > uniqueCount && (
                                    <span className="text-blue-200">+{totalAttempts - uniqueCount}</span>
                                  )}
                                </div>
                                {masteryLevel === 'deep' && (
                                  <div className="absolute top-0.5 right-0.5">
                                    <span className="text-yellow-300 text-lg">★</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-gray-500 text-2xl">-</div>
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
                href={`/learn/${chapterId}`}
                className="neuro-btn-primary inline-block mt-4"
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
                    <div className="text-purple-400 font-bold mb-2">Level {level.num}</div>
                    <div className="text-xs text-gray-600 mb-3">{level.name}</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tested:</span>
                        <span className="text-blue-400">{stats?.tested || 0}/{stats?.total || 0}</span>
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
