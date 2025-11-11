'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import HamburgerMenu from '@/components/HamburgerMenu'
import Modal from '@/components/Modal'
import { RLPhaseBadge } from '@/components/RLPhaseBadge'
import { getAllRLPhasesData } from '@/lib/utils/rl-phase'
import { Tooltip } from '@/components/Tooltip'
import { LockIcon, TrashIcon } from '@/components/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'

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
  const [currentBloomLevel, setCurrentBloomLevel] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'matrix' | 'stats' | 'masteryTrend' | 'questionHistory'>('matrix')
  const [uniqueQuestions, setUniqueQuestions] = useState<any[]>([])
  const [masteryTrendData, setMasteryTrendData] = useState<any[]>([])
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetBloomLevel, setResetBloomLevel] = useState<number | null>(null)
  const [resetting, setResetting] = useState(false)

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

      // Get dimension matrix (we'll calculate EMA scores client-side)
      const { data: matrixData } = await supabase.rpc('get_topic_dimension_matrix', {
        p_user_id: user.id,
        p_chapter_id: fetchedChapter.id,
        p_topic: topic
      })

      // Store raw matrix data temporarily
      let enhancedMatrix = matrixData || []

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
          .select('rl_phase, current_bloom_level')
          .eq('user_id', user.id)
          .eq('topic_id', topicData.id)
          .single()

        setRlPhase(progressData?.rl_phase || null)
        setCurrentBloomLevel(progressData?.current_bloom_level || 1)

        // Fetch question attempt analysis
        const { data: responses } = await supabase
          .from('user_responses')
          .select(`
            id,
            question_id,
            bloom_level,
            is_correct,
            confidence,
            reward,
            created_at,
            questions (
              id,
              question_text,
              dimension
            )
          `)
          .eq('user_id', user.id)
          .eq('topic_id', topicData.id)
          .order('created_at', { ascending: true })

        if (responses) {
          // Calculate mastery trend over time using EMA (Exponential Moving Average)
          // This matches the calculation used in user_topic_mastery for consistency
          const alpha = 0.3 // EMA smoothing factor (same as RL reward system)
          let ema = responses.length > 0 ? (responses[0].is_correct ? 100 : 0) : 0 // Initialize with first result
          const masteryByResponseIndex = new Map<number, number>()

          if (responses && responses.length > 0) {
            const trendData = responses.map((r: any, idx: number) => {
              // Update EMA: new_ema = alpha * current_result + (1-alpha) * old_ema
              const currentScore = r.is_correct ? 100 : 0
              if (idx > 0) {
                ema = alpha * currentScore + (1 - alpha) * ema
              }

              // Store mastery for this response index
              masteryByResponseIndex.set(idx, ema)

              const date = new Date(r.created_at)

              return {
                index: idx + 1,
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: date.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                mastery: Math.round(ema),
                isCorrect: r.is_correct
              }
            })

            setMasteryTrendData(trendData)
          }

          // Track unique questions with current and previous results
          const uniqueQuestionsMap = new Map()
          responses.forEach((r: any, idx: number) => {
            const qid = r.question_id
            if (!uniqueQuestionsMap.has(qid)) {
              uniqueQuestionsMap.set(qid, {
                question_id: qid,
                question_text: r.questions?.question_text || 'Question',
                dimension: r.questions?.dimension || 'Unknown',
                first_attempt: {
                  is_correct: r.is_correct,
                  reward: r.reward,
                  created_at: r.created_at
                },
                previous_attempt: null,
                current_attempt: {
                  is_correct: r.is_correct,
                  reward: r.reward,
                  created_at: r.created_at,
                  mastery: masteryByResponseIndex.get(idx) || 0
                },
                total_attempts: 1,
                all_results: [r.is_correct]
              })
            } else {
              const existing = uniqueQuestionsMap.get(qid)
              existing.previous_attempt = existing.current_attempt
              existing.current_attempt = {
                is_correct: r.is_correct,
                reward: r.reward,
                created_at: r.created_at,
                mastery: masteryByResponseIndex.get(idx) || 0
              }
              existing.total_attempts++
              existing.all_results.push(r.is_correct)
            }
          })

          setUniqueQuestions(Array.from(uniqueQuestionsMap.values()))

          // Calculate EMA-based mastery for each dimension × Bloom level cell
          // Group responses by bloom_level and dimension
          const cellEMAMap = new Map<string, number>()
          // Reuse alpha from above (0.3)

          responses.forEach((r: any) => {
            const dimension = r.questions?.dimension || 'unknown'
            const bloomLevel = r.bloom_level
            const cellKey = `${bloomLevel}-${dimension}`

            const currentScore = r.is_correct ? 100 : 0
            const existingEMA = cellEMAMap.get(cellKey)

            if (existingEMA === undefined) {
              // First response for this cell
              cellEMAMap.set(cellKey, currentScore)
            } else {
              // Update EMA: new_ema = alpha * current + (1-alpha) * old
              const newEMA = alpha * currentScore + (1 - alpha) * existingEMA
              cellEMAMap.set(cellKey, newEMA)
            }
          })

          // Update matrix data with EMA scores
          enhancedMatrix = enhancedMatrix.map((cell: any) => ({
            ...cell,
            average_score: cellEMAMap.get(`${cell.bloom_level}-${cell.dimension}`) || cell.average_score
          }))
        }
      }

      setMatrix(enhancedMatrix)
      setLoading(false)
    } catch (error) {
      console.error('Error loading dimension matrix:', error)
      setLoading(false)
    }
  }

  const handleResetProgress = async (bloomLevel?: number) => {
    try {
      setResetting(true)
      setShowResetModal(false)

      const response = await fetch('/api/rl/reset-topic-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterData?.id,
          topic_id: summary?.topic_id,
          bloom_level: bloomLevel || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset progress')
      }

      const deletionSummary = [
        `- ${data.deleted.responses} responses`,
        `- ${data.deleted.mastery} mastery records`,
        `- ${data.deleted.armStats} RL stats`,
        `- ${data.deleted.dimensionCoverage} dimension coverage`,
        `- ${data.deleted.progress} progress records`
      ]

      if (data.deleted.sessions > 0) {
        deletionSummary.push(`- ${data.deleted.sessions} learning sessions`)
      }

      if (data.deleted.questions > 0) {
        deletionSummary.push(`- ${data.deleted.questions} AI-generated questions`)
      }

      alert(`✓ ${data.message}\n\nDeleted:\n${deletionSummary.join('\n')}`)

      // Reload the page data
      await loadData()
    } catch (error) {
      console.error('Error resetting progress:', error)
      alert(error instanceof Error ? error.message : 'Failed to reset progress')
    } finally {
      setResetting(false)
      setResetBloomLevel(null)
    }
  }

  const getStatusColor = (status: string, masteryLevel: string, uniqueCount: number, avgScore?: number) => {
    // If no data at all
    if (uniqueCount === 0) return 'text-gray-500'

    // Use avgScore if provided, otherwise use status
    // This allows showing actual mastery color even with insufficient data
    const score = avgScore !== undefined ? avgScore :
                  (status === 'mastered' ? 85 :
                   status === 'proficient' ? 70 :
                   status === 'developing' ? 50 :
                   status === 'struggling' ? 30 : 0)

    // Color based on score, not data sufficiency
    if (masteryLevel === 'deep' || (uniqueCount >= 5 && score >= 80)) {
      return 'text-green-700'
    }
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    if (score < 40) return 'text-red-500'

    return 'text-gray-500'
  }

  const getAvgColor = (avgScore: number, avgUniqueCount: number) => {
    if (avgUniqueCount === 0) return 'text-gray-600'
    // Show color based on actual score, regardless of data sufficiency
    if (avgUniqueCount >= 15 && avgScore >= 80) return 'text-green-700' // Deep mastery (5+ per dimension avg)
    if (avgScore >= 80) return 'text-green-500' // Mastered
    if (avgScore >= 60) return 'text-blue-500' // Proficient
    if (avgScore >= 40) return 'text-yellow-500' // Developing
    return 'text-red-500' // Struggling
  }

  const getStatusLabel = (status: string, masteryLevel: string, uniqueCount: number, totalAttempts: number) => {
    if (uniqueCount === 0) return 'Not Tested'

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
        <div className="neuro-raised max-w-md text-center p-8">
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
    ? [...new Set(matrix.map(m => ({
        key: m.dimension,
        name: m.dimension_name ? m.dimension_name.charAt(0).toUpperCase() + m.dimension_name.slice(1) : m.dimension
      })))]
        .filter((v, i, a) => a.findIndex(t => t.key === v.key) === i)
    : []

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-blue-400 truncate">
            {topic}
          </h1>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'matrix' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            Mastery Matrix
          </button>
          {summary && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
                activeTab === 'stats' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              Overview Stats
            </button>
          )}
          {masteryTrendData.length > 0 && (
            <button
              onClick={() => setActiveTab('masteryTrend')}
              className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
                activeTab === 'masteryTrend' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              Mastery Trend
            </button>
          )}
          {uniqueQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab('questionHistory')}
              className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
                activeTab === 'questionHistory' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              Question History
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {/* Summary Stats Tab */}
          {activeTab === 'stats' && summary && (
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

          {/* Mastery Matrix Tab */}
          {activeTab === 'matrix' && (
            <div>
              {/* Description */}
              <div className="text-sm text-gray-400 mb-6">
                Mastery scores calculated using Exponential Moving Average (EMA), giving more weight to recent performance.
              </div>

              {/* Legend */}
              <div className="mb-6 p-4 neuro-inset rounded-lg">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Mastery Levels:</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Tooltip content={`Struggling\n\nAverage score: Less than 40%\n\nRecommendation: Review fundamentals and practice more`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-gray-500">Struggling (&lt;40%)</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Developing\n\nAverage score: 40-59%\n\nRecommendation: Continue practicing to improve mastery`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-gray-500">Developing (40-59%)</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Proficient\n\nAverage score: 60-79%\n\nRecommendation: Good progress, almost ready to advance`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-gray-500">Proficient (60-79%)</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Mastered\n\nAverage score: 80% or higher\n\nRecommendation: Ready to advance to next level`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-gray-500">Mastered (80%+)</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Deep Mastery\n\n5 or more unique questions answered\n\nAverage score: 80% or higher\n\nRecommendation: Excellent mastery, ready for advanced topics`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-700"></div>
                      <span className="text-gray-500">Deep Mastery (5+, 80%+)</span>
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
                        <th className="p-4 text-center text-gray-400 font-medium border-l border-gray-800">
                          <div className="text-sm">Avg</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixByBloom.map(bloomLevel => {
                        const isRowLocked = bloomLevel.num > currentBloomLevel

                        // Calculate average across all 6 dimensions for this Bloom level
                        const dimensionScores = bloomLevel.dimensions
                          .filter(d => d.unique_questions_count > 0) // Only include tested dimensions
                          .map(d => d.average_score)
                        const avgScore = dimensionScores.length > 0
                          ? dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length
                          : 0
                        const avgUniqueCount = bloomLevel.dimensions
                          .reduce((sum, d) => sum + (d.unique_questions_count || 0), 0)

                        return (
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
                                {isRowLocked ? (
                                  <Tooltip content={`Locked - Complete Level ${bloomLevel.num - 1} to unlock`}>
                                    <div className="inline-flex">
                                      <LockIcon size={16} className="text-gray-600" />
                                    </div>
                                  </Tooltip>
                                ) : uniqueCount === 0 ? (
                                  <div></div>
                                ) : (
                                  <div className="inline-flex items-center gap-2">
                                    <Tooltip
                                      content={`${topic} - ${bloomLevel.name} - ${dim.name}\n\nEMA Score: ${Math.round(cell?.average_score || 0)}%\n\nUnique Questions: ${uniqueCount}\n\nTotal Attempts: ${totalAttempts} (${totalAttempts - uniqueCount} repeats)\n\nStatus: ${getStatusLabel(status, masteryLevel, uniqueCount, totalAttempts)}`}
                                    >
                                      <div className={`${getStatusColor(status, masteryLevel, uniqueCount, cell?.average_score)} relative inline-block`}>
                                        <div className="font-bold text-lg">
                                          {Math.round(cell.average_score)}%
                                        </div>
                                      </div>
                                    </Tooltip>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          <td className="p-4 text-center border-l border-gray-800">
                            {isRowLocked ? (
                              <Tooltip content={`Locked - Complete Level ${bloomLevel.num - 1} to unlock`}>
                                <div className="inline-flex">
                                  <LockIcon size={16} className="text-gray-600" />
                                </div>
                              </Tooltip>
                            ) : avgUniqueCount === 0 ? (
                              <div className="text-gray-600">--</div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <Tooltip content={`${topic} - ${bloomLevel.name}\n\nAverage EMA Score: ${Math.round(avgScore)}%\n\nCalculated from ${dimensionScores.length} tested dimension${dimensionScores.length === 1 ? '' : 's'} (out of 7 total)\n\nTotal Unique Questions: ${avgUniqueCount}`}>
                                  <div className={`${getAvgColor(avgScore, avgUniqueCount)} font-bold text-lg`}>
                                    {Math.round(avgScore)}%
                                  </div>
                                </Tooltip>
                              </div>
                            )}
                          </td>
                        </tr>
                        )
                      })}
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
            </div>
          )}

          {/* Mastery Score Over Time Tab */}
          {activeTab === 'masteryTrend' && (
            <div>
              {masteryTrendData.length >= 1 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">
                    Track your learning progression over time using Exponential Moving Average (EMA). This gives more weight to recent performance while considering your learning history, matching the mastery calculation shown in the heatmap.
                  </div>
                  {masteryTrendData.length < 3 && (
                    <div className="text-sm text-yellow-500 mb-4">
                      Limited data: {masteryTrendData.length} question{masteryTrendData.length === 1 ? '' : 's'} answered. Trend becomes more meaningful with 3+ questions.
                    </div>
                  )}

                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={masteryTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="masteryGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        label={{ value: 'Mastery Score (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#e5e7eb'
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(value: any, name: string, props: any) => {
                          if (name === 'mastery') {
                            return [
                              <div key="tooltip" className="space-y-1">
                                <div className="font-semibold text-blue-400">{value}% Mastery (EMA)</div>
                                <div className="text-xs text-gray-400">
                                  Result: {props.payload.isCorrect ? '✓ Correct' : '✗ Wrong'}
                                </div>
                                <div className="text-xs text-gray-500">{props.payload.fullDate}</div>
                              </div>,
                              ''
                            ]
                          }
                          return [value, name]
                        }}
                        labelFormatter={() => ''}
                      />
                      <Area
                        type="monotone"
                        dataKey="mastery"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#masteryGradient)"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#60a5fa' }}
                      />
                      {/* Reference line for mastery threshold */}
                      <ReferenceLine
                        y={80}
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-green-500 opacity-50"></div>
                      <span>80% = Mastery Threshold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-blue-500"></div>
                      <span>Your Progress</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="neuro-inset p-8 rounded-lg text-center">
                  <div className="text-gray-400 text-lg font-semibold mb-2">
                    No Performance Data Yet
                  </div>
                  <div className="text-sm text-gray-600">
                    Start answering questions to see your mastery trend over time
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question History Tab */}
          {activeTab === 'questionHistory' && (
            <div>
              {uniqueQuestions.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    All unique questions you've encountered for this topic, in chronological order.
                  </p>

                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">#</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Question</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Dimension</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Previous Result</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Current Result</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Reward</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Mastery</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Trend</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Attempts</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">First Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueQuestions.map((q, idx) => {
                        // Calculate trend
                        let trend = '—'
                        let trendColor = 'text-gray-500'

                        if (q.total_attempts === 1) {
                          trend = '—'
                          trendColor = 'text-gray-500'
                        } else if (q.previous_attempt && q.current_attempt) {
                          const prevCorrect = q.previous_attempt.is_correct
                          const currCorrect = q.current_attempt.is_correct

                          if (!prevCorrect && currCorrect) {
                            trend = '↑ Improved'
                            trendColor = 'text-green-400'
                          } else if (prevCorrect && !currCorrect) {
                            trend = '↓ Declined'
                            trendColor = 'text-red-400'
                          } else if (prevCorrect && currCorrect) {
                            trend = '→ Consistent'
                            trendColor = 'text-blue-400'
                          } else {
                            trend = '→ Still Learning'
                            trendColor = 'text-yellow-400'
                          }
                        }

                        return (
                          <tr key={q.question_id} className="border-b border-gray-800 hover:bg-gray-900/30">
                            <td className="py-3 px-3 text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 text-gray-300 max-w-md">
                              <div className="truncate">
                                {q.question_text.substring(0, 80)}...
                              </div>
                            </td>
                            <td className="py-3 px-3 text-gray-400 text-xs">
                              {q.dimension}
                            </td>
                            <td className="py-3 px-3">
                              {q.previous_attempt ? (
                                q.previous_attempt.is_correct ? (
                                  <span className="text-green-400">✓ Correct</span>
                                ) : (
                                  <span className="text-red-400">✗ Wrong</span>
                                )
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {q.current_attempt.is_correct ? (
                                <span className="text-green-400">✓ Correct</span>
                              ) : (
                                <span className="text-red-400">✗ Wrong</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className={q.current_attempt.reward >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {q.current_attempt.reward >= 0 ? '+' : ''}{q.current_attempt.reward.toFixed(1)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={
                                q.current_attempt.mastery >= 80 ? 'text-green-400' :
                                q.current_attempt.mastery >= 60 ? 'text-blue-400' :
                                q.current_attempt.mastery >= 40 ? 'text-yellow-400' :
                                'text-red-400'
                              }>
                                {Math.round(q.current_attempt.mastery)}%
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={trendColor}>
                                {trend}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={q.total_attempts > 1 ? 'text-blue-400' : 'text-gray-500'}>
                                {q.total_attempts}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-500 text-xs">
                              {new Date(q.first_attempt.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                  <div className="mt-4 text-sm text-gray-500">
                    Total: {uniqueQuestions.length} unique questions, {uniqueQuestions.reduce((sum, q) => sum + q.total_attempts, 0)} total attempts
                  </div>
                </div>
              ) : (
                <div className="neuro-inset p-8 rounded-lg text-center">
                  <div className="text-gray-400 text-lg font-semibold mb-2">
                    No Questions Answered Yet
                  </div>
                  <div className="text-sm text-gray-600">
                    Start learning this topic to see your question history here
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone - Reset Entire Topic */}
        <div className="neuro-raised mt-8 border border-red-900/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-500">
                Permanently delete all progress for this topic across all Bloom levels. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => {
                setResetBloomLevel(null)
                setShowResetModal(true)
              }}
              disabled={resetting}
              className="neuro-btn text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300 px-6 py-3 whitespace-nowrap"
            >
              <TrashIcon size={16} />
              {resetting ? 'Resetting...' : 'Reset Entire Topic'}
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Reset */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false)
          setResetBloomLevel(null)
        }}
        title={resetBloomLevel ? `Reset Bloom Level ${resetBloomLevel}?` : "Reset All Bloom Levels?"}
        type="warning"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setShowResetModal(false)
              setResetBloomLevel(null)
            },
            variant: 'secondary'
          },
          {
            label: resetting ? 'Resetting...' : 'Reset Progress',
            onClick: () => {
              if (!resetting) {
                handleResetProgress(resetBloomLevel || undefined)
              }
            },
            variant: 'danger'
          }
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            {resetBloomLevel
              ? `This will permanently delete all progress data for Bloom Level ${resetBloomLevel} (${BLOOM_LEVELS[resetBloomLevel - 1].name}) of this topic.`
              : 'This will permanently delete all progress data for ALL Bloom levels of this topic.'}
          </p>
          <div className="neuro-inset p-4 rounded-lg">
            <div className="text-sm text-gray-400 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>All question responses will be deleted</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Mastery scores will be reset</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>RL learning statistics will be cleared</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Dimension coverage will be reset</span>
              </div>
              {!resetBloomLevel && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>Learning sessions will be deleted</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>AI-generated questions will be deleted</span>
                  </div>
                </>
              )}
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>This action cannot be undone</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
