'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import HamburgerMenu from '@/components/HamburgerMenu'
import { RLPhaseBadge } from '@/components/RLPhaseBadge'
import { getAllRLPhasesData } from '@/lib/utils/rl-phase'
import { Tooltip } from '@/components/Tooltip'
import { LockIcon, LockOpenIcon } from '@/components/icons'

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
  const [statsExpanded, setStatsExpanded] = useState(true)
  const [matrixExpanded, setMatrixExpanded] = useState(true)
  const [bloomExpanded, setBloomExpanded] = useState(false)
  const [repeatAnalysisExpanded, setRepeatAnalysisExpanded] = useState(false)
  const [questionHistoryExpanded, setQuestionHistoryExpanded] = useState(false)
  const [repeatQuestions, setRepeatQuestions] = useState<any[]>([])
  const [uniqueQuestions, setUniqueQuestions] = useState<any[]>([])

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
          // Analyze repeated questions
          const questionGroups = new Map<string, any[]>()
          responses.forEach((r: any) => {
            const qid = r.question_id
            if (!questionGroups.has(qid)) {
              questionGroups.set(qid, [])
            }
            questionGroups.get(qid)!.push(r)
          })

          // Find questions answered multiple times
          const repeated: any[] = []
          questionGroups.forEach((attempts, qid) => {
            if (attempts.length > 1) {
              repeated.push({
                question_id: qid,
                question_text: attempts[0]?.questions?.question_text || 'Question',
                dimension: attempts[0]?.questions?.dimension || 'Unknown',
                attempts: attempts.map((a, idx) => ({
                  attempt_num: idx + 1,
                  is_correct: a.is_correct,
                  confidence: a.confidence,
                  reward: a.reward,
                  created_at: a.created_at
                }))
              })
            }
          })

          setRepeatQuestions(repeated)

          // Track unique questions in chronological order
          const uniqueQuestionsMap = new Map()
          responses.forEach((r: any) => {
            if (!uniqueQuestionsMap.has(r.question_id)) {
              uniqueQuestionsMap.set(r.question_id, {
                question_id: r.question_id,
                question_text: r.questions?.question_text || 'Question',
                dimension: r.questions?.dimension || 'Unknown',
                is_correct: r.is_correct,
                reward: r.reward,
                created_at: r.created_at,
                total_attempts: 1
              })
            } else {
              uniqueQuestionsMap.get(r.question_id).total_attempts++
            }
          })

          setUniqueQuestions(Array.from(uniqueQuestionsMap.values()))
        }
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
                  <Tooltip content={`Not Tested\n\nNo questions answered yet for this combination`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-800"></div>
                      <span className="text-gray-500">Not Tested</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Insufficient Data\n\nLess than 3 unique questions answered\n\nNeed more data to determine mastery level`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-700 border border-yellow-500/30"></div>
                      <span className="text-gray-500">Insufficient</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Struggling\n\n3 or more unique questions answered\n\nAverage score: Less than 40%\n\nRecommendation: Review fundamentals and practice more`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-gray-500">Struggling</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Developing\n\n3 or more unique questions answered\n\nAverage score: 40-59%\n\nRecommendation: Continue practicing to improve mastery`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-gray-500">Developing</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Proficient\n\n3 or more unique questions answered\n\nAverage score: 60-79%\n\nRecommendation: Good progress, almost ready to advance`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-gray-500">Proficient</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Mastered\n\n3 or more unique questions answered\n\nAverage score: 80% or higher\n\nRecommendation: Ready to advance to next level`}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-gray-500">Mastered</span>
                    </div>
                  </Tooltip>
                  <Tooltip content={`Deep Mastery\n\n5 or more unique questions answered\n\nAverage score: 80% or higher\n\nRecommendation: Excellent mastery, ready for advanced topics`}>
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
                      {matrixByBloom.map(bloomLevel => {
                        const isRowLocked = bloomLevel.num > currentBloomLevel

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
                                  <Tooltip
                                    content={`${topic} - ${bloomLevel.name} - ${dim.name}\n\nScore: ${cell?.average_score || 0}%\n\nUnique Questions: ${uniqueCount}\n\nTotal Attempts: ${totalAttempts} (${totalAttempts - uniqueCount} repeats)\n\nStatus: ${getStatusLabel(status, masteryLevel, uniqueCount, totalAttempts)}`}
                                  >
                                    <div className={`${getStatusColor(status, masteryLevel, uniqueCount)} relative inline-block`}>
                                      <div className="font-bold text-lg">
                                        {Math.round(cell.average_score)}%
                                      </div>
                                    </div>
                                  </Tooltip>
                                )}
                              </td>
                            )
                          })}
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

        {/* Repeated Questions Analysis Section */}
        {repeatQuestions.length > 0 && (
          <div className="neuro-card">
            <button
              type="button"
              onClick={() => setRepeatAnalysisExpanded(!repeatAnalysisExpanded)}
              className="w-full flex items-center justify-between mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-200">
                Spaced Repetition Analysis
              </h2>
              <span className="text-gray-400 text-xl">
                {repeatAnalysisExpanded ? '▼' : '▶'}
              </span>
            </button>

            {repeatAnalysisExpanded && (
              <div className="space-y-6">
                <p className="text-sm text-gray-400 mb-4">
                  Questions you've answered multiple times (spaced repetition). Shows how your mastery evolves with each attempt.
                </p>

                {repeatQuestions.map((q, idx) => (
                  <div key={q.question_id} className="neuro-inset p-6 rounded-lg">
                    <div className="mb-4">
                      <div className="text-sm text-blue-400 font-semibold mb-1">
                        Question {idx + 1} - {q.dimension}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {q.question_text.substring(0, 100)}...
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">Attempt</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">Result</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">Confidence</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">Reward</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.attempts.map((attempt: any) => (
                            <tr key={attempt.attempt_num} className="border-b border-gray-800">
                              <td className="py-3 px-3 text-gray-300">
                                #{attempt.attempt_num}
                              </td>
                              <td className="py-3 px-3">
                                {attempt.is_correct ? (
                                  <span className="text-green-400">✓ Correct</span>
                                ) : (
                                  <span className="text-red-400">✗ Wrong</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-gray-300">
                                {attempt.confidence}/5
                              </td>
                              <td className="py-3 px-3">
                                <span className={attempt.reward >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {attempt.reward >= 0 ? '+' : ''}{attempt.reward.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-gray-500 text-xs">
                                {new Date(attempt.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Total: {q.attempts.length} attempts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unique Questions History Section */}
        {uniqueQuestions.length > 0 && (
          <div className="neuro-card">
            <button
              type="button"
              onClick={() => setQuestionHistoryExpanded(!questionHistoryExpanded)}
              className="w-full flex items-center justify-between mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-200">
                Question History ({uniqueQuestions.length} unique)
              </h2>
              <span className="text-gray-400 text-xl">
                {questionHistoryExpanded ? '▼' : '▶'}
              </span>
            </button>

            {questionHistoryExpanded && (
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
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">First Result</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Reward</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Attempts</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueQuestions.map((q, idx) => (
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
                            {q.is_correct ? (
                              <span className="text-green-400">✓ Correct</span>
                            ) : (
                              <span className="text-red-400">✗ Wrong</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={q.reward >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {q.reward >= 0 ? '+' : ''}{q.reward.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={q.total_attempts > 1 ? 'text-blue-400' : 'text-gray-500'}>
                              {q.total_attempts}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-500 text-xs">
                            {new Date(q.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  Total: {uniqueQuestions.length} unique questions, {uniqueQuestions.reduce((sum, q) => sum + q.total_attempts, 0)} total attempts
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
