'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ShieldIcon, ArrowLeftIcon } from '@/components/icons'
import { createClient } from '@/lib/supabase/client'

interface TopicDetail {
  topic_id: string
  topic_name: string
  topic_description: string | null
  topic_hierarchy: string | null
  total_attempts: number
  correct_answers: number
  mastery_scores: Record<string, number>
  last_practiced_at: string
  rl_phase: string
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

const RL_PHASE_INFO: Record<string, { name: string; color: string; description: string }> = {
  'cold_start': { name: 'Cold Start', color: 'text-gray-400', description: 'Initial learning phase (< 10 attempts)' },
  'exploration': { name: 'Exploration', color: 'text-blue-400', description: 'Testing different strategies (10-50 attempts)' },
  'optimization': { name: 'Optimization', color: 'text-cyan-400', description: 'Focusing on high-value actions (50-150 attempts)' },
  'stabilization': { name: 'Stabilization', color: 'text-green-400', description: 'Stable, consistent performance (150+ attempts)' },
  'adaptation': { name: 'Adaptation', color: 'text-yellow-400', description: 'Responding to performance changes (150+ attempts)' },
  'meta_learning': { name: 'Meta-Learning', color: 'text-purple-400', description: 'Learning how to learn (500+ attempts)' }
}

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
        .select('id, name, description, hierarchy_path')
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
          topic_hierarchy: topicData.hierarchy_path,
          total_attempts: 0,
          correct_answers: 0,
          mastery_scores: {},
          last_practiced_at: new Date().toISOString(),
          rl_phase: 'cold_start',
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
        topic_hierarchy: progressData.hierarchy_path,
        total_attempts: progressData.total_attempts,
        correct_answers: progressData.correct_answers,
        mastery_scores: progressData.mastery_scores,
        last_practiced_at: progressData.last_practiced_at,
        rl_phase: progressData.rl_phase,
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

  const overallAccuracy = topicDetail.total_attempts > 0
    ? Math.round((topicDetail.correct_answers / topicDetail.total_attempts) * 100)
    : 0

  const overallMastery = (() => {
    const scores = Object.values(topicDetail.mastery_scores).filter(score => score > 0)
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  })()

  const rlPhase = RL_PHASE_INFO[topicDetail.rl_phase] || RL_PHASE_INFO['cold_start']

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-sm text-green-400 font-medium">Accuracy</div>
            </div>
            <div className={`text-4xl font-bold group-hover:text-green-400 transition-colors ${
              overallAccuracy >= 80 ? 'text-green-400' :
              overallAccuracy >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {overallAccuracy}%
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {topicDetail.correct_answers} / {topicDetail.total_attempts} correct
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

          <div className="neuro-stat group">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-cyan-400 font-medium">Learning Phase</div>
            </div>
            <div className={`text-2xl font-bold ${rlPhase.color} group-hover:opacity-80 transition-opacity`}>
              {rlPhase.name}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {rlPhase.description}
            </div>
          </div>
        </div>

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
                ? '✅ Well-calibrated! Your confidence matches your actual performance.'
                : topicDetail.confidence_calibration_error <= 0.4
                ? '⚠️ Moderate calibration. Try to be more accurate in assessing your knowledge.'
                : '❌ Poor calibration. Your confidence significantly differs from your actual performance.'}
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
