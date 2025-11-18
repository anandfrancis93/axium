'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ShieldIcon, ArrowLeftIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'
import {
  CognitiveDimension,
  COGNITIVE_DIMENSIONS,
  DimensionCoverageByLevel,
  parseDimensionCoverage,
  getCoverageForLevel
} from '@/lib/utils/cognitive-dimensions'

interface TopicDetail {
  topic_id: string
  topic_name: string
  topic_description: string | null
  topic_hierarchy: string | null
  total_attempts: number
  correct_answers: number
  mastery_scores: Record<string, number>
  dimension_coverage: DimensionCoverageByLevel
  last_practiced_at: string
  confidence_calibration_error: number
}

interface DimensionStats {
  attempts: number
  correct: number
  accuracy: number
}

interface BloomLevelDetail {
  level: number
  name: string
  mastery: number
  attempts: number
  correct: number
  accuracy: number
  dimensionStats: Record<string, DimensionStats>
}

interface SpacedRepetitionQuestion {
  id: string
  question_text: string
  bloom_level: number
  cognitive_dimension: string
  next_review_date: string
  question_format: string
}

const BLOOM_LEVELS = [
  { level: 1, name: 'Remember', description: 'Recall facts and basic concepts' },
  { level: 2, name: 'Understand', description: 'Explain ideas or concepts' },
  { level: 3, name: 'Apply', description: 'Use information in new situations' },
  { level: 4, name: 'Analyze', description: 'Draw connections among ideas' },
  { level: 5, name: 'Evaluate', description: 'Justify a stand or decision' },
  { level: 6, name: 'Create', description: 'Produce new or original work' }
]

