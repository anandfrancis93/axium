'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import HamburgerMenu from '@/components/HamburgerMenu'
import { RLPhaseBadge } from '@/components/RLPhaseBadge'
import { getAllRLPhasesData } from '@/lib/utils/rl-phase'
import { Tooltip } from '@/components/Tooltip'
import { LockIcon, InfoIcon, TrendingUpIcon } from '@/components/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'
import { ChapterMasteryOverview } from '@/components/ChapterMasteryOverview'

const BLOOM_LEVELS = [
  { num: 1, name: 'Remember' },
  { num: 2, name: 'Understand' },
  { num: 3, name: 'Apply' },
  { num: 4, name: 'Analyze' },
  { num: 5, name: 'Evaluate' },
  { num: 6, name: 'Create' }
]

// All possible knowledge dimensions
const ALL_DIMENSIONS = [
  'definition',
  'example',
  'comparison',
  'implementation',
  'scenario',
  'troubleshooting',
  'pitfalls'
]

// Helper function to capitalize dimension names
function capitalizeDimension(dimension: string): string {
  return dimension.charAt(0).toUpperCase() + dimension.slice(1)
}

export default function TopicMasteryPage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const chapter = params.chapter as string
  const topic = decodeURIComponent(params.topic as string)

  const [loading, setLoading] = useState(true)
  const [chapterData, setChapterData] = useState<any>(null)
  const [rlPhase, setRlPhase] = useState<string | null>(null)
  const [currentBloomLevel, setCurrentBloomLevel] = useState<number>(1)
  const [dimensionStats, setDimensionStats] = useState<any[]>([])
  const [bloomLevelStats, setBloomLevelStats] = useState<Record<number, any>>({})
  const [bloomLevelDimensions, setBloomLevelDimensions] = useState<Record<number, any[]>>({})
  const [bloomLevelTopicDimensions, setBloomLevelTopicDimensions] = useState<Record<number, any[]>>({})
  const [masteryTrendData, setMasteryTrendData] = useState<any[]>([])
  const [uniqueQuestions, setUniqueQuestions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'all-levels' | 'trend' | 'history'>('all-levels')
  const [selectedBloomLevel, setSelectedBloomLevel] = useState<number | null>(null)

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

      // Get topic data
      const { data: topicData } = await supabase
        .from('topics')
        .select('id')
        .eq('chapter_id', fetchedChapter.id)
        .eq('name', topic)
        .single()

      if (!topicData) return

      // Get RL phase and current Bloom level
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('rl_phase, current_bloom_level')
        .eq('user_id', user.id)
        .eq('topic_id', topicData.id)
        .single()

      setRlPhase(progressData?.rl_phase || null)
      setCurrentBloomLevel(progressData?.current_bloom_level || 1)

      // Get all questions for this specific topic
      const { data: allQuestions } = await supabase
        .from('questions')
        .select('dimension, bloom_level')
        .eq('topic_id', topicData.id)

      // Get all responses for this topic with selection method from RL decision log
      const { data: responses } = await supabase
        .from('user_responses')
        .select(`
          id,
          question_id,
          bloom_level,
          is_correct,
          confidence,
          reward,
          recognition_method,
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

      // Get reward components for mastery calculation
      const { data: rewardLogs } = await supabase
        .from('rl_decision_log')
        .select('response_id, reward_components')
        .eq('decision_type', 'reward_calculation')
        .in('response_id', responses?.map(r => r.id) || [])

      const rewardComponentsMap = new Map()
      rewardLogs?.forEach((log: any) => {
        rewardComponentsMap.set(log.response_id, log.reward_components)
      })

      // Get selection methods from arm_selection logs
      const { data: selectionLogs } = await supabase
        .from('rl_decision_log')
        .select('question_id, state_snapshot')
        .eq('decision_type', 'arm_selection')
        .in('question_id', responses?.map(r => r.question_id) || [])

      const selectionMethodMap = new Map()
      selectionLogs?.forEach((log: any) => {
        selectionMethodMap.set(log.question_id, log.state_snapshot?.selection_method || 'thompson_sampling')
      })

      if (responses && responses.length > 0) {
        // Calculate mastery trend over time
        let currentMastery = 0
        const masteryByResponseIndex = new Map<number, number>()

        const trendData = responses.map((r: any, idx: number) => {
          const rewardComponents = rewardComponentsMap.get(r.id)

          if (rewardComponents && rewardComponents.calibration !== undefined && rewardComponents.recognition !== undefined) {
            const bloomMultiplier = r.bloom_level >= 4 ? 9 : 10
            const qualityScore = (rewardComponents.calibration + rewardComponents.recognition) / 2.0
            const learningGain = qualityScore * bloomMultiplier
            currentMastery = Math.max(-100, Math.min(100, currentMastery + learningGain))
          } else {
            const currentScore = r.is_correct ? 100 : 0
            if (idx > 0) {
              const alpha = 0.3
              currentMastery = alpha * currentScore + (1 - alpha) * currentMastery
            } else {
              currentMastery = currentScore
            }
          }

          masteryByResponseIndex.set(idx, currentMastery)

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
            mastery: Math.round(currentMastery),
            isCorrect: r.is_correct
          }
        })

        setMasteryTrendData(trendData)

        // Track unique questions
        const uniqueQuestionsMap = new Map()
        responses.forEach((r: any, idx: number) => {
          const qid = r.question_id
          const selectionMethod = selectionMethodMap.get(qid) || 'thompson_sampling'

          if (!uniqueQuestionsMap.has(qid)) {
            uniqueQuestionsMap.set(qid, {
              question_id: qid,
              question_text: r.questions?.question_text || 'Question',
              dimension: r.questions?.dimension || 'Unknown',
              selection_method: selectionMethod,
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

        // Calculate dimension stats for CURRENT Bloom level only
        const dimensionStatsMap = new Map<string, any>()

        responses.forEach((r: any) => {
          if (r.bloom_level !== (progressData?.current_bloom_level || 1)) return

          const dimension = r.questions?.dimension || 'unknown'
          const isCorrect = r.is_correct
          const confidence = r.confidence || 0
          const isHighConfidence = confidence >= 3

          // Check if user recalled from memory (not recognition, guess, or random)
          const hasRecall = r.recognition_method === 'memory'

          if (!dimensionStatsMap.has(dimension)) {
            dimensionStatsMap.set(dimension, {
              dimension,
              masteryCount: 0,        // Correct + High Conf + Memory
              masteryTotal: 0,        // High Conf + Memory attempts
              highConfidenceCorrect: 0,
              highConfidenceTotal: 0,
              lowConfidenceCorrect: 0,
              wrongAnswers: 0,
              totalCorrect: 0,
              totalAttempts: 0
            })
          }

          const stats = dimensionStatsMap.get(dimension)
          stats.totalAttempts++

          if (isHighConfidence) {
            stats.highConfidenceTotal++
            if (isCorrect) {
              stats.highConfidenceCorrect++
              stats.totalCorrect++
            } else {
              stats.wrongAnswers++
            }

            // Track mastery (high confidence + recall)
            if (hasRecall) {
              stats.masteryTotal++
              if (isCorrect) {
                stats.masteryCount++
              }
            }
          } else {
            if (isCorrect) {
              stats.lowConfidenceCorrect++
              stats.totalCorrect++
            } else {
              stats.wrongAnswers++
            }
          }
        })

        const dimensionStatsArray = Array.from(dimensionStatsMap.values()).map(stats => ({
          dimension: stats.dimension,
          mastery: stats.masteryTotal > 0
            ? (stats.masteryCount / stats.masteryTotal) * 100
            : 0,
          rawAccuracy: stats.totalAttempts > 0
            ? (stats.totalCorrect / stats.totalAttempts) * 100
            : 0,
          masteryCount: stats.masteryCount,
          masteryTotal: stats.masteryTotal,
          highConfidenceCorrect: stats.highConfidenceCorrect,
          highConfidenceTotal: stats.highConfidenceTotal,
          lowConfidenceCorrect: stats.lowConfidenceCorrect,
          wrongAnswers: stats.wrongAnswers
        }))

        setDimensionStats(dimensionStatsArray)

        // Calculate stats for ALL Bloom levels
        const bloomStats: Record<number, any> = {}
        const bloomDimensions: Record<number, any[]> = {}

        BLOOM_LEVELS.forEach(level => {
          const levelResponses = responses.filter((r: any) => r.bloom_level === level.num)

          // Get dimensions that have questions for THIS TOPIC at this Bloom level
          const topicDimensionsForLevel = new Set<string>()
          allQuestions?.forEach((q: any) => {
            if (q.bloom_level === level.num && q.dimension) {
              topicDimensionsForLevel.add(q.dimension)
            }
          })

          let highConfCorrect = 0
          let highConfTotal = 0
          let totalCorrect = 0

          // Initialize dimension stats map with ALL 7 dimensions
          const levelDimensionStatsMap = new Map<string, any>()
          ALL_DIMENSIONS.forEach(dimension => {
            levelDimensionStatsMap.set(dimension, {
              dimension,
              masteryCount: 0,
              masteryTotal: 0,
              highConfidenceCorrect: 0,
              highConfidenceTotal: 0,
              lowConfidenceCorrect: 0,
              wrongAnswers: 0,
              totalCorrect: 0,
              totalAttempts: 0,
              hasQuestions: topicDimensionsForLevel.has(dimension) // Mark if this topic has questions for this dimension
            })
          })

          let masteryCount = 0
          let masteryTotal = 0

          levelResponses.forEach((r: any) => {
            const confidence = r.confidence || 0
            const isHighConfidence = confidence >= 3

            // Check if user recalled from memory (not recognition, guess, or random)
            const hasRecall = r.recognition_method === 'memory'

            if (isHighConfidence) {
              highConfTotal++
              if (r.is_correct) {
                highConfCorrect++
                totalCorrect++
              }

              // Track mastery (high confidence + recall)
              if (hasRecall) {
                masteryTotal++
                if (r.is_correct) {
                  masteryCount++
                }
              }
            } else if (r.is_correct) {
              totalCorrect++
            }

            // Track dimension stats for this level
            const dimension = r.questions?.dimension || 'unknown'
            if (!levelDimensionStatsMap.has(dimension)) {
              levelDimensionStatsMap.set(dimension, {
                dimension,
                masteryCount: 0,
                masteryTotal: 0,
                highConfidenceCorrect: 0,
                highConfidenceTotal: 0,
                lowConfidenceCorrect: 0,
                wrongAnswers: 0,
                totalCorrect: 0,
                totalAttempts: 0
              })
            }

            const dimStats = levelDimensionStatsMap.get(dimension)
            dimStats.totalAttempts++

            if (isHighConfidence) {
              dimStats.highConfidenceTotal++
              if (r.is_correct) {
                dimStats.highConfidenceCorrect++
                dimStats.totalCorrect++
              } else {
                dimStats.wrongAnswers++
              }

              // Track mastery for this dimension
              if (hasRecall) {
                dimStats.masteryTotal++
                if (r.is_correct) {
                  dimStats.masteryCount++
                }
              }
            } else {
              if (r.is_correct) {
                dimStats.lowConfidenceCorrect++
                dimStats.totalCorrect++
              } else {
                dimStats.wrongAnswers++
              }
            }
          })

          bloomStats[level.num] = {
            totalAttempts: levelResponses.length,
            mastery: masteryTotal > 0 ? (masteryCount / masteryTotal) * 100 : 0,
            rawAccuracy: levelResponses.length > 0 ? (totalCorrect / levelResponses.length) * 100 : 0,
            status: level.num > (progressData?.current_bloom_level || 1) ? 'locked' :
                    masteryTotal > 0 && (masteryCount / masteryTotal) * 100 >= 80 ? 'mastered' :
                    'progressing'
          }

          bloomDimensions[level.num] = Array.from(levelDimensionStatsMap.values()).map(stats => ({
            dimension: stats.dimension,
            mastery: stats.masteryTotal > 0
              ? (stats.masteryCount / stats.masteryTotal) * 100
              : 0,
            rawAccuracy: stats.totalAttempts > 0
              ? (stats.totalCorrect / stats.totalAttempts) * 100
              : 0,
            masteryCount: stats.masteryCount,
            masteryTotal: stats.masteryTotal,
            highConfidenceCorrect: stats.highConfidenceCorrect,
            highConfidenceTotal: stats.highConfidenceTotal,
            lowConfidenceCorrect: stats.lowConfidenceCorrect,
            wrongAnswers: stats.wrongAnswers,
            totalCorrect: stats.totalCorrect,
            totalAttempts: stats.totalAttempts,
            hasQuestions: stats.hasQuestions
          }))
        })

        setBloomLevelStats(bloomStats)
        setBloomLevelDimensions(bloomDimensions)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading dimension matrix:', error)
      setLoading(false)
    }
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
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('all-levels')}
            className={`neuro-btn ${activeTab === 'all-levels' ? 'text-blue-400' : 'text-gray-300'}`}
          >
            All Bloom Levels
          </button>
          {masteryTrendData.length >= 3 && (
            <button
              type="button"
              onClick={() => setActiveTab('trend')}
              className={`neuro-btn ${activeTab === 'trend' ? 'text-blue-400' : 'text-gray-300'}`}
            >
              Mastery Trend
            </button>
          )}
          {uniqueQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`neuro-btn ${activeTab === 'history' ? 'text-blue-400' : 'text-gray-300'}`}
            >
              Question History ({uniqueQuestions.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div>
          {/* All Bloom Levels Summary */}
          {activeTab === 'all-levels' && (
            <div>
              <div className="neuro-raised mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                    <TrendingUpIcon size={20} className="text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-200">
                    All Bloom Levels
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {BLOOM_LEVELS.map(level => {
                    const stats = bloomLevelStats[level.num]
                    const isLocked = stats?.status === 'locked' || level.num > currentBloomLevel
                    const isCurrent = level.num === currentBloomLevel
                    const isSelected = selectedBloomLevel === level.num

                    return (
                      <button
                        key={level.num}
                        type="button"
                        onClick={() => {
                          if (!isLocked && stats?.totalAttempts > 0) {
                            setSelectedBloomLevel(isSelected ? null : level.num)
                          }
                        }}
                        disabled={isLocked || !stats?.totalAttempts}
                        className={`neuro-card text-left transition-all ${
                          isLocked ? 'opacity-50 cursor-not-allowed' :
                          stats?.totalAttempts > 0 ? 'cursor-pointer hover:scale-105' :
                          'cursor-not-allowed'
                        } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-gray-400">L{level.num}</div>
                          {isLocked && <LockIcon size={14} className="text-gray-600" />}
                          {stats?.status === 'mastered' && <span className="text-green-400 text-xs">✓</span>}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{level.name}</div>
                        {isLocked ? (
                          <div className="text-xs text-gray-600">Locked</div>
                        ) : stats?.totalAttempts > 0 ? (
                          <>
                            <div className={`text-2xl font-bold mb-1 ${
                              stats.mastery >= 80 ? 'text-green-400' :
                              stats.mastery >= 60 ? 'text-blue-400' :
                              stats.mastery >= 40 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {Math.round(stats.mastery)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {stats.totalAttempts} attempt{stats.totalAttempts === 1 ? '' : 's'}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-600">Not tested</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selected Bloom Level Dimensions */}
              {selectedBloomLevel && bloomLevelDimensions[selectedBloomLevel]?.length > 0 && (
                <div className="neuro-raised">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                        <InfoIcon size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-200">
                          Bloom Level {selectedBloomLevel} - {BLOOM_LEVELS.find(l => l.num === selectedBloomLevel)?.name}
                        </h2>
                        <p className="text-sm text-gray-400">
                          Performance across knowledge dimensions
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBloomLevel(null)}
                      className="neuro-btn text-gray-400 text-sm"
                    >
                      Close
                    </button>
                  </div>

                  {/* Mastery Table (High-Confidence + Recall) */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">
                      Mastery (High-Confidence + Recall)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Topic</th>
                            {bloomLevelDimensions[selectedBloomLevel].map((dim: any) => (
                              <th key={dim.dimension} className="text-center py-3 px-4 text-gray-400 font-medium">
                                {capitalizeDimension(dim.dimension)}
                              </th>
                            ))}
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Overall</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-800 hover:bg-gray-900/30">
                            <td className="py-3 px-4 text-gray-200 font-medium">
                              {topic}
                            </td>
                            {bloomLevelDimensions[selectedBloomLevel].map((dim: any) => {
                              const hasQuestions = dim.hasQuestions
                              const hasMasteryAttempts = dim.masteryTotal > 0
                              const mastery = dim.mastery
                              const colorClass = hasMasteryAttempts
                                ? mastery >= 80 ? 'text-green-400' :
                                  mastery >= 60 ? 'text-blue-400' :
                                  mastery >= 40 ? 'text-yellow-400' :
                                  'text-red-400'
                                : 'text-gray-600'

                              return (
                                <td key={dim.dimension} className="text-center py-3 px-4">
                                  {!hasQuestions ? (
                                    <>
                                      <div className="text-lg font-bold text-gray-700">
                                        —
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        No questions
                                      </div>
                                    </>
                                  ) : hasMasteryAttempts ? (
                                    <>
                                      <div className={`text-lg font-bold ${colorClass}`}>
                                        {Math.round(mastery)}%
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {dim.masteryCount}/{dim.masteryTotal}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-lg font-bold text-gray-600">
                                        —
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        No mastery data
                                      </div>
                                    </>
                                  )}
                                </td>
                              )
                            })}
                            <td className="text-center py-3 px-4">
                              {(() => {
                                // Only include dimensions that have questions for this topic AND have mastery attempts
                                const attemptedDimensions = bloomLevelDimensions[selectedBloomLevel].filter(d => d.hasQuestions && d.masteryTotal > 0)
                                if (attemptedDimensions.length === 0) {
                                  return (
                                    <>
                                      <div className="text-lg font-bold text-gray-600">—</div>
                                      <div className="text-xs text-gray-600">No mastery data</div>
                                    </>
                                  )
                                }
                                const overall = attemptedDimensions.reduce((sum, d) => sum + d.mastery, 0) / attemptedDimensions.length
                                const colorClass = overall >= 80 ? 'text-green-400' :
                                                   overall >= 60 ? 'text-blue-400' :
                                                   overall >= 40 ? 'text-yellow-400' :
                                                   'text-red-400'
                                return (
                                  <>
                                    <div className={`text-lg font-bold ${colorClass}`}>
                                      {Math.round(overall)}%
                                    </div>
                                    <div className="text-xs text-gray-500">Average</div>
                                  </>
                                )
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Raw Accuracy Table (All Attempts) */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">
                      Raw Accuracy (All Attempts)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Topic</th>
                            {bloomLevelDimensions[selectedBloomLevel].map((dim: any) => (
                              <th key={dim.dimension} className="text-center py-3 px-4 text-gray-400 font-medium">
                                {capitalizeDimension(dim.dimension)}
                              </th>
                            ))}
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Overall</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-800 hover:bg-gray-900/30">
                            <td className="py-3 px-4 text-gray-200 font-medium">
                              {topic}
                            </td>
                            {bloomLevelDimensions[selectedBloomLevel].map((dim: any) => {
                              const hasQuestions = dim.hasQuestions
                              const hasAttempts = dim.totalAttempts > 0
                              const rawAccuracy = dim.rawAccuracy
                              const colorClass = hasAttempts
                                ? rawAccuracy >= 80 ? 'text-green-400' :
                                  rawAccuracy >= 60 ? 'text-blue-400' :
                                  rawAccuracy >= 40 ? 'text-yellow-400' :
                                  'text-red-400'
                                : 'text-gray-600'

                              return (
                                <td key={dim.dimension} className="text-center py-3 px-4">
                                  {!hasQuestions ? (
                                    <>
                                      <div className="text-lg font-bold text-gray-700">
                                        —
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        No questions
                                      </div>
                                    </>
                                  ) : hasAttempts ? (
                                    <>
                                      <div className={`text-lg font-bold ${colorClass}`}>
                                        {Math.round(rawAccuracy)}%
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {dim.totalCorrect}/{dim.totalAttempts}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-lg font-bold text-gray-600">
                                        —
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        Not attempted
                                      </div>
                                    </>
                                  )}
                                </td>
                              )
                            })}
                            <td className="text-center py-3 px-4">
                              {(() => {
                                // Only include dimensions that have questions for this topic AND have attempts
                                const attemptedDimensions = bloomLevelDimensions[selectedBloomLevel].filter(d => d.hasQuestions && d.totalAttempts > 0)
                                if (attemptedDimensions.length === 0) {
                                  return (
                                    <>
                                      <div className="text-lg font-bold text-gray-600">—</div>
                                      <div className="text-xs text-gray-600">No attempts</div>
                                    </>
                                  )
                                }
                                const overall = attemptedDimensions.reduce((sum, d) => sum + d.rawAccuracy, 0) / attemptedDimensions.length
                                const colorClass = overall >= 80 ? 'text-green-400' :
                                                   overall >= 60 ? 'text-blue-400' :
                                                   overall >= 40 ? 'text-yellow-400' :
                                                   'text-red-400'
                                return (
                                  <>
                                    <div className={`text-lg font-bold ${colorClass}`}>
                                      {Math.round(overall)}%
                                    </div>
                                    <div className="text-xs text-gray-500">Average</div>
                                  </>
                                )
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-400"></div>
                      <span>Mastered (≥80%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-400"></div>
                      <span>Proficient (60-79%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-400"></div>
                      <span>Developing (40-59%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-400"></div>
                      <span>Needs Work (&lt;40%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mastery Trend */}
          {activeTab === 'trend' && masteryTrendData.length >= 3 && (
            <div className="neuro-raised">
              <div className="flex items-center gap-3 mb-6">
                <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                  <TrendingUpIcon size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Mastery Trend
                </h2>
              </div>

              <div className="text-sm text-gray-400 mb-4">
                Your learning progression over time using Exponential Moving Average (EMA).
              </div>

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
                    domain={[-100, 100]}
                    ticks={[-100, -50, 0, 50, 100]}
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
                            <div className="font-semibold text-blue-400">{value}% Mastery</div>
                            <div className="text-xs text-gray-400">
                              Result: {props.payload.isCorrect ? 'Correct' : 'Wrong'}
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
                  <ReferenceLine
                    y={80}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <ReferenceLine
                    y={0}
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-500 opacity-50"></div>
                  <span>80% = Mastery Threshold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-500 opacity-50"></div>
                  <span>0% = Baseline</span>
                </div>
              </div>
            </div>
          )}

          {/* Question History */}
          {activeTab === 'history' && uniqueQuestions.length > 0 && (
            <div className="neuro-raised">
              <div className="flex items-center gap-3 mb-6">
                <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                  <InfoIcon size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Question History
                </h2>
                <span className="text-sm text-gray-500">
                  ({uniqueQuestions.length} unique)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-center py-2 px-3 text-gray-400 font-medium w-12">#</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium w-96">Question</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium w-32">Dimension</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium w-40">Date & Time</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium w-24">Selected By</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium w-24">Previous</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium w-24">Current</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium w-24">Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueQuestions.map((q, idx) => (
                      <tr key={q.question_id} className="border-b border-gray-800 hover:bg-gray-900/30">
                        <td className="py-3 px-3 text-center text-gray-400 w-12">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 text-gray-200 w-96">
                          <Tooltip content={
                            <div className="max-w-lg">
                              {q.question_text}
                            </div>
                          }>
                            <div className="truncate cursor-help">
                              {q.question_text.substring(0, 80)}...
                            </div>
                          </Tooltip>
                        </td>
                        <td className="py-3 px-3 text-gray-400 w-32">
                          {capitalizeDimension(q.dimension)}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-400 text-xs w-40">
                          {new Date(q.first_attempt.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-3 text-center w-24">
                          {q.selection_method === 'thompson_sampling' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              RL
                            </span>
                          )}
                          {q.selection_method === 'forced_spacing' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              SR
                            </span>
                          )}
                          {q.selection_method === 'dimension_coverage' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              DC
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center w-24">
                          {q.previous_attempt ? (
                            q.previous_attempt.is_correct ? (
                              <span className="text-green-400">Correct</span>
                            ) : (
                              <span className="text-red-400">Wrong</span>
                            )
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center w-24">
                          {q.current_attempt.is_correct ? (
                            <span className="text-green-400">Correct</span>
                          ) : (
                            <span className="text-red-400">Wrong</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center w-24">
                          <span className={q.total_attempts > 1 ? 'text-blue-400' : 'text-gray-400'}>
                            {q.total_attempts}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
