'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { RefreshIcon, AlertTriangleIcon, CheckIcon, XIcon, BarChartIcon, TrendingUpIcon, AwardIcon, TargetIcon, PlayIcon, ChevronDownIcon, LockIcon, LockOpenIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'
import { Tooltip } from '@/components/Tooltip'

export default function PerformancePage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const chapter = params.chapter as string

  const [loading, setLoading] = useState(true)
  const [chapterData, setChapterData] = useState<any>(null)
  const [masteryHeatmap, setMasteryHeatmap] = useState<any[]>([])
  const [progressSummary, setProgressSummary] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [topicUnlockLevels, setTopicUnlockLevels] = useState<Record<string, number>>({})
  const [resetting, setResetting] = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [heatmapExpanded, setHeatmapExpanded] = useState(false)
  const [activityExpanded, setActivityExpanded] = useState(false)

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
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
        .select('id, name, slug, subject_id, subjects(name, slug)')
        .eq('slug', chapter)
        .single()

      setChapterData(fetchedChapter)

      if (!fetchedChapter) return

      // Get mastery heatmap
      const { data: heatmapData } = await supabase
        .from('user_mastery_heatmap')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', fetchedChapter.id)

      setMasteryHeatmap(heatmapData || [])

      // Get progress summary
      const { data: summaryData } = await supabase
        .from('user_progress_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', fetchedChapter.id)
        .single()

      setProgressSummary(summaryData)

      // Get sessions for this chapter to filter responses
      const { data: chapterSessions } = await supabase
        .from('learning_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('chapter_id', fetchedChapter.id)

      // Get recent responses for this chapter's sessions
      if (chapterSessions && chapterSessions.length > 0) {
        const sessionIds = chapterSessions.map(s => s.id)
        const { data: responsesData } = await supabase
          .from('user_responses')
          .select('*')
          .eq('user_id', user.id)
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })
          .limit(20)

        setRecentActivity(responsesData || [])
      } else {
        setRecentActivity([])
      }

      // Get user progress for each topic to determine unlock levels
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('topic_id, current_bloom_level, topics(name)')
        .eq('user_id', user.id)

      // Build mapping from topic name to current_bloom_level
      const unlockLevels: Record<string, number> = {}
      if (progressData) {
        progressData.forEach((progress: any) => {
          if (progress.topics?.name) {
            unlockLevels[progress.topics.name] = progress.current_bloom_level
          }
        })
      }
      setTopicUnlockLevels(unlockLevels)

      setLoading(false)

    } catch (error) {
      console.error('Error loading performance data:', error)
      setLoading(false)
    }
  }

  const handleResetProgress = async () => {
    if (!confirm('WARNING: Reset all progress for this chapter?\n\nThis will permanently delete:\n• All mastery scores\n• Learning history\n• RL statistics\n• Session data\n\nThis action cannot be undone.')) {
      return
    }

    try {
      setResetting(true)

      const response = await fetch('/api/rl/reset-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter_id: chapterData?.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset progress')
      }

      // Show deletion details
      const details = data.deleted ?
        `\n\nDeleted:\n• ${data.deleted.responses} responses\n• ${data.deleted.sessions} sessions\n• ${data.deleted.mastery} mastery records\n• ${data.deleted.armStats} arm stats`
        : ''

      alert(`SUCCESS: Progress reset successfully!${details}`)

      // Force full page reload to clear all cached data
      window.location.reload()
    } catch (error: any) {
      console.error('Error resetting progress:', error)
      alert(`ERROR: ${error.message}`)
      setResetting(false)
    }
  }

  const getMasteryColor = (mastery: number | null) => {
    if (mastery === null || mastery === undefined) return 'text-gray-500'
    if (mastery >= 80) return 'text-green-500'
    if (mastery >= 60) return 'text-blue-500'
    if (mastery >= 40) return 'text-yellow-500'
    if (mastery >= 20) return 'text-red-500'
    return 'text-gray-500'
  }

  const getMasteryLabel = (mastery: number | null) => {
    if (mastery === null || mastery === undefined) return 'Not Started'
    if (mastery >= 80) return 'Mastered'
    if (mastery >= 60) return 'Proficient'
    if (mastery >= 40) return 'Developing'
    if (mastery >= 20) return 'Beginning'
    return 'Novice'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="neuro-card max-w-md text-center">
          <div className="text-blue-400 text-lg">Loading performance data...</div>
        </div>
      </div>
    )
  }

  const bloomLevels = [
    { num: 1, name: 'Remember' },
    { num: 2, name: 'Understand' },
    { num: 3, name: 'Apply' },
    { num: 4, name: 'Analyze' },
    { num: 5, name: 'Evaluate' },
    { num: 6, name: 'Create' }
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <div className="neuro-raised px-6 py-3 flex items-center gap-3 min-w-0 flex-shrink">
            <BarChartIcon size={24} className="text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-200 truncate">
                {chapterData?.name}
              </h1>
            </div>
          </div>
          <div className="flex-shrink-0">
            <HamburgerMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Overall Stats - Collapsible */}
        <div className="neuro-card mb-6">
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="w-full flex items-center justify-between p-2 -m-2 hover:bg-gray-800/20 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                <TrendingUpIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                Overall Statistics
              </h2>
            </div>
            <ChevronDownIcon
              size={24}
              className={`text-gray-400 transition-transform ${statsExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {statsExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
              <Tooltip content="Topics explored">
                <div className="neuro-inset p-4 rounded-lg group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-blue-400 font-medium">
                      Topics Started
                    </div>
                    <TargetIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                    {progressSummary?.topics_started || 0}
                  </div>
                </div>
              </Tooltip>
              <Tooltip content="80%+ mastery achieved">
                <div className="neuro-inset p-4 rounded-lg group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-green-400 font-medium">
                      Topics Mastered
                    </div>
                    <AwardIcon size={20} className="text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                    {progressSummary?.topics_mastered || 0}
                  </div>
                </div>
              </Tooltip>
              <Tooltip content="Total attempts made">
                <div className="neuro-inset p-4 rounded-lg group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-cyan-400 font-medium">
                      Questions Answered
                    </div>
                    <CheckIcon size={20} className="text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-4xl font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                    {progressSummary?.total_questions_attempted || 0}
                  </div>
                </div>
              </Tooltip>
              <Tooltip content="Correct answers">
                <div className="neuro-inset p-4 rounded-lg group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-blue-400 font-medium">
                      Overall Accuracy
                    </div>
                    <TrendingUpIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                    {progressSummary?.overall_accuracy ? Math.round(progressSummary.overall_accuracy) : 0}%
                  </div>
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Mastery Heatmap - Collapsible */}
        <div className="neuro-card mb-6">
          <button
            onClick={() => setHeatmapExpanded(!heatmapExpanded)}
            className="w-full flex items-center justify-between p-2 -m-2 hover:bg-gray-800/20 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                <BarChartIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                Mastery Heatmap
              </h2>
            </div>
            <ChevronDownIcon
              size={24}
              className={`text-gray-400 transition-transform ${heatmapExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {heatmapExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              {/* Legend */}
              <div className="flex items-center gap-4 text-sm mb-6 flex-wrap">
                <span className="text-gray-400 font-medium">Mastery Levels:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-800"></div>
                  <span className="text-gray-500">0-19%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-gray-500">20-39%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span className="text-gray-500">40-59%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-gray-500">60-79%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-gray-500">80%+</span>
                </div>
              </div>

              {masteryHeatmap.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-4 text-gray-400 font-medium">Topic</th>
                        {bloomLevels.map(level => (
                          <th key={level.num} className="p-4 text-center text-gray-400 font-medium">
                            <div>L{level.num}</div>
                            <div className="text-xs text-gray-500">{level.name}</div>
                          </th>
                        ))}
                        <th className="p-4 text-center text-gray-400 font-medium">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masteryHeatmap.map((row, idx) => (
                        <tr key={idx} className="border-t border-gray-800 hover:bg-gray-900/30 transition-colors">
                          <td className="p-4 text-gray-200 font-medium max-w-xs">
                            <Link
                              href={`/performance/${subject}/${chapter}/${encodeURIComponent(row.topic)}`}
                              className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                            >
                              <span className="truncate">{row.topic}</span>
                              <span className="opacity-0 group-hover:opacity-100 text-blue-400 text-xs">
                                →
                              </span>
                            </Link>
                          </td>
                          {bloomLevels.map(level => {
                            const masteryKey = `bloom_${level.num}` as keyof typeof row
                            const mastery = row[masteryKey] as number | null
                            const hasData = mastery !== null && mastery !== undefined
                            const currentBloomLevel = topicUnlockLevels[row.topic] || 1
                            const isLocked = level.num > currentBloomLevel
                            const isUnlockedNoData = !isLocked && !hasData

                            return (
                              <td key={level.num} className="p-4 text-center">
                                {isLocked ? (
                                  <Tooltip content={`Locked - Complete Level ${level.num - 1} to unlock`}>
                                    <div className="inline-flex">
                                      <LockIcon size={16} className="text-gray-600" />
                                    </div>
                                  </Tooltip>
                                ) : isUnlockedNoData ? (
                                  <Tooltip content={`${row.topic} - Level ${level.num}: Unlocked, no attempts yet`}>
                                    <div className="inline-flex">
                                      <LockOpenIcon size={16} className="text-gray-500" />
                                    </div>
                                  </Tooltip>
                                ) : (
                                  <Tooltip content={`${row.topic} - Level ${level.num}: ${Math.round(mastery || 0)}% (${getMasteryLabel(mastery)})`}>
                                    <div className={`${getMasteryColor(mastery)} font-medium text-sm`}>
                                      {Math.round(mastery || 0)}
                                    </div>
                                  </Tooltip>
                                )}
                              </td>
                            )
                          })}
                          <td className="p-4 text-center">
                            <div className="text-gray-200 font-medium">
                              {row.avg_mastery ? Math.round(row.avg_mastery) : 0}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="neuro-inset p-8 rounded-lg text-center">
                  <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChartIcon size={40} className="text-gray-600" />
                  </div>
                  <div className="text-gray-400 text-lg mb-2 font-semibold">No mastery data yet</div>
                  <div className="text-sm text-gray-600 mb-6">Start learning to see your progress!</div>
                  <Link
                    href={`/subjects/${subject}/${chapter}/quiz`}
                    className="neuro-btn-primary inline-flex items-center gap-2 px-6 py-3"
                  >
                    <PlayIcon size={18} />
                    <span>Start Learning</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity - Collapsible */}
        <div className="neuro-card">
          <button
            onClick={() => setActivityExpanded(!activityExpanded)}
            className="w-full flex items-center justify-between p-2 -m-2 hover:bg-gray-800/20 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                <TrendingUpIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                Recent Activity
              </h2>
            </div>
            <ChevronDownIcon
              size={24}
              className={`text-gray-400 transition-transform ${activityExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {activityExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 10).map((response: any) => {
                    // Parse arm_selected to get topic and bloom level
                    const armParts = response.arm_selected?.split('_') || []
                    const bloomLevel = armParts.length > 0 ? armParts[armParts.length - 1] : null
                    const topic = armParts.length > 1 ? armParts.slice(0, -1).join('_') : null

                    return (
                      <div
                        key={response.id}
                        className="neuro-inset p-4 rounded-lg"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            response.is_correct ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {response.is_correct ? (
                              <CheckIcon size={18} className="text-green-400" />
                            ) : (
                              <XIcon size={18} className="text-red-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                              {response.bloom_level && (
                                <span className="neuro-raised px-2 py-1 rounded text-blue-400">
                                  Bloom L{response.bloom_level}
                                </span>
                              )}
                              {response.confidence !== null && response.confidence !== undefined && (
                                <span className="text-gray-500">
                                  Confidence: {response.confidence}/5
                                </span>
                              )}
                              {response.reward !== null && response.reward !== undefined && (
                                <span className={`font-medium ${
                                  response.reward >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  Reward: {response.reward >= 0 ? '+' : ''}{response.reward.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-sm text-gray-500">
                            {new Date(response.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="neuro-inset p-8 rounded-lg text-center">
                  <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUpIcon size={40} className="text-gray-600" />
                  </div>
                  <div className="text-gray-400 text-lg mb-2 font-semibold">No activity yet</div>
                  <div className="text-sm text-gray-600 mb-6">Answer some questions to see your history!</div>
                  <Link
                    href={`/subjects/${subject}/${chapter}/quiz`}
                    className="neuro-btn-primary inline-flex items-center gap-2 px-6 py-3"
                  >
                    <PlayIcon size={18} />
                    <span>Start Learning</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone - Reset Progress */}
        <div className="neuro-card mt-8 border border-red-900/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-500">
                Permanently delete all progress for this chapter. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleResetProgress}
              disabled={resetting}
              className="neuro-btn text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300 px-6 py-3 whitespace-nowrap"
            >
              <RefreshIcon size={16} className={resetting ? 'animate-spin' : ''} />
              {resetting ? 'Resetting...' : 'Reset Progress'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
