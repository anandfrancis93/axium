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

interface BloomLevelDetail {
  level: number
  name: string
  mastery: number
  attempts: number
  correct: number
  accuracy: number
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopicDetail()
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
          accuracy: 0
        })))
        setLoading(false)
        return
      }

      // Fetch bloom level breakdown from user_responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('user_responses')
        .select('bloom_level, is_correct')
        .eq('user_id', user.id)
        .eq('topic_id', topicData.id)

      if (responsesError) {
        console.error('Error fetching responses:', responsesError)
      }

      // Calculate bloom level stats
      const bloomStats: Record<number, { attempts: number; correct: number }> = {}

      responsesData?.forEach(response => {
        if (!bloomStats[response.bloom_level]) {
          bloomStats[response.bloom_level] = { attempts: 0, correct: 0 }
        }
        bloomStats[response.bloom_level].attempts++
        if (response.is_correct) {
          bloomStats[response.bloom_level].correct++
        }
      })

      const bloomLevelDetails = BLOOM_LEVELS.map(bl => {
        const stats = bloomStats[bl.level] || { attempts: 0, correct: 0 }
        const mastery = progressData.mastery_scores?.[bl.level] || 0
        const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0

        return {
          level: bl.level,
          name: bl.name,
          mastery,
          attempts: stats.attempts,
          correct: stats.correct,
          accuracy
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

  const overallMastery = (() => {
    const scores = Object.values(topicDetail.mastery_scores).filter(score => score > 0)
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  })()

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
                <p className="text-sm text-gray-500 truncate">{topicDetail.topic_hierarchy}</p>
              )}
            </div>
          </div>
        </div>

        {/* Topic Description */}
        {topicDetail.topic_description && (
          <div className="neuro-card p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
            <p className="text-gray-300">{topicDetail.topic_description}</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="neuro-stat group">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-blue-400 font-medium">Total Attempts</div>
            </div>
            <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
              {topicDetail.total_attempts}
            </div>
          </div>

          <div className="neuro-stat group">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-purple-400 font-medium">Overall Mastery</div>
            </div>
            <div className={`text-4xl font-bold group-hover:text-purple-400 transition-colors ${
              overallMastery >= 80 ? 'text-green-400' :
              overallMastery >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {overallMastery}%
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Avg across {Object.keys(topicDetail.mastery_scores).length} levels
            </div>
          </div>
        </div>

        {/* Cognitive Dimension Coverage */}
        {topicDetail.total_attempts > 0 && (
          <div className="neuro-card">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-gray-200">Cognitive Dimension Coverage</h2>
              <p className="text-sm text-gray-500 mt-1">Understanding from multiple perspectives (5W1H Framework)</p>
            </div>

            <div className="p-6 space-y-6">
              {bloomLevels.filter(bl => bl.attempts > 0).map((bl) => {
                const coveredDimensions = getCoverageForLevel(topicDetail.dimension_coverage, bl.level)
                const allDimensions = Object.values(CognitiveDimension)
                const coveragePercentage = Math.round((coveredDimensions.length / 6) * 100)

                return (
                  <div key={`dim-${bl.level}`} className="neuro-inset p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="neuro-raised w-10 h-10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-400">{bl.level}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-200">Level {bl.level} - {bl.name}</div>
                          <div className="text-xs text-gray-500">
                            {coveredDimensions.length}/6 dimensions covered ({coveragePercentage}%)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          coveredDimensions.length >= 4 ? 'text-green-400' :
                          coveredDimensions.length >= 2 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {coveredDimensions.length >= 4 ? 'Ready' : `${coveredDimensions.length}/4`}
                        </div>
                      </div>
                    </div>

                    {/* Dimension Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allDimensions.map(dim => {
                        const isCovered = coveredDimensions.includes(dim)
                        const dimInfo = COGNITIVE_DIMENSIONS[dim]

                        return (
                          <div
                            key={`${bl.level}-${dim}`}
                            className={`p-3 rounded-lg border-2 transition-all cursor-help ${
                              isCovered
                                ? 'border-green-400/30 bg-green-400/5'
                                : 'border-gray-700/50 bg-gray-800/30'
                            }`}
                            title={dimInfo.description}
                          >
                            <div>
                              <div className={`text-sm font-semibold truncate ${
                                isCovered ? 'text-green-400' : 'text-gray-500'
                              }`}>
                                {dimInfo.name}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {dimInfo.description.split(',')[0]}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Next Recommended Dimension */}
                    {coveredDimensions.length < 6 && (
                      <div className="mt-4 p-3 neuro-raised rounded-lg border border-blue-400/20">
                        <div className="text-xs text-blue-400 font-semibold mb-1">
                          Next Recommended
                        </div>
                        <div className="text-sm text-gray-300">
                          Practice questions about:{' '}
                          <span className="font-semibold text-blue-400">
                            {allDimensions
                              .filter(d => !coveredDimensions.includes(d))
                              .map(d => COGNITIVE_DIMENSIONS[d].name)
                              .join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="p-6 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Unlock Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-green-400">100% Mastery</div>
                  <div className="text-xs text-gray-500">All attempts correct</div>
                </div>
                <div>
                  <div className="font-medium text-blue-400">4+ Dimensions</div>
                  <div className="text-xs text-gray-500">Breadth of understanding</div>
                </div>
                <div>
                  <div className="font-medium text-purple-400">5+ Attempts</div>
                  <div className="text-xs text-gray-500">Statistical reliability</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bloom Level Breakdown */}
        <div className="neuro-card">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-gray-200">Bloom Level Breakdown</h2>
            <p className="text-sm text-gray-500 mt-1">Your performance across cognitive complexity levels</p>
          </div>

          <div className="p-6 space-y-4">
            {bloomLevels.map((bl) => (
              <div key={bl.level} className="neuro-inset p-4 rounded-lg">
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
              </div>
            ))}
          </div>
        </div>

        {/* Calibration Info */}
        {topicDetail.total_attempts > 0 && (
          <div className="neuro-card p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Confidence Calibration</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="neuro-inset rounded-full h-4 overflow-hidden relative bg-gray-800/30">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600" />
                  <div
                    className={`absolute top-0 bottom-0 ${
                      topicDetail.confidence_calibration_error <= 0.2 ? 'bg-green-400' :
                      topicDetail.confidence_calibration_error <= 0.4 ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}
                    style={{
                      left: topicDetail.confidence_calibration_error >= 0 ? '50%' : `${50 - (Math.abs(topicDetail.confidence_calibration_error) * 50)}%`,
                      width: `${Math.abs(topicDetail.confidence_calibration_error) * 50}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>Under-confident</span>
                  <span>Perfect</span>
                  <span>Over-confident</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  topicDetail.confidence_calibration_error <= 0.2 ? 'text-green-400' :
                  topicDetail.confidence_calibration_error <= 0.4 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {(topicDetail.confidence_calibration_error * 100).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">error %</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {topicDetail.confidence_calibration_error <= 0.2
                ? 'Well-calibrated! Your confidence matches your actual performance.'
                : topicDetail.confidence_calibration_error <= 0.4
                ? 'Moderate calibration. Try to be more accurate in assessing your knowledge.'
                : 'Poor calibration. Your confidence significantly differs from your actual performance.'}
            </p>
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
