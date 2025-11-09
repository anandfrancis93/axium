'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import HamburgerMenu from '@/components/HamburgerMenu'
import { RefreshIcon } from '@/components/icons'
import Tooltip from '@/components/Tooltip'

interface SelectionData {
  timestamp: string
  topic_name: string
  bloom_level: number
  sampled_value: number
  adjusted_value: number
  mastery_score: number
  was_correct?: boolean
  confidence?: number
  reward?: number
  calibration?: number
  recognition?: number
  quality_score?: number
}

export default function RLAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState<SelectionData[]>([])
  const [topicStats, setTopicStats] = useState<any[]>([])
  const [rlMetrics, setRlMetrics] = useState<any>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Load last 50 arm selections with outcomes
      const { data: decisions } = await supabase
        .from('rl_decision_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('decision_type', 'arm_selection')
        .order('created_at', { ascending: false })
        .limit(50)

      if (decisions) {
        // Process selections with outcomes
        const processedSelections: SelectionData[] = decisions.map(d => {
          const selected = d.selected_arm || {}
          return {
            timestamp: d.created_at,
            topic_name: selected.topic_name || 'Unknown',
            bloom_level: selected.bloom_level || 0,
            sampled_value: selected.sampled_value || 0,
            adjusted_value: selected.adjusted_value || 0,
            mastery_score: selected.mastery_score || 0,
          }
        })

        // Match with rewards
        const { data: rewards } = await supabase
          .from('rl_decision_log')
          .select('created_at, is_correct, confidence, total_reward, reward_components, topic_id, bloom_level')
          .eq('user_id', user.id)
          .eq('decision_type', 'reward_calculation')
          .order('created_at', { ascending: false })
          .limit(50)

        if (rewards) {
          // Match rewards to selections by topic + bloom + timestamp proximity
          processedSelections.forEach(sel => {
            const matchingReward = rewards.find(r => {
              const timeDiff = Math.abs(new Date(r.created_at).getTime() - new Date(sel.timestamp).getTime())
              return timeDiff < 60000 // Within 1 minute
            })
            if (matchingReward) {
              sel.was_correct = matchingReward.is_correct
              sel.confidence = matchingReward.confidence
              sel.reward = matchingReward.total_reward
              const components = matchingReward.reward_components as any
              if (components) {
                sel.calibration = components.calibration
                sel.recognition = components.recognition
                sel.quality_score = (components.calibration + components.recognition) / 2
              }
            }
          })
        }

        setSelections(processedSelections.reverse()) // Chronological order
      }

      // Calculate topic-level stats
      const { data: masteryData } = await supabase
        .from('user_topic_mastery')
        .select('topic_id, topics(name, full_name), bloom_level, mastery_score, questions_correct, questions_attempted, last_practiced_at')
        .eq('user_id', user.id)
        .order('questions_attempted', { ascending: false })
        .limit(20)

      if (masteryData) {
        setTopicStats(masteryData)
      }

      // Calculate RL performance metrics
      const { data: armStats } = await supabase
        .from('rl_arm_stats')
        .select('*')
        .eq('user_id', user.id)

      if (armStats && armStats.length > 0) {
        const totalSelections = armStats.reduce((sum, arm) => sum + (arm.times_selected || 0), 0)
        const avgReward = armStats.reduce((sum, arm) => sum + (arm.avg_reward || 0) * (arm.times_selected || 0), 0) / totalSelections

        // Calculate exploration rate as selection diversity (last 20 selections)
        // Higher value = more diverse exploration, lower = concentrated exploitation
        const recentSelections = decisions?.slice(0, 20) || []
        const uniqueArmsInRecent = new Set(
          recentSelections.map(d => {
            const arm = d.selected_arm as any
            return arm ? `${arm.topic_id || arm.topic_name}_${arm.bloom_level}` : null
          }).filter(Boolean)
        ).size

        // Exploration rate = diversity of recent selections / total available arms
        // 0% = selecting only 1 arm repeatedly (pure exploitation)
        // 100% = selecting all available arms equally (pure exploration)
        const explorationRate = armStats.length > 0 ? uniqueArmsInRecent / Math.min(20, armStats.length) : 0

        setRlMetrics({
          totalArms: armStats.length,
          totalSelections,
          avgReward: avgReward || 0,
          explorationRate: explorationRate || 0
        })
      }

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <div className="neuro-container mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-200">RL System Analytics</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadAnalytics()}
              className="neuro-btn text-blue-400 px-4 py-2 text-sm"
              disabled={loading}
            >
              <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="neuro-container">
        {/* RL Performance Metrics */}
        {rlMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="neuro-stat">
              <div className="text-sm text-blue-400 font-medium mb-2">Total Arms Tracked</div>
              <div className="text-4xl font-bold text-gray-200">{rlMetrics.totalArms}</div>
            </div>
            <div className="neuro-stat">
              <div className="text-sm text-green-400 font-medium mb-2">Total Selections</div>
              <div className="text-4xl font-bold text-gray-200">{rlMetrics.totalSelections}</div>
            </div>
            <div className="neuro-stat">
              <div className="text-sm text-purple-400 font-medium mb-2">Avg Reward</div>
              <div className="text-4xl font-bold text-gray-200">{rlMetrics.avgReward.toFixed(3)}</div>
            </div>
            <Tooltip content={`Selection Diversity (Last 20 Questions)

Measures how many different topic-level combinations you've practiced recently.

0% = Concentrated exploitation (repeating same topic/level)
100% = Broad exploration (practicing many different combinations)

Thompson Sampling naturally balances exploration and exploitation based on uncertainty and performance.`}>
              <div className="neuro-stat cursor-help">
                <div className="text-sm text-yellow-400 font-medium mb-2">Selection Diversity</div>
                <div className="text-4xl font-bold text-gray-200">{(rlMetrics.explorationRate * 100).toFixed(1)}%</div>
              </div>
            </Tooltip>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selection Timeline */}
          <div className="neuro-card">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">Selection Timeline (Last 50)</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {selections.map((sel, idx) => (
                <div key={idx} className="neuro-inset p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-200">{sel.topic_name}</div>
                      <div className="text-xs text-gray-500">Bloom {sel.bloom_level}</div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(sel.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                    <div>
                      <span className="text-gray-500">Sample:</span>
                      <span className="text-gray-300 ml-1">{sel.sampled_value.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Adjusted:</span>
                      <span className="text-blue-400 ml-1 font-semibold">{sel.adjusted_value.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mastery:</span>
                      <span className="text-gray-300 ml-1">{sel.mastery_score.toFixed(1)}%</span>
                    </div>
                  </div>

                  {sel.was_correct !== undefined && (
                    <>
                      <div className="flex items-center gap-3 text-xs border-t border-gray-800 pt-2 mt-2">
                        <div className={sel.was_correct ? 'text-green-400' : 'text-red-400'}>
                          {sel.was_correct ? '✓' : '✗'} {sel.was_correct ? 'Correct' : 'Incorrect'}
                        </div>
                        <div className="text-gray-500">
                          Conf: {sel.confidence}/5
                        </div>
                        {sel.quality_score !== undefined && (
                          <div className={`font-semibold ${
                            sel.quality_score >= 2 ? 'text-green-400' :
                            sel.quality_score >= 0 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            Quality: {sel.quality_score.toFixed(1)}
                          </div>
                        )}
                        <div className={`ml-auto font-semibold ${sel.reward && sel.reward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          Reward: {sel.reward?.toFixed(1)}
                        </div>
                      </div>
                      {(sel.calibration !== undefined || sel.recognition !== undefined) && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          {sel.calibration !== undefined && (
                            <div>Cal: {sel.calibration > 0 ? '+' : ''}{sel.calibration}</div>
                          )}
                          {sel.recognition !== undefined && (
                            <div>Rec: {sel.recognition > 0 ? '+' : ''}{sel.recognition}</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Topic Stats - Most Practiced */}
          <div className="neuro-card">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">Most Practiced Topics</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {topicStats.map((stat, idx) => (
                <div key={idx} className="neuro-inset p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-200">
                        {stat.topics?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">Bloom {stat.bloom_level}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {stat.mastery_score.toFixed(0)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Attempts</div>
                      <div className="text-gray-200 font-semibold">{stat.questions_attempted}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Correct</div>
                      <div className="text-green-400 font-semibold">{stat.questions_correct}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Accuracy</div>
                      <div className="text-gray-200 font-semibold">
                        {stat.questions_attempted > 0
                          ? ((stat.questions_correct / stat.questions_attempted) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                  </div>

                  {stat.last_practiced_at && (
                    <div className="text-xs text-gray-600 mt-2 border-t border-gray-800 pt-2">
                      Last: {new Date(stat.last_practiced_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
