'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ShieldIcon, ArrowLeftIcon } from '@/components/icons'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  CognitiveDimension,
  COGNITIVE_DIMENSIONS,
  DimensionCoverageByLevel,
  parseDimensionCoverage,
  getCoverageForLevel
} from '@/lib/utils/cognitive-dimensions'
import { formatTimeUntilReview } from '@/lib/utils/spaced-repetition'

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
  calibration_slope: number | null
  calibration_stddev: number | null
  calibration_r_squared: number | null
  calibration_mean: number | null
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

  const [questionCount, setQuestionCount] = useState<number>(0)

  useEffect(() => {
    fetchTopicDetail()
    fetchSpacedRepetitionQuestions()
    fetchQuestionCount()
  }, [])

  async function fetchQuestionCount() {
    try {
      const supabase = createClient()
      const { data: topic } = await supabase
        .from('topics')
        .select('id')
        .eq('name', topicName)
        .single()

      if (topic) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id)
        setQuestionCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching question count:', error)
    }
  }

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
          confidence_calibration_error: 0,
          calibration_slope: null,
          calibration_stddev: null,
          calibration_r_squared: null,
          calibration_mean: null
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
        confidence_calibration_error: progressData.confidence_calibration_error,
        calibration_slope: progressData.calibration_slope,
        calibration_stddev: progressData.calibration_stddev,
        calibration_r_squared: progressData.calibration_r_squared,
        calibration_mean: progressData.calibration_mean
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

      // Fetch from user_question_reviews (per-user spaced repetition tracking)
      // joined with questions to get question details
      const { data: reviews, error } = await supabase
        .from('user_question_reviews')
        .select(`
          question_id,
          next_review_date,
          review_count,
          questions!inner(
            id,
            question_text,
            bloom_level,
            cognitive_dimension,
            question_format,
            topic_id
          )
        `)
        .eq('user_id', user.id)
        .eq('questions.topic_id', topicData.id)
        .order('next_review_date', { ascending: true })

      if (error) {
        console.error('Error fetching spaced repetition questions:', error)
        return
      }

      // Transform the data to match expected format
      const questions = (reviews || []).map((review: any) => ({
        id: review.questions.id,
        question_text: review.questions.question_text,
        bloom_level: review.questions.bloom_level,
        cognitive_dimension: review.questions.cognitive_dimension,
        question_format: review.questions.question_format,
        next_review_date: review.next_review_date
      }))

      setSpacedRepQuestions(questions)
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

          <div className="flex items-center gap-3 flex-1">
            <div className="neuro-inset w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
              <Image src="/icon.svg" width={40} height={40} alt="Axium Logo" className="w-10 h-10" />
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
            {questionCount > 0 && (
              <button
                onClick={() => router.push(`/subjects/it-cs/cybersecurity/${encodeURIComponent(topicName)}/quiz`)}
                className="neuro-btn-primary px-6 py-3 flex items-center gap-2"
              >
                Start Quiz
                <span className="text-sm opacity-80">({questionCount} questions)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">







        {/* Spaced Repetition */}
        {topicDetail.total_attempts > 0 && (
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
                  const timeText = formatTimeUntilReview(question.next_review_date)
                  const isDue = timeText === 'Due now'

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
                          <div className={`text-sm font-semibold mb-1 ${isDue ? 'text-yellow-400' : 'text-gray-400'
                            }`}>
                            {timeText}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(question.next_review_date).toLocaleDateString()}
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


      </main>
    </div>
  )
}
