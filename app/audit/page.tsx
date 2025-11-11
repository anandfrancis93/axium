'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import HamburgerMenu from '@/components/HamburgerMenu'
import { RefreshIcon } from '@/components/icons'
import { Tooltip } from '@/components/Tooltip'

type Tab = 'audit' | 'analytics' | 'spaced-repetition' | 'api-costs'

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

interface SpacedRepData {
  topic_id: string
  topic_name: string
  topic_full_name: string
  bloom_level: number
  mastery_score: number
  last_practiced_at: string
  days_since: number
  hours_since: number
  questions_attempted: number
  questions_correct: number
  next_intervals: {
    optimal: string
    optimal_days: number
    due: boolean
    time_remaining: string
    is_overdue: boolean
  }
}

export default function AuditPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('audit')
  const [loading, setLoading] = useState(true)

  // Audit Log State
  const [decisions, setDecisions] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'arm_selection' | 'reward_calculation' | 'mastery_update' | 'data_deletion'>('all')
  const [selectedDecision, setSelectedDecision] = useState<any>(null)
  const [currentMastery, setCurrentMastery] = useState<Map<string, number>>(new Map())

  // Analytics State
  const [selections, setSelections] = useState<SelectionData[]>([])
  const [topicStats, setTopicStats] = useState<any[]>([])
  const [rlMetrics, setRlMetrics] = useState<any>(null)

  // Spaced Repetition State
  const [spacedRepData, setSpacedRepData] = useState<SpacedRepData[]>([])
  const [spacingStats, setSpacingStats] = useState<any>(null)
  const [sortBy, setSortBy] = useState<'earliest_review' | 'latest_practiced'>('earliest_review')

  // API Costs State
  const [apiCalls, setApiCalls] = useState<any[]>([])
  const [apiStats, setApiStats] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [activeTab, filter])

  // Auto-refresh when page becomes visible (e.g., coming back from quiz)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [activeTab])

  useEffect(() => {
    if (selectedDecision?.decision_type === 'arm_selection' && selectedDecision?.all_arms) {
      loadCurrentMastery()
    }
  }, [selectedDecision])

  const loadData = async () => {
    if (activeTab === 'audit') {
      await loadAuditLog()
    } else if (activeTab === 'analytics') {
      await loadAnalytics()
    } else if (activeTab === 'spaced-repetition') {
      await loadSpacedRepetition()
    } else if (activeTab === 'api-costs') {
      await loadApiCosts()
    }
  }

  const loadCurrentMastery = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const arms = selectedDecision.all_arms as any[]
      const topicIds = [...new Set(arms.map((a: any) => a.topic_id))].filter(Boolean)

      if (topicIds.length === 0) return

      const { data: masteryData } = await supabase
        .from('user_topic_mastery')
        .select('topic_id, bloom_level, mastery_score')
        .eq('user_id', user.id)
        .in('topic_id', topicIds)

      if (masteryData) {
        const masteryMap = new Map<string, number>()
        masteryData.forEach((m: any) => {
          const key = `${m.topic_id}_${m.bloom_level}`
          masteryMap.set(key, m.mastery_score)
        })
        setCurrentMastery(masteryMap)
      }
    } catch (error) {
      console.error('Error loading current mastery:', error)
    }
  }

  const loadAuditLog = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('rl_decision_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('decision_type', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading decisions:', error)
      } else {
        setDecisions(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

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
      const { data: decisionData } = await supabase
        .from('rl_decision_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('decision_type', 'arm_selection')
        .order('created_at', { ascending: false })
        .limit(50)

      if (decisionData) {
        // Process selections with outcomes
        const processedSelections: SelectionData[] = decisionData.map(d => {
          const selected = d.selected_arm || {}
          // Handle both old (camelCase) and new (snake_case) field names
          return {
            timestamp: d.created_at,
            topic_name: selected.topic_name || selected.topicName || 'Unknown',
            bloom_level: selected.bloom_level || selected.bloomLevel || 0,
            sampled_value: selected.sampled_value || selected.sample || 0,
            adjusted_value: selected.adjusted_value || 0,
            mastery_score: selected.mastery_score || 0,
          }
        }).filter(sel => sel.bloom_level > 0 && sel.topic_name !== 'Unknown') // Filter out invalid records

        // Match with rewards
        const { data: rewards } = await supabase
          .from('rl_decision_log')
          .select('created_at, is_correct, confidence, total_reward, reward_components, topic_id, bloom_level')
          .eq('user_id', user.id)
          .eq('decision_type', 'reward_calculation')
          .order('created_at', { ascending: false })
          .limit(50)

        if (rewards) {
          processedSelections.forEach(sel => {
            const matchingReward = rewards.find(r => {
              const timeDiff = Math.abs(new Date(r.created_at).getTime() - new Date(sel.timestamp).getTime())
              return timeDiff < 60000
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

        setSelections(processedSelections)
      }

      // Calculate topic-level stats
      const { data: masteryData } = await supabase
        .from('user_topic_mastery')
        .select('topic_id, topics(name, full_name), bloom_level, mastery_score, questions_correct, questions_attempted, last_practiced_at')
        .eq('user_id', user.id)
        .order('last_practiced_at', { ascending: false })
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

        const recentSelections = decisionData?.slice(0, 20) || []
        const uniqueArmsInRecent = new Set(
          recentSelections.map(d => {
            const arm = d.selected_arm as any
            return arm ? `${arm.topic_id || arm.topic_name}_${arm.bloom_level}` : null
          }).filter(Boolean)
        ).size

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

  const loadSpacedRepetition = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get all practiced topics with timing info
      const { data: masteryData } = await supabase
        .from('user_topic_mastery')
        .select('topic_id, topics(name, full_name), bloom_level, mastery_score, questions_correct, questions_attempted, last_practiced_at')
        .eq('user_id', user.id)
        .not('last_practiced_at', 'is', null)
        .order('last_practiced_at', { ascending: true })

      if (masteryData) {
        const now = new Date()
        const spacedData: SpacedRepData[] = masteryData.map((m: any) => {
          const lastPracticed = new Date(m.last_practiced_at)
          const timeSinceMs = now.getTime() - lastPracticed.getTime()
          const daysSince = Math.floor(timeSinceMs / (1000 * 60 * 60 * 24))
          const hoursSince = Math.floor(timeSinceMs / (1000 * 60 * 60))

          // Determine optimal interval based on mastery
          let optimalDays = 1
          if (m.mastery_score >= 80) optimalDays = 14
          else if (m.mastery_score >= 60) optimalDays = 7
          else if (m.mastery_score >= 40) optimalDays = 3
          else optimalDays = 1

          // BONUS: First-time correct answers get minimum 3-day interval
          // Reward getting it right on first try, regardless of mastery score
          if (m.questions_attempted === 1 && m.questions_correct === 1) {
            optimalDays = Math.max(optimalDays, 3)
          }

          // Calculate time remaining until due
          const dueDate = new Date(lastPracticed.getTime() + optimalDays * 24 * 60 * 60 * 1000)
          const timeUntilDueMs = dueDate.getTime() - now.getTime()
          const isOverdue = timeUntilDueMs < 0
          const absTimeMs = Math.abs(timeUntilDueMs)

          // Format time remaining
          const days = Math.floor(absTimeMs / (1000 * 60 * 60 * 24))
          const hours = Math.floor((absTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((absTimeMs % (1000 * 60 * 60)) / (1000 * 60))

          let timeRemaining = ''
          if (days > 0) {
            timeRemaining = `${days} day${days > 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''}`
          } else if (hours > 0) {
            timeRemaining = `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min`
          } else {
            timeRemaining = `${minutes} min`
          }

          if (isOverdue) {
            timeRemaining = `Overdue by ${timeRemaining}`
          } else {
            timeRemaining = `Due in ${timeRemaining}`
          }

          return {
            topic_id: m.topic_id,
            topic_name: m.topics?.name || 'Unknown',
            topic_full_name: m.topics?.full_name || m.topics?.name || 'Unknown',
            bloom_level: m.bloom_level,
            mastery_score: m.mastery_score,
            last_practiced_at: m.last_practiced_at,
            days_since: daysSince,
            hours_since: hoursSince,
            questions_attempted: m.questions_attempted,
            questions_correct: m.questions_correct,
            next_intervals: {
              optimal: `${optimalDays} day${optimalDays > 1 ? 's' : ''}`,
              optimal_days: optimalDays,
              due: isOverdue,
              time_remaining: timeRemaining,
              is_overdue: isOverdue
            }
          }
        })

        setSpacedRepData(spacedData)

        // Calculate spacing statistics
        // Group by spacing intervals relative to optimal interval
        const byInterval = {
          critical: spacedData.filter(d => d.days_since > d.next_intervals.optimal_days * 2).length,
          overdue: spacedData.filter(d => d.days_since >= d.next_intervals.optimal_days * 1.5 && d.days_since <= d.next_intervals.optimal_days * 2).length,
          due: spacedData.filter(d => d.days_since >= d.next_intervals.optimal_days && d.days_since < d.next_intervals.optimal_days * 1.5).length,
          onTrack: spacedData.filter(d => d.days_since < d.next_intervals.optimal_days).length,
        }

        // Find next review due (soonest overdue or upcoming)
        let nextReviewDue = 'None'
        const overdueTopics = spacedData.filter(d => d.next_intervals.is_overdue)
        const upcomingTopics = spacedData.filter(d => !d.next_intervals.is_overdue)

        if (overdueTopics.length > 0) {
          // Sort by most overdue (most hours past optimal)
          overdueTopics.sort((a, b) => {
            const aOverdue = a.hours_since - (a.next_intervals.optimal_days * 24)
            const bOverdue = b.hours_since - (b.next_intervals.optimal_days * 24)
            return bOverdue - aOverdue
          })
          nextReviewDue = overdueTopics[0].next_intervals.time_remaining
        } else if (upcomingTopics.length > 0) {
          // Sort by soonest due (least hours remaining until optimal)
          upcomingTopics.sort((a, b) => {
            const aRemaining = (a.next_intervals.optimal_days * 24) - a.hours_since
            const bRemaining = (b.next_intervals.optimal_days * 24) - b.hours_since
            return aRemaining - bRemaining
          })
          nextReviewDue = upcomingTopics[0].next_intervals.time_remaining
        }

        // Calculate average accuracy
        const avgAccuracy = spacedData.length > 0
          ? spacedData.reduce((sum, d) => {
              const accuracy = d.questions_attempted > 0
                ? (d.questions_correct / d.questions_attempted) * 100
                : 0
              return sum + accuracy
            }, 0) / spacedData.length
          : 0

        // Count high mastery topics
        const highMasteryCount = spacedData.filter(d => d.mastery_score >= 80).length

        setSpacingStats({
          totalTopics: spacedData.length,
          nextReviewDue,
          avgAccuracy: avgAccuracy.toFixed(0),
          highMasteryCount,
          byInterval
        })
      }

    } catch (error) {
      console.error('Error loading spaced repetition:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadApiCosts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Load API call logs
      const { data: callsData } = await supabase
        .from('api_call_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (callsData) {
        setApiCalls(callsData)

        // Calculate statistics
        const totalCost = callsData.reduce((sum, call) => sum + parseFloat(call.total_cost || 0), 0)
        const totalCalls = callsData.length
        const successCalls = callsData.filter(c => c.status === 'success').length
        const errorCalls = callsData.filter(c => c.status === 'error').length
        const totalTokens = callsData.reduce((sum, call) => sum + (call.total_tokens || 0), 0)
        const avgLatency = callsData.filter(c => c.latency_ms).reduce((sum, call, _, arr) =>
          sum + (call.latency_ms || 0) / arr.length, 0
        )

        // Group by provider
        const byProvider = callsData.reduce((acc, call) => {
          if (!acc[call.provider]) {
            acc[call.provider] = { calls: 0, cost: 0, tokens: 0 }
          }
          acc[call.provider].calls++
          acc[call.provider].cost += parseFloat(call.total_cost || 0)
          acc[call.provider].tokens += call.total_tokens || 0
          return acc
        }, {} as Record<string, { calls: number; cost: number; tokens: number }>)

        // Group by endpoint
        const byEndpoint = callsData.reduce((acc, call) => {
          if (!acc[call.endpoint]) {
            acc[call.endpoint] = { calls: 0, cost: 0 }
          }
          acc[call.endpoint].calls++
          acc[call.endpoint].cost += parseFloat(call.total_cost || 0)
          return acc
        }, {} as Record<string, { calls: number; cost: number }>)

        setApiStats({
          totalCost,
          totalCalls,
          successCalls,
          errorCalls,
          totalTokens,
          avgLatency: Math.round(avgLatency),
          byProvider,
          byEndpoint
        })
      }
    } catch (error) {
      console.error('Error loading API costs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'arm_selection':
        return 'text-blue-400'
      case 'reward_calculation':
        return 'text-green-400'
      case 'mastery_update':
        return 'text-purple-400'
      case 'data_deletion':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-400">System Transparency & Analytics</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadData()}
              className="neuro-btn text-blue-400 px-4 py-2 text-sm"
              disabled={loading}
            >
              <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <HamburgerMenu />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('audit')}
            className={`neuro-btn px-6 py-3 ${activeTab === 'audit' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            Decision Audit Log
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`neuro-btn px-6 py-3 ${activeTab === 'analytics' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            RL Analytics
          </button>
          <button
            onClick={() => setActiveTab('spaced-repetition')}
            className={`neuro-btn px-6 py-3 ${activeTab === 'spaced-repetition' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            Spaced Repetition
          </button>
          <button
            onClick={() => setActiveTab('api-costs')}
            className={`neuro-btn px-6 py-3 ${activeTab === 'api-costs' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            API Costs
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Filters and List */}
            <div className="lg:col-span-1">
              <div className="neuro-card mb-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Filters</h2>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`neuro-btn text-sm py-2 ${filter === 'all' ? 'text-blue-400' : 'text-gray-400'}`}
                  >
                    All Decisions ({decisions.length})
                  </button>
                  <button
                    onClick={() => setFilter('arm_selection')}
                    className={`neuro-btn text-sm py-2 ${filter === 'arm_selection' ? 'text-blue-400' : 'text-gray-400'}`}
                  >
                    Arm Selection
                  </button>
                  <button
                    onClick={() => setFilter('reward_calculation')}
                    className={`neuro-btn text-sm py-2 ${filter === 'reward_calculation' ? 'text-green-400' : 'text-gray-400'}`}
                  >
                    Reward Calculation
                  </button>
                  <button
                    onClick={() => setFilter('mastery_update')}
                    className={`neuro-btn text-sm py-2 ${filter === 'mastery_update' ? 'text-purple-400' : 'text-gray-400'}`}
                  >
                    Mastery Update
                  </button>
                  <button
                    onClick={() => setFilter('data_deletion')}
                    className={`neuro-btn text-sm py-2 ${filter === 'data_deletion' ? 'text-red-400' : 'text-gray-400'}`}
                  >
                    Data Deletion
                  </button>
                </div>
              </div>

              <div className="neuro-card">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Recent Decisions</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {decisions.map((decision) => (
                    <button
                      key={decision.id}
                      onClick={() => setSelectedDecision(decision)}
                      className={`neuro-btn w-full text-left p-3 ${
                        selectedDecision?.id === decision.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`text-sm font-medium ${getDecisionTypeColor(decision.decision_type)}`}>
                          {decision.decision_type.replace('_', ' ').toUpperCase()}
                        </div>
                        {decision.decision_type === 'arm_selection' && decision.state_snapshot?.selection_method === 'forced_spacing' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            FORCED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(decision.created_at).toLocaleString()}
                      </div>
                      {decision.decision_type === 'arm_selection' && decision.selected_arm && (
                        <div className="text-xs text-gray-400 mt-1">
                          {decision.selected_arm.topic_name} (Bloom {decision.selected_arm.bloom_level})
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Decision Details */}
            <div className="lg:col-span-2">
              {selectedDecision ? (
                <div className="neuro-card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-semibold ${getDecisionTypeColor(selectedDecision.decision_type)}`}>
                      {selectedDecision.decision_type.replace('_', ' ').toUpperCase()}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedDecision.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Arm Selection Details */}
                  {selectedDecision.decision_type === 'arm_selection' && (
                    <div className="space-y-6">
                      {selectedDecision.selection_reasoning && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-300">Reasoning</h3>
                            {selectedDecision.state_snapshot?.selection_method === 'forced_spacing' && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Forced Spacing
                              </span>
                            )}
                            {selectedDecision.state_snapshot?.selection_method === 'thompson_sampling' && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Thompson Sampling
                              </span>
                            )}
                          </div>
                          <div className="neuro-inset p-4 rounded-lg text-sm text-gray-400">
                            {selectedDecision.selection_reasoning}
                          </div>
                        </div>
                      )}

                      {selectedDecision.selected_arm && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Selected Arm</h3>
                          <div className="neuro-inset p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Topic:</span>
                                <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.topic_name}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Bloom Level:</span>
                                <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.bloom_level}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Sampled Value:</span>
                                <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.sampled_value?.toFixed(3)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Adjusted Value:</span>
                                <span className="text-blue-400 ml-2 font-semibold">{selectedDecision.selected_arm.adjusted_value?.toFixed(3)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Mastery Score:</span>
                                <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.mastery_score?.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedDecision.all_arms && selectedDecision.all_arms.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">
                            All Arms Considered ({selectedDecision.all_arms.length})
                          </h3>
                          <div className="neuro-inset p-4 rounded-lg max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-[#0a0a0a]">
                                <tr>
                                  <th className="text-left text-gray-500 pb-2">Topic</th>
                                  <th className="text-center text-gray-500 pb-2">Bloom</th>
                                  <th className="text-right text-gray-500 pb-2">Sample</th>
                                  <th className="text-right text-gray-500 pb-2">Adjusted</th>
                                  <th className="text-right text-gray-500 pb-2">Mastery</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedDecision.all_arms
                                  .sort((a: any, b: any) => b.adjusted_value - a.adjusted_value)
                                  .map((arm: any, idx: number) => {
                                    const masteryKey = `${arm.topic_id}_${arm.bloom_level}`
                                    const current = currentMastery.get(masteryKey)
                                    const snapshot = arm.mastery_score
                                    const hasChanged = current !== undefined && Math.abs(current - snapshot) > 0.1

                                    return (
                                      <tr
                                        key={idx}
                                        className={arm.topic_id === selectedDecision.selected_arm?.topic_id && arm.bloom_level === selectedDecision.selected_arm?.bloom_level ? 'bg-blue-900/20' : ''}
                                      >
                                        <td className="text-gray-300 py-2">{arm.topic_name}</td>
                                        <td className="text-center text-gray-400">{arm.bloom_level}</td>
                                        <td className="text-right text-gray-400">{arm.sampled_value?.toFixed(3)}</td>
                                        <td className="text-right text-blue-400 font-semibold">{arm.adjusted_value?.toFixed(3)}</td>
                                        <td className="text-right">
                                          {current !== undefined ? (
                                            <span className={hasChanged ? 'text-green-400' : 'text-gray-400'} title={`Snapshot: ${snapshot?.toFixed(1)}%`}>
                                              {current?.toFixed(1)}%
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">{snapshot?.toFixed(1)}%</span>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reward Calculation Details */}
                  {selectedDecision.decision_type === 'reward_calculation' && selectedDecision.reward_components && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Response</h3>
                        <div className="neuro-inset p-4 rounded-lg grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Correct:</span>
                            <span className={`ml-2 ${selectedDecision.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                              {selectedDecision.is_correct ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Confidence:</span>
                            <span className="text-gray-200 ml-2">{selectedDecision.confidence}/5</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Response Time:</span>
                            <span className="text-gray-200 ml-2">{selectedDecision.response_time_seconds}s</span>
                          </div>
                        </div>
                      </div>

                      {/* Quality Score */}
                      {selectedDecision.reward_components?.calibration !== undefined && selectedDecision.reward_components?.recognition !== undefined && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Answer Quality</h3>
                          <div className="neuro-inset p-4 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-center mb-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Calibration</div>
                                <div className={`text-2xl font-bold ${
                                  selectedDecision.reward_components.calibration >= 2 ? 'text-green-400' :
                                  selectedDecision.reward_components.calibration >= 0 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {selectedDecision.reward_components.calibration > 0 ? '+' : ''}{selectedDecision.reward_components.calibration}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Recognition</div>
                                <div className={`text-2xl font-bold ${
                                  selectedDecision.reward_components.recognition >= 2 ? 'text-green-400' :
                                  selectedDecision.reward_components.recognition >= 0 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {selectedDecision.reward_components.recognition > 0 ? '+' : ''}{selectedDecision.reward_components.recognition}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Quality Score</div>
                                <div className={`text-2xl font-bold ${
                                  ((selectedDecision.reward_components.calibration + selectedDecision.reward_components.recognition) / 2) >= 2 ? 'text-green-400' :
                                  ((selectedDecision.reward_components.calibration + selectedDecision.reward_components.recognition) / 2) >= 0 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {((selectedDecision.reward_components.calibration + selectedDecision.reward_components.recognition) / 2).toFixed(1)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 text-center border-t border-gray-800 pt-2">
                              Perfect = 3.0 (high conf + memory + correct)
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Reward Breakdown</h3>
                        <div className="neuro-inset p-4 rounded-lg space-y-2 text-sm">
                          {Object.entries(selectedDecision.reward_components)
                            .filter(([key]) => key !== 'total') // Exclude total from components (shown separately)
                            .map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-400 capitalize">{key === 'learningGain' ? 'Learning Gain' : key === 'responseTime' ? 'Response Time' : key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                                <span className={`font-semibold ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {value > 0 ? '+' : ''}{value.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          <div className="flex justify-between pt-2 border-t border-gray-700">
                            <span className="text-gray-200 font-semibold">Total:</span>
                            <span className={`font-bold ${selectedDecision.reward_components.total >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                              {selectedDecision.reward_components.total > 0 ? '+' : ''}{selectedDecision.reward_components.total.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mastery Update Details */}
                  {selectedDecision.decision_type === 'mastery_update' && (
                    <div className="space-y-6">
                      <div className="neuro-inset p-4 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Old Mastery</div>
                            <div className="text-2xl font-bold text-gray-300">{selectedDecision.old_mastery?.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">→</div>
                            <div className="text-2xl font-bold text-blue-400">
                              {selectedDecision.new_mastery > selectedDecision.old_mastery ? '+' : ''}
                              {(selectedDecision.new_mastery - selectedDecision.old_mastery).toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">New Mastery</div>
                            <div className="text-2xl font-bold text-green-400">{selectedDecision.new_mastery?.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>

                      {selectedDecision.mastery_formula && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Formula</h3>
                          <div className="neuro-inset p-4 rounded-lg text-sm font-mono text-gray-400">
                            {selectedDecision.mastery_formula}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data Deletion Details */}
                  {selectedDecision.decision_type === 'data_deletion' && (
                    <div className="space-y-6">
                      {selectedDecision.selection_reasoning && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Reason</h3>
                          <div className="neuro-inset p-4 rounded-lg text-sm text-gray-400">
                            {selectedDecision.selection_reasoning}
                          </div>
                        </div>
                      )}

                      {selectedDecision.state_snapshot && (
                        <>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Scope</h3>
                            <div className="neuro-inset p-4 rounded-lg text-sm">
                              <span className="text-gray-400 capitalize">
                                {selectedDecision.state_snapshot.scope?.replace('_', ' ')}
                              </span>
                              {selectedDecision.state_snapshot.chapter_id && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Chapter ID: {selectedDecision.state_snapshot.chapter_id}
                                </div>
                              )}
                              {selectedDecision.topic_id && (
                                <div className="text-xs text-gray-500">
                                  Topic ID: {selectedDecision.topic_id}
                                </div>
                              )}
                              {selectedDecision.bloom_level && (
                                <div className="text-xs text-gray-500">
                                  Bloom Level: {selectedDecision.bloom_level}
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedDecision.state_snapshot.deleted_counts && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-300 mb-2">Records Deleted</h3>
                              <div className="neuro-inset p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {Object.entries(selectedDecision.state_snapshot.deleted_counts).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-gray-400 capitalize">{key}:</span>
                                      <span className="text-red-400 font-semibold">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedDecision.state_snapshot.data_snapshot && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-300 mb-2">Data Snapshot</h3>
                              <div className="neuro-inset p-4 rounded-lg">
                                <div className="text-xs text-gray-500 mb-2">
                                  Full snapshot of deleted data (for recovery/audit)
                                </div>
                                <div className="text-xs font-mono text-gray-600 max-h-64 overflow-y-auto">
                                  {Object.entries(selectedDecision.state_snapshot.data_snapshot).map(([key, value]: [string, any]) => (
                                    <div key={key} className="mb-2">
                                      <div className="text-gray-400">{key}: {Array.isArray(value) ? `${value.length} records` : 'N/A'}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="neuro-card flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg">Select a decision to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RL Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {/* RL Performance Metrics */}
            {rlMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Tooltip content={`Total Arms Tracked

An "arm" is a unique topic-level combination (e.g., "Authentication × Bloom 2").

Each topic has up to 6 arms (Bloom levels 1-6).

Thompson Sampling tracks performance for each arm independently to find the most effective learning paths for you.`}>
                  <div className="neuro-stat cursor-help">
                    <div className="text-sm text-blue-400 font-medium mb-2">Total Arms Tracked</div>
                    <div className="text-4xl font-bold text-gray-200">{rlMetrics.totalArms}</div>
                  </div>
                </Tooltip>
                <Tooltip content={`Total Selections

Total number of questions answered across all topic-level combinations.

More selections = More data for Thompson Sampling to learn your optimal learning path.`}>
                  <div className="neuro-stat cursor-help">
                    <div className="text-sm text-green-400 font-medium mb-2">Total Selections</div>
                    <div className="text-4xl font-bold text-gray-200">{rlMetrics.totalSelections}</div>
                  </div>
                </Tooltip>
                <Tooltip content={`Average Reward Score

Measures overall learning effectiveness across all practiced topics.

COMPONENTS (Total: -21 to +35):
• Learning Gain: -10 to +10 (mastery improvement)
• Calibration: -3 to +3 (confidence accuracy)
• Spacing: 0 to +5 (retention over time)
• Recognition: -4 to +3 (retrieval strength)
• Response Time: -3 to +5 (retrieval fluency)
• Streak: 0 to +5 (momentum)

Higher reward = More effective learning
- Perfect answers: ~15-25 points
- Struggling but correct: ~5-10 points
- Incorrect: -10 to 0 points

Thompson Sampling uses these rewards to prioritize topics where you learn most effectively.`}>
                  <div className="neuro-stat cursor-help">
                    <div className="text-sm text-purple-400 font-medium mb-2">Avg Reward</div>
                    <div className="text-4xl font-bold text-gray-200">{rlMetrics.avgReward.toFixed(3)}</div>
                  </div>
                </Tooltip>
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
          </>
        )}

        {/* Spaced Repetition Tab */}
        {activeTab === 'spaced-repetition' && (
          <>
            {/* Header with Refresh Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-200">Spaced Repetition Dashboard</h2>
              <button
                onClick={loadSpacedRepetition}
                disabled={loading}
                className="neuro-btn text-blue-400 px-4 py-2 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Spacing Statistics */}
            {spacingStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="neuro-stat">
                  <div className="text-sm text-blue-400 font-medium mb-2">Total Topics</div>
                  <div className="text-4xl font-bold text-gray-200">{spacingStats.totalTopics}</div>
                </div>
                <div className="neuro-stat">
                  <div className="text-sm text-yellow-400 font-medium mb-2">Next Review</div>
                  <div className="text-lg font-bold text-gray-200">{spacingStats.nextReviewDue}</div>
                </div>
                <div className="neuro-stat">
                  <div className="text-sm text-green-400 font-medium mb-2">Avg Accuracy</div>
                  <div className="text-4xl font-bold text-gray-200">{spacingStats.avgAccuracy}%</div>
                </div>
                <div className="neuro-stat">
                  <div className="text-sm text-purple-400 font-medium mb-2">High Mastery</div>
                  <div className="text-4xl font-bold text-gray-200">{spacingStats.highMasteryCount}</div>
                  <div className="text-xs text-gray-500 mt-1">≥80% mastery</div>
                </div>
              </div>
            )}

            {/* Interval Distribution */}
            {spacingStats && (
              <div className="neuro-card mb-8">
                <h2 className="text-2xl font-semibold text-gray-200 mb-6">Review Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="neuro-inset p-4 rounded-lg">
                    <div className="text-sm text-red-400 mb-2">Critical</div>
                    <div className="text-3xl font-bold text-gray-200">{spacingStats.byInterval.critical}</div>
                    <div className="text-xs text-gray-500 mt-1">&gt;2× overdue</div>
                  </div>
                  <div className="neuro-inset p-4 rounded-lg">
                    <div className="text-sm text-orange-400 mb-2">Overdue</div>
                    <div className="text-3xl font-bold text-gray-200">{spacingStats.byInterval.overdue}</div>
                    <div className="text-xs text-gray-500 mt-1">1.5-2× overdue</div>
                  </div>
                  <div className="neuro-inset p-4 rounded-lg">
                    <div className="text-sm text-yellow-400 mb-2">Due</div>
                    <div className="text-3xl font-bold text-gray-200">{spacingStats.byInterval.due}</div>
                    <div className="text-xs text-gray-500 mt-1">Ready for review</div>
                  </div>
                  <div className="neuro-inset p-4 rounded-lg">
                    <div className="text-sm text-green-400 mb-2">On Track</div>
                    <div className="text-3xl font-bold text-gray-200">{spacingStats.byInterval.onTrack}</div>
                    <div className="text-xs text-gray-500 mt-1">Not due yet</div>
                  </div>
                </div>
              </div>
            )}

            {/* Topics List */}
            <div className="neuro-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-200">All Topics ({spacedRepData.length})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('earliest_review')}
                    className={`neuro-btn px-4 py-2 text-sm ${sortBy === 'earliest_review' ? 'text-blue-400' : 'text-gray-400'}`}
                  >
                    Earliest Review
                  </button>
                  <button
                    onClick={() => setSortBy('latest_practiced')}
                    className={`neuro-btn px-4 py-2 text-sm ${sortBy === 'latest_practiced' ? 'text-blue-400' : 'text-gray-400'}`}
                  >
                    Latest Practiced
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {(() => {
                  // Sort the topics based on selected sort method
                  const sortedTopics = [...spacedRepData].sort((a, b) => {
                    if (sortBy === 'earliest_review') {
                      // Calculate time until due (negative = overdue)
                      const aHoursUntilDue = (a.next_intervals.optimal_days * 24) - a.hours_since
                      const bHoursUntilDue = (b.next_intervals.optimal_days * 24) - b.hours_since
                      // Most overdue (most negative) should come first
                      return aHoursUntilDue - bHoursUntilDue
                    } else {
                      // Sort by most recently practiced
                      return new Date(b.last_practiced_at).getTime() - new Date(a.last_practiced_at).getTime()
                    }
                  })

                  return sortedTopics.map((topic, idx) => (
                  <div key={idx} className="neuro-inset p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-200">
                          {topic.topic_name}
                        </div>
                        <div className="text-xs text-gray-500">Bloom {topic.bloom_level}</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {topic.mastery_score.toFixed(0)}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                      <div>
                        <div className="text-gray-500">Time Status</div>
                        <div className={`font-semibold ${
                          topic.next_intervals.is_overdue ? 'text-red-400' : 'text-green-400'
                        }`}>{topic.next_intervals.time_remaining}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Optimal Interval</div>
                        <div className="text-gray-200 font-semibold">{topic.next_intervals.optimal}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-500">Attempts</div>
                        <div className="text-gray-200 font-semibold">{topic.questions_attempted}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Accuracy</div>
                        <div className="text-gray-200 font-semibold">
                          {topic.questions_attempted > 0
                            ? ((topic.questions_correct / topic.questions_attempted) * 100).toFixed(0)
                            : 0}%
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 mt-2 border-t border-gray-800 pt-2">
                      Last practiced: {new Date(topic.last_practiced_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  ))
                })()}
              </div>
            </div>
          </>
        )}

        {/* API Costs Tab */}
        {activeTab === 'api-costs' && (
          <>
            {/* API Cost Statistics */}
            {apiStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="neuro-stat">
                  <div className="text-sm text-blue-400 font-medium mb-2">Total API Calls</div>
                  <div className="text-4xl font-bold text-gray-200">{apiStats.totalCalls}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {apiStats.successCalls} success, {apiStats.errorCalls} errors
                  </div>
                </div>
                <div className="neuro-stat">
                  <div className="text-sm text-green-400 font-medium mb-2">Total Cost</div>
                  <div className="text-4xl font-bold text-gray-200">${apiStats.totalCost.toFixed(4)}</div>
                  <div className="text-xs text-gray-500 mt-1">USD</div>
                </div>
                <div className="neuro-stat">
                  <div className="text-sm text-purple-400 font-medium mb-2">Total Tokens</div>
                  <div className="text-4xl font-bold text-gray-200">{apiStats.totalTokens.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">input + output</div>
                </div>
                <div className="neuro-stat">
                  <div className="text-sm text-yellow-400 font-medium mb-2">Avg Latency</div>
                  <div className="text-4xl font-bold text-gray-200">{apiStats.avgLatency}</div>
                  <div className="text-xs text-gray-500 mt-1">milliseconds</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Cost by Provider */}
              {apiStats && apiStats.byProvider && Object.keys(apiStats.byProvider).length > 0 && (
                <div className="neuro-card">
                  <h2 className="text-2xl font-semibold text-gray-200 mb-6">Cost by Provider</h2>
                  <div className="space-y-3">
                    {Object.entries(apiStats.byProvider).map(([provider, stats]: [string, any]) => (
                      <div key={provider} className="neuro-inset p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-gray-200 capitalize">{provider}</div>
                          <div className="text-xl font-bold text-green-400">${stats.cost.toFixed(4)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Calls:</span>
                            <span className="text-gray-200 ml-2">{stats.calls}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Tokens:</span>
                            <span className="text-gray-200 ml-2">{stats.tokens.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost by Endpoint */}
              {apiStats && apiStats.byEndpoint && Object.keys(apiStats.byEndpoint).length > 0 && (
                <div className="neuro-card">
                  <h2 className="text-2xl font-semibold text-gray-200 mb-6">Cost by Endpoint</h2>
                  <div className="space-y-3">
                    {Object.entries(apiStats.byEndpoint)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => b.cost - a.cost)
                      .map(([endpoint, stats]: [string, any]) => (
                        <div key={endpoint} className="neuro-inset p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-200">{endpoint}</div>
                            <div className="text-xl font-bold text-green-400">${stats.cost.toFixed(4)}</div>
                          </div>
                          <div className="text-xs text-gray-500">{stats.calls} calls</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent API Calls */}
            <div className="neuro-card">
              <h2 className="text-2xl font-semibold text-gray-200 mb-6">Recent API Calls (Last 100)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Timestamp</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Provider</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Model</th>
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Endpoint</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Input</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Output</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Cost</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Latency</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiCalls.map((call) => (
                      <tr key={call.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                        <td className="py-3 px-3 text-gray-400">
                          {new Date(call.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-3 text-gray-200 capitalize">{call.provider}</td>
                        <td className="py-3 px-3 text-gray-400">{call.model}</td>
                        <td className="py-3 px-3 text-gray-400">{call.endpoint}</td>
                        <td className="py-3 px-3 text-right text-gray-400">{call.input_tokens.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-gray-400">{call.output_tokens.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-green-400 font-semibold">
                          ${parseFloat(call.total_cost).toFixed(4)}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-400">
                          {call.latency_ms ? `${call.latency_ms}ms` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            call.status === 'success' ? 'bg-green-500/20 text-green-400' :
                            call.status === 'error' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {call.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {apiCalls.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No API calls logged yet. Start using the system to see API usage and costs.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