export default function TopicDetailPage() {
  const router = useRouter()
  const params = useParams()
  const topicName = decodeURIComponent(params.topic as string)

  const [topicDetail, setTopicDetail] = useState<TopicDetail | null>(null)
  const [bloomLevels, setBloomLevels] = useState<BloomLevelDetail[]>([])
  const [spacedRepQuestions, setSpacedRepQuestions] = useState<SpacedRepetitionQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'bloom' | 'spaced_repetition'>('bloom')
  const [expandedBloomLevel, setExpandedBloomLevel] = useState<number | null>(null)

  useEffect(() => {
    fetchTopicDetail()
    fetchSpacedRepetitionQuestions()
  }, [])

  async function fetchTopicDetail() {
    try {
      setLoading(true)
      const supabase = createClient()

      console.log('Fetching topic detail for:', topicName)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found, redirecting')
        router.push('/subjects/it-cs/cybersecurity')
        return
      }

      console.log('User found:', user.id)

      // Fetch topic info and user progress
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('id, name, description, full_name')
        .eq('name', topicName)
        .single()

      console.log('Topic query result:', { topicData, topicError })

      if (topicError || !topicData) {
        console.error('Error fetching topic:', topicError)
        console.error('Topic not found for name:', topicName)
        router.push('/subjects/it-cs/cybersecurity')
        return
      }

      console.log('Topic found:', topicData.name)

      // Fetch user progress for this topic
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicData.id)
        .single()

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error fetching progress:', progressError)
      }

      // If no progress, show empty state
      if (!progressData) {
        setTopicDetail({
          topic_id: topicData.id,
          topic_name: topicData.name,
          topic_description: topicData.description,
          topic_hierarchy: topicData.full_name,
          total_attempts: 0,
          correct_answers: 0,
          mastery_scores: {},
          dimension_coverage: {},
          last_practiced_at: new Date().toISOString(),
          confidence_calibration_error: 0
        })
        setBloomLevels(BLOOM_LEVELS.map(bl => ({
          level: bl.level,
          name: bl.name,
          mastery: 0,
          attempts: 0,
          correct: 0,
          accuracy: 0,
          dimensionStats: {}
        })))
        setLoading(false)
        return
      }

      // Fetch bloom level breakdown from user_responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('user_responses')
        .select('bloom_level, is_correct, cognitive_dimension')
        .eq('user_id', user.id)
        .eq('topic_id', topicData.id)

      if (responsesError) {
        console.error('Error fetching responses:', responsesError)
      }

      // Calculate bloom level stats and dimension stats
      const bloomStats: Record<number, {
        attempts: number
        correct: number
        dimensionStats: Record<string, { attempts: number; correct: number }>
      }> = {}

      responsesData?.forEach(response => {
        if (!bloomStats[response.bloom_level]) {
          bloomStats[response.bloom_level] = { attempts: 0, correct: 0, dimensionStats: {} }
        }
        bloomStats[response.bloom_level].attempts++
        if (response.is_correct) {
          bloomStats[response.bloom_level].correct++
        }

        // Track dimension stats
        if (response.cognitive_dimension) {
          const dim = response.cognitive_dimension
          if (!bloomStats[response.bloom_level].dimensionStats[dim]) {
            bloomStats[response.bloom_level].dimensionStats[dim] = { attempts: 0, correct: 0 }
          }
          bloomStats[response.bloom_level].dimensionStats[dim].attempts++
          if (response.is_correct) {
            bloomStats[response.bloom_level].dimensionStats[dim].correct++
          }
        }
      })

      const bloomLevelDetails = BLOOM_LEVELS.map(bl => {
        const stats = bloomStats[bl.level] || { attempts: 0, correct: 0, dimensionStats: {} }
        const mastery = progressData.mastery_scores?.[bl.level] || 0
        const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0

        // Convert dimension stats to include accuracy
        const dimensionStats: Record<string, DimensionStats> = {}
        Object.entries(stats.dimensionStats).forEach(([dim, dimStat]) => {
          dimensionStats[dim] = {
            attempts: dimStat.attempts,
            correct: dimStat.correct,
            accuracy: dimStat.attempts > 0 ? Math.round((dimStat.correct / dimStat.attempts) * 100) : 0
          }
        })

        return {
          level: bl.level,
          name: bl.name,
          mastery,
          attempts: stats.attempts,
          correct: stats.correct,
          accuracy,
          dimensionStats
        }
      })

      setTopicDetail({
        topic_id: topicData.id,
        topic_name: topicData.name,
        topic_description: topicData.description,
        topic_hierarchy: topicData.full_name,
        total_attempts: progressData.total_attempts,
        correct_answers: progressData.correct_answers,
        mastery_scores: progressData.mastery_scores,
        dimension_coverage: parseDimensionCoverage(progressData.dimension_coverage),
        last_practiced_at: progressData.last_practiced_at,
        confidence_calibration_error: progressData.confidence_calibration_error
      })
      setBloomLevels(bloomLevelDetails)

    } catch (error) {
      console.error('Error in fetchTopicDetail:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSpacedRepetitionQuestions() {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch topic ID
      const { data: topicData } = await supabase
        .from('topics')
        .select('id')
        .eq('name', topicName)
        .single()

      if (!topicData) return

      // Fetch questions with next_review_date for this topic
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, question_text, bloom_level, cognitive_dimension, next_review_date, question_format')
        .eq('topic_id', topicData.id)
        .not('next_review_date', 'is', null)
        .order('next_review_date', { ascending: true })

      if (error) {
        console.error('Error fetching spaced repetition questions:', error)
        return
      }

      setSpacedRepQuestions(questions || [])
    } catch (error) {
      console.error('Error in fetchSpacedRepetitionQuestions:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">Loading topic details...</div>
        </div>
      </div>
    )
  }

  if (!topicDetail) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-gray-400 mb-4">Topic not found</div>
            <button
              onClick={() => router.push('/subjects/it-cs/cybersecurity')}
              className="neuro-btn text-blue-400"
            >
              Back to Cybersecurity
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/subjects/it-cs/cybersecurity')}
            className="neuro-btn text-gray-300 px-4 py-2"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldIcon size={24} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-200 truncate">
                {topicDetail.topic_name}
              </h1>
              {topicDetail.topic_hierarchy && (
                <p className="text-sm text-gray-500 truncate">
                  {topicDetail.topic_hierarchy
                    .replace(/^#+ /gm, '')  // Remove # symbols
                    .split('\n')
                    .filter(line => line.trim())
                    .join(' → ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">

        {/* Tab Navigation */}
        {topicDetail.total_attempts > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bloom')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap ${
              activeTab === 'bloom' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            Bloom Level Breakdown
          </button>
          <button
            onClick={() => setActiveTab('spaced_repetition')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap ${
              activeTab === 'spaced_repetition' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            Spaced Repetition
          </button>
        </div>
        )}

        {/* Bloom Level Breakdown */}
        {activeTab === 'bloom' && (
        <div className="neuro-card">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-gray-200">Bloom Level Breakdown</h2>
            <p className="text-sm text-gray-500 mt-1">Your performance across cognitive complexity levels</p>
          </div>

          <div className="p-6 space-y-4">
            {bloomLevels.map((bl) => {
              const coveredDimensions = getCoverageForLevel(topicDetail.dimension_coverage, bl.level)
              const allDimensions = Object.values(CognitiveDimension)
              const coveragePercentage = Math.round((coveredDimensions.length / 6) * 100)
              const isExpanded = expandedBloomLevel === bl.level

              return (
                <div key={bl.level} className="neuro-inset rounded-lg">
                  {/* Clickable Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedBloomLevel(isExpanded ? null : bl.level)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="neuro-raised w-10 h-10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-400">{bl.level}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-200">{bl.name}</div>
                          <div className="text-xs text-gray-500">
                            {BLOOM_LEVELS[bl.level - 1].description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            bl.mastery >= 80 ? 'text-green-400' :
                            bl.mastery >= 60 ? 'text-yellow-400' :
                            bl.mastery > 0 ? 'text-red-400' :
                            'text-gray-600'
                          }`}>
                            {bl.mastery}%
                          </div>
                          <div className="text-xs text-gray-500">mastery</div>
                        </div>
                        <span className="text-gray-400 text-xl">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 neuro-inset rounded-full overflow-hidden bg-gray-900/50">
                      <div
                        className={`absolute top-0 left-0 bottom-0 rounded-full transition-all ${
                          bl.mastery >= 80 ? 'bg-green-400' :
                          bl.mastery >= 60 ? 'bg-yellow-400' :
                          bl.mastery > 0 ? 'bg-red-400' :
                          'bg-gray-700'
                        }`}
                        style={{ width: `${bl.mastery}%` }}
                      />
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="text-gray-400">
                        <span className="font-medium text-gray-300">{bl.attempts}</span> attempts
                      </div>
                      <div className="text-gray-400">
                        <span className="font-medium text-gray-300">{bl.correct}</span> correct
                      </div>
                      <div className={`font-medium ${
                        bl.accuracy >= 80 ? 'text-green-400' :
                        bl.accuracy >= 60 ? 'text-yellow-400' :
                        bl.accuracy > 0 ? 'text-red-400' :
                        'text-gray-600'
                      }`}>
                        {bl.accuracy}% accuracy
                      </div>
                    </div>
                  </button>

                  {/* Expanded: Cognitive Dimension Coverage */}
                  {isExpanded && bl.attempts > 0 && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-800">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">
                        Cognitive Dimension Coverage
                      </h4>

                      {/* Dimension Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {allDimensions.map(dim => {
                          const isCovered = coveredDimensions.includes(dim)
                          const dimInfo = COGNITIVE_DIMENSIONS[dim]
                          const dimStats = bl.dimensionStats[dim]

                          return (
                            <div
                              key={`${bl.level}-${dim}`}
                              className="neuro-inset p-3 rounded-lg cursor-help"
                              title={dimInfo.description}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className={`text-sm font-semibold ${
                                  isCovered ? 'text-green-400' : 'text-gray-500'
                                }`}>
                                  {dimInfo.name} {dimStats && `(${dimStats.attempts})`}
                                </div>
                                {dimStats && (
                                  <div className={`text-xs font-bold ${
                                    dimStats.accuracy >= 80 ? 'text-green-400' :
                                    dimStats.accuracy >= 60 ? 'text-yellow-400' :
                                    'text-red-400'
                                  }`}>
                                    {dimStats.accuracy}%
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {dimInfo.description.split(',')[0]}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        )}

        {/* Spaced Repetition */}
        {activeTab === 'spaced_repetition' && topicDetail.total_attempts > 0 && (
          <div className="neuro-card p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Spaced Repetition Schedule</h3>
            <p className="text-sm text-gray-500 mb-6">
              Questions scheduled for review based on your calibration performance
            </p>

            {spacedRepQuestions.length === 0 ? (
              <div className="neuro-inset p-8 rounded-lg text-center">
                <p className="text-gray-400">
                  No questions saved for review yet. Answer more questions to build your spaced repetition queue.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {spacedRepQuestions.map((question, index) => {
                  const reviewDate = new Date(question.next_review_date)
                  const now = new Date()
                  const isDue = reviewDate <= now
                  const timeDiff = reviewDate.getTime() - now.getTime()
                  const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
                  const hoursUntil = Math.ceil(timeDiff / (1000 * 60 * 60))

                  let timeText = ''
                  if (isDue) {
                    timeText = 'Due now'
                  } else if (hoursUntil < 24) {
                    timeText = `In ${hoursUntil} ${hoursUntil === 1 ? 'hour' : 'hours'}`
                  } else {
                    timeText = `In ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
                  }

                  const bloomLevel = BLOOM_LEVELS.find(bl => bl.level === question.bloom_level)
                  const dimension = COGNITIVE_DIMENSIONS[question.cognitive_dimension as CognitiveDimension]

                  return (
                    <div
                      key={question.id}
                      className={`neuro-inset p-4 rounded-lg ${isDue ? 'ring-2 ring-yellow-500/50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-300 mb-2 line-clamp-2">
                            {question.question_text}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-blue-400">
                              Bloom {question.bloom_level}: {bloomLevel?.name}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-purple-400">
                              {dimension?.name}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-500 capitalize">
                              {question.question_format.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-semibold mb-1 ${
                            isDue ? 'text-yellow-400' : 'text-gray-400'
                          }`}>
                            {timeText}
                          </div>
                          <div className="text-xs text-gray-600">
                            {reviewDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {topicDetail.total_attempts === 0 && (
          <div className="neuro-inset p-12 rounded-lg text-center">
            <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldIcon size={40} className="text-gray-600" />
            </div>
            <div className="text-gray-400 text-lg font-semibold mb-2">
              No attempts yet
            </div>
            <div className="text-sm text-gray-600 mb-6">
              Start practicing to see your Bloom level performance
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem('quiz_authorized', 'true')
                router.push('/subjects/it-cs/cybersecurity/learn')
              }}
              className="neuro-btn text-blue-400 px-6 py-3"
            >
              Start Quiz
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
