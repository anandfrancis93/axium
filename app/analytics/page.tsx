/**
 * Analytics Dashboard Page
 *
 * Displays calibration statistics, learning trends, and RL phase progression
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Activity, Target, Zap, BarChart3, Brain, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import { CalibrationLineChart } from '@/components/analytics/CalibrationLineChart'
import { CalibrationScatterPlot } from '@/components/analytics/CalibrationScatterPlot'

interface UserProgress {
  id: string
  topic_id: string
  topic_name: string
  calibration_mean: number
  calibration_stddev: number
  calibration_slope: number
  calibration_r_squared: number
  questions_to_mastery: number | null
  rl_phase: string
  total_attempts: number
  correct_answers: number
  mastery_scores: any
  current_bloom_level: number
  last_practiced_at: string | null
}

interface CalibrationTrend {
  day: string
  attempts: number
  avg_calibration: number
  stddev_calibration: number
  correctness_rate: number
}

interface FormatPerformance {
  question_format: string
  attempts: number
  correctness_rate: number
  avg_calibration: number
  avg_confidence: number
}

interface IndividualResponse {
  created_at: string
  calibration_score: number
  is_correct: boolean
  confidence: number
  recognition_method: string
}

export default function AnalyticsPage() {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [selectedTopic, setSelectedTopic] = useState<UserProgress | null>(null)
  const [calibrationTrends, setCalibrationTrends] = useState<CalibrationTrend[]>([])
  const [formatPerformance, setFormatPerformance] = useState<FormatPerformance[]>([])
  const [individualResponses, setIndividualResponses] = useState<IndividualResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  useEffect(() => {
    if (selectedTopic) {
      fetchTopicDetails(selectedTopic.topic_id)
    }
  }, [selectedTopic])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Fetch user progress with topic names
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          *,
          topics (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('last_practiced_at', { ascending: false, nullsFirst: false })

      if (progressError) throw progressError

      const formattedProgress = progressData?.map(p => ({
        ...p,
        topic_name: p.topics?.name || 'Unknown Topic'
      })) || []

      setUserProgress(formattedProgress)

      // Auto-select first topic with most attempts
      if (formattedProgress.length > 0) {
        setSelectedTopic(formattedProgress[0])
      }

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTopicDetails(topicId: string) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch calibration trends
      const { data: trendsData, error: trendsError } = await supabase
        .from('v_calibration_trends')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .order('day', { ascending: true })

      if (!trendsError && trendsData) {
        setCalibrationTrends(trendsData)
      }

      // Fetch format performance
      const { data: formatData, error: formatError } = await supabase
        .from('v_format_performance')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)

      if (!formatError && formatData) {
        setFormatPerformance(formatData)
      }

      // Fetch individual responses for scatter plot
      const { data: responsesData, error: responsesError } = await supabase
        .from('user_responses')
        .select('created_at, calibration_score, is_correct, confidence, recognition_method')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .not('calibration_score', 'is', null)
        .order('created_at', { ascending: true })

      if (!responsesError && responsesData) {
        setIndividualResponses(responsesData)
      }

    } catch (error) {
      console.error('Error fetching topic details:', error)
    }
  }


  // Filter topics based on search query
  const filteredProgress = userProgress.filter(progress =>
    progress.topic_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen neuro-container flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin text-blue-400 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (userProgress.length === 0) {
    return (
      <div className="min-h-screen neuro-container py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-200 mb-8">Learning Analytics</h1>

          <div className="neuro-inset p-12 rounded-lg text-center">
            <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={40} className="text-gray-600" />
            </div>
            <div className="text-gray-400 text-lg font-semibold mb-2">
              No learning data yet
            </div>
            <div className="text-sm text-gray-600 mb-6">
              Start answering questions to see your calibration statistics and learning trends.
            </div>
            <Link href="/learn" className="neuro-btn text-blue-400 inline-flex items-center gap-2 px-6 py-3">
              <Zap size={18} />
              <span>Start Learning</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen neuro-container py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-200">Learning Analytics</h1>
          <Link href="/dashboard" className="neuro-btn text-gray-300">
            ← Back to Dashboard
          </Link>
        </div>


        {/* Topic Selector */}
        <div className="neuro-card p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Select Topic</h2>

          {/* Search Box */}
          <div className="mb-4 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics..."
              className="neuro-input w-full pl-12"
            />
          </div>

          <div className="neuro-inset rounded-lg overflow-hidden">
            <div className="max-h-80 overflow-y-auto scrollbar-custom">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Topic</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Last Practiced</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Attempts</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProgress.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                        No topics found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredProgress.map(progress => (
                    <tr
                      key={progress.id}
                      onClick={() => setSelectedTopic(progress)}
                      className={`
                        cursor-pointer transition-all border-b border-gray-800/50
                        ${selectedTopic?.id === progress.id
                          ? 'bg-blue-400/10'
                          : 'hover:bg-gray-800/30'
                        }
                      `}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-200">
                        {progress.topic_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {progress.last_practiced_at
                          ? new Date(progress.last_practiced_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {progress.total_attempts}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${getRLPhaseColor(progress.rl_phase)}`}>
                          {formatRLPhase(progress.rl_phase)}
                        </span>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedTopic && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Calibration Mean */}
              <div className="neuro-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-blue-400 font-medium">Avg Calibration</div>
                  <Target size={20} className="text-blue-400 opacity-50" />
                </div>
                <div className="text-4xl font-bold text-gray-200 mb-1">
                  {selectedTopic.calibration_mean != null
                    ? `${selectedTopic.calibration_mean > 0 ? '+' : ''}${selectedTopic.calibration_mean.toFixed(2)}`
                    : '—'}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedTopic.calibration_mean == null ? 'Not enough data yet' :
                   selectedTopic.calibration_mean > 0.5 ? 'Well calibrated' :
                   selectedTopic.calibration_mean > 0 ? 'Good calibration' :
                   selectedTopic.calibration_mean > -0.5 ? 'Needs improvement' : 'Poor calibration'}
                </div>
              </div>

              {/* Consistency */}
              <div className="neuro-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-purple-400 font-medium">Consistency</div>
                  <Activity size={20} className="text-purple-400 opacity-50" />
                </div>
                <div className="text-4xl font-bold text-gray-200 mb-1">
                  {selectedTopic.calibration_stddev != null
                    ? selectedTopic.calibration_stddev.toFixed(2)
                    : '—'}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedTopic.calibration_stddev == null ? 'Not enough data yet' :
                   selectedTopic.calibration_stddev < 0.3 ? 'Very consistent' :
                   selectedTopic.calibration_stddev < 0.6 ? 'Moderately consistent' : 'Variable performance'}
                </div>
              </div>

              {/* Learning Rate */}
              <div className="neuro-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-cyan-400 font-medium">Learning Rate</div>
                  {selectedTopic.calibration_slope != null && selectedTopic.calibration_slope > 0 ? (
                    <TrendingUp size={20} className="text-cyan-400 opacity-50" />
                  ) : (
                    <TrendingDown size={20} className="text-red-400 opacity-50" />
                  )}
                </div>
                <div className={`text-4xl font-bold mb-1 ${
                  selectedTopic.calibration_slope != null && selectedTopic.calibration_slope > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedTopic.calibration_slope != null
                    ? `${selectedTopic.calibration_slope > 0 ? '+' : ''}${selectedTopic.calibration_slope.toFixed(4)}`
                    : '—'}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedTopic.calibration_slope == null || selectedTopic.calibration_r_squared == null
                    ? 'Not enough data yet'
                    : `per question (R² = ${selectedTopic.calibration_r_squared.toFixed(2)})`}
                </div>
              </div>

              {/* Questions to Mastery */}
              <div className="neuro-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-yellow-400 font-medium">To Mastery</div>
                  <Zap size={20} className="text-yellow-400 opacity-50" />
                </div>
                <div className="text-4xl font-bold text-gray-200 mb-1">
                  {selectedTopic.questions_to_mastery !== null
                    ? selectedTopic.questions_to_mastery
                    : '—'}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedTopic.questions_to_mastery !== null
                    ? 'questions remaining'
                    : 'Not enough data yet'}
                </div>
              </div>
            </div>

            {/* RL Phase Indicator */}
            <div className="neuro-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                  <Brain size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-200">
                    RL Phase: {formatRLPhase(selectedTopic.rl_phase)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Current learning optimization phase
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {renderRLPhaseProgress(selectedTopic.rl_phase, selectedTopic.total_attempts)}
              </div>

              <div className="mt-4 neuro-inset rounded-lg p-4 text-sm text-gray-400">
                {getRLPhaseDescription(selectedTopic.rl_phase)}
              </div>
            </div>

            {/* Calibration Trend Chart */}
            {calibrationTrends.length > 0 && (
              <div className="neuro-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-200">Calibration Trend</h2>
                    <p className="text-sm text-gray-500">Daily average calibration scores</p>
                  </div>
                </div>

                <CalibrationTrendChart trends={calibrationTrends} />
              </div>
            )}

            {/* Advanced Line Chart with Regression */}
            {individualResponses.length >= 10 && (
              <CalibrationLineChart
                data={individualResponses.map((r, index) => ({
                  x: index + 1,
                  y: r.calibration_score,
                  date: new Date(r.created_at).toLocaleDateString()
                }))}
                slope={selectedTopic.calibration_slope}
                intercept={selectedTopic.calibration_mean - (selectedTopic.calibration_slope * individualResponses.length / 2)}
                rSquared={selectedTopic.calibration_r_squared}
                title="Calibration Progression with Trend Line"
              />
            )}

            {/* Scatter Plot with Distribution */}
            {individualResponses.length >= 10 && (
              <CalibrationScatterPlot
                points={individualResponses.map((r, index) => ({
                  attempt: index + 1,
                  calibration: r.calibration_score,
                  isCorrect: r.is_correct,
                  confidence: r.confidence,
                  recognitionMethod: r.recognition_method
                }))}
                slope={selectedTopic.calibration_slope}
                intercept={selectedTopic.calibration_mean - (selectedTopic.calibration_slope * individualResponses.length / 2)}
                rSquared={selectedTopic.calibration_r_squared}
                stddev={selectedTopic.calibration_stddev}
              />
            )}

            {/* Format Performance */}
            {formatPerformance.length > 0 && (
              <div className="neuro-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                    <Eye size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-200">Performance by Format</h2>
                    <p className="text-sm text-gray-500">TRACK 2: Format-specific correctness (not compared across formats)</p>
                  </div>
                </div>

                <FormatPerformanceGrid formats={formatPerformance} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Helper Components

function CalibrationTrendChart({ trends }: { trends: CalibrationTrend[] }) {
  const maxCalibration = Math.max(...trends.map(t => Math.abs(t.avg_calibration)))
  const scale = maxCalibration > 1.5 ? maxCalibration : 1.5

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="neuro-inset rounded-lg p-6">
        <div className="flex items-end justify-between gap-2 h-64">
          {trends.map((trend, index) => {
            const heightPercent = Math.abs(trend.avg_calibration) / scale * 100
            const isPositive = trend.avg_calibration >= 0

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                {/* Bar */}
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPositive ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${new Date(trend.day).toLocaleDateString()}: ${trend.avg_calibration > 0 ? '+' : ''}${trend.avg_calibration.toFixed(2)}`}
                  />
                </div>

                {/* Label */}
                <div className="text-xs text-gray-600 text-center">
                  {new Date(trend.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-400"></div>
            <span>Positive (good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-400"></div>
            <span>Negative (poor)</span>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="neuro-inset rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {Math.max(...trends.map(t => t.avg_calibration)).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Peak Calibration</div>
        </div>
        <div className="neuro-inset rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {(trends.reduce((sum, t) => sum + t.avg_calibration, 0) / trends.length).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Average</div>
        </div>
        <div className="neuro-inset rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {trends.reduce((sum, t) => sum + t.attempts, 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Attempts</div>
        </div>
      </div>
    </div>
  )
}

function FormatPerformanceGrid({ formats }: { formats: FormatPerformance[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {formats.map(format => (
        <div key={format.question_format} className="neuro-inset rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-300 mb-3">
            {formatQuestionType(format.question_format)}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Correctness:</span>
              <span className={`font-bold ${
                format.correctness_rate >= 80 ? 'text-green-400' :
                format.correctness_rate >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {format.correctness_rate.toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Calibration:</span>
              <span className={`font-bold ${
                format.avg_calibration > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {format.avg_calibration > 0 ? '+' : ''}{format.avg_calibration.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Avg Confidence:</span>
              <span className="font-bold text-blue-400">
                {format.avg_confidence.toFixed(1)}/3
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Attempts:</span>
              <span className="font-bold text-gray-400">{format.attempts}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper Functions

function getRLPhaseColor(phase: string): string {
  switch (phase) {
    case 'cold_start': return 'text-gray-400'
    case 'exploration': return 'text-blue-400'
    case 'optimization': return 'text-cyan-400'
    case 'stabilization': return 'text-green-400'
    default: return 'text-gray-400'
  }
}

function formatRLPhase(phase: string): string {
  switch (phase) {
    case 'cold_start': return 'Cold Start'
    case 'exploration': return 'Exploration'
    case 'optimization': return 'Optimization'
    case 'stabilization': return 'Stabilization'
    default: return phase
  }
}

function getRLPhaseDescription(phase: string): string {
  switch (phase) {
    case 'cold_start':
      return '🌱 Just getting started. The system is gathering initial data about your learning patterns. Keep practicing to unlock more insights!'
    case 'exploration':
      return '🔍 Actively exploring your learning style. The system is testing different approaches to find what works best for you.'
    case 'optimization':
      return '🎯 Focusing on high-value learning strategies. The system has identified your strengths and is optimizing your learning path.'
    case 'stabilization':
      return '✅ Stable, consistent performance achieved! You\'ve developed reliable learning patterns. Maintain this momentum!'
    default:
      return 'Learning phase information unavailable.'
  }
}

function renderRLPhaseProgress(currentPhase: string, attempts: number) {
  const phases = [
    { name: 'Cold Start', key: 'cold_start', threshold: 10 },
    { name: 'Exploration', key: 'exploration', threshold: 50 },
    { name: 'Optimization', key: 'optimization', threshold: 150 },
    { name: 'Stabilization', key: 'stabilization', threshold: Infinity }
  ]

  const currentIndex = phases.findIndex(p => p.key === currentPhase)

  return (
    <div className="flex items-center gap-2">
      {phases.map((phase, index) => {
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex
        const isUpcoming = index > currentIndex

        return (
          <div key={phase.key} className="flex-1">
            <div
              className={`h-2 rounded-full transition-all ${
                isComplete ? 'bg-green-400' :
                isCurrent ? 'bg-blue-400' :
                'bg-gray-700'
              }`}
            />
            <div className={`text-xs mt-2 ${
              isComplete ? 'text-green-400' :
              isCurrent ? 'text-blue-400' :
              'text-gray-600'
            }`}>
              {phase.name}
            </div>
            {phase.threshold !== Infinity && (
              <div className="text-xs text-gray-600 mt-1">
                {phase.threshold} attempts
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatQuestionType(format: string): string {
  switch (format) {
    case 'mcq_single': return 'MCQ - Single'
    case 'mcq_multi': return 'MCQ - Multiple'
    case 'true_false': return 'True/False'
    case 'fill_blank': return 'Fill in Blank'
    case 'matching': return 'Matching'
    case 'open_ended': return 'Open-Ended'
    default: return format
  }
}
