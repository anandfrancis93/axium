'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BarChartIcon, TrendingUpIcon, AwardIcon, TargetIcon, AlertTriangleIcon, CheckIcon, ArrowRightIcon, LockIcon, LockOpenIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'
import { Tooltip } from '@/components/Tooltip'

export default function PerformancePage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const chapter = params.chapter as string

  const [loading, setLoading] = useState(true)
  const [chapterData, setChapterData] = useState<any>(null)
  const [topicStats, setTopicStats] = useState<any[]>([])
  const [chapterSummary, setChapterSummary] = useState<any>(null)
  const [showPriorityTopics, setShowPriorityTopics] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

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

      // Get chapter details
      const { data: fetchedChapter } = await supabase
        .from('chapters')
        .select('id, name, slug, subject_id, subjects(name, slug)')
        .eq('slug', chapter)
        .single()

      setChapterData(fetchedChapter)
      if (!fetchedChapter) return

      // Get all topics for this chapter
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, name, full_name, depth, description')
        .eq('chapter_id', fetchedChapter.id)
        .order('name')

      // Get mastery data for all topics
      const { data: masteryData } = await supabase
        .from('user_topic_mastery')
        .select('topic_id, bloom_level, mastery_score, last_practiced_at, topics(name)')
        .eq('user_id', user.id)
        .eq('chapter_id', fetchedChapter.id)

      // Get user progress (current Bloom level)
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('topic_id, current_bloom_level, total_attempts, topics(name)')
        .eq('user_id', user.id)

      // Get dimension coverage for high-confidence data
      const { data: dimensionData } = await supabase
        .from('user_dimension_coverage')
        .select('topic_id, bloom_level, dimension, high_confidence_correct, high_confidence_total, total_correct, total_attempts, topics(name)')
        .eq('user_id', user.id)
        .eq('chapter_id', fetchedChapter.id)

      // Build topic stats
      const topicStatsMap = new Map<string, any>()

      topicsData?.forEach((topic: any) => {
        topicStatsMap.set(topic.id, {
          id: topic.id,
          name: topic.name,
          full_name: topic.full_name || topic.name,
          depth: topic.depth || 0,
          description: topic.description,
          currentBloomLevel: 1,
          totalAttempts: 0,
          masteryByLevel: {} as Record<number, number>,
          overallMastery: null,
          overallRawAccuracy: null,
          lastPracticed: null,
          status: 'not_started' as 'not_started' | 'struggling' | 'progressing' | 'mastered'
        })
      })

      // Fill in progress data
      progressData?.forEach((progress: any) => {
        const topicId = progress.topic_id
        if (topicStatsMap.has(topicId)) {
          const stats = topicStatsMap.get(topicId)
          stats.currentBloomLevel = progress.current_bloom_level || 1
          stats.totalAttempts = progress.total_attempts || 0
        }
      })

      // Fill in mastery data
      masteryData?.forEach((mastery: any) => {
        const topicId = mastery.topic_id
        if (topicStatsMap.has(topicId)) {
          const stats = topicStatsMap.get(topicId)
          stats.masteryByLevel[mastery.bloom_level] = mastery.mastery_score

          if (mastery.last_practiced_at) {
            const practiceDate = new Date(mastery.last_practiced_at)
            if (!stats.lastPracticed || practiceDate > stats.lastPracticed) {
              stats.lastPracticed = practiceDate
            }
          }
        }
      })

      // Calculate overall mastery and raw accuracy from dimension data
      const topicDimensionStats = new Map<string, {
        totalHighConfCorrect: number
        totalHighConfTotal: number
        totalCorrect: number
        totalAttempts: number
      }>()

      dimensionData?.forEach((dim: any) => {
        const topicId = dim.topic_id
        if (!topicDimensionStats.has(topicId)) {
          topicDimensionStats.set(topicId, {
            totalHighConfCorrect: 0,
            totalHighConfTotal: 0,
            totalCorrect: 0,
            totalAttempts: 0
          })
        }
        const stats = topicDimensionStats.get(topicId)!
        stats.totalHighConfCorrect += dim.high_confidence_correct || 0
        stats.totalHighConfTotal += dim.high_confidence_total || 0
        stats.totalCorrect += dim.total_correct || 0
        stats.totalAttempts += dim.total_attempts || 0
      })

      // Calculate overall metrics and determine status
      topicStatsMap.forEach((stats, topicId) => {
        const dimStats = topicDimensionStats.get(topicId)
        if (dimStats) {
          stats.overallMastery = dimStats.totalHighConfTotal > 0
            ? (dimStats.totalHighConfCorrect / dimStats.totalHighConfTotal) * 100
            : null
          stats.overallRawAccuracy = dimStats.totalAttempts > 0
            ? (dimStats.totalCorrect / dimStats.totalAttempts) * 100
            : null

          // Determine status
          if (stats.overallMastery === null) {
            stats.status = 'not_started'
          } else if (stats.overallMastery < 0) {
            stats.status = 'struggling'
          } else if (stats.overallMastery >= 80) {
            stats.status = 'mastered'
          } else {
            stats.status = 'progressing'
          }
        }
      })

      const statsArray = Array.from(topicStatsMap.values())

      // Sort by last practiced (most recent first)
      statsArray.sort((a, b) => {
        if (!a.lastPracticed && !b.lastPracticed) return 0
        if (!a.lastPracticed) return 1
        if (!b.lastPracticed) return -1
        return b.lastPracticed.getTime() - a.lastPracticed.getTime()
      })

      setTopicStats(statsArray)

      // Calculate chapter summary
      const summary = {
        topicsTotal: statsArray.length,
        topicsStarted: statsArray.filter(t => t.totalAttempts > 0).length,
        topicsMastered: statsArray.filter(t => t.status === 'mastered').length,
        topicsStruggling: statsArray.filter(t => t.status === 'struggling').length,
        totalQuestions: statsArray.reduce((sum, t) => sum + t.totalAttempts, 0),
        overallAccuracy: 0
      }

      // Calculate overall chapter accuracy
      const totalCorrect = topicDimensionStats.size > 0
        ? Array.from(topicDimensionStats.values()).reduce((sum, s) => sum + s.totalCorrect, 0)
        : 0
      const totalAttempts = topicDimensionStats.size > 0
        ? Array.from(topicDimensionStats.values()).reduce((sum, s) => sum + s.totalAttempts, 0)
        : 0
      summary.overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0

      setChapterSummary(summary)
      setLoading(false)

    } catch (error) {
      console.error('Error loading performance data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="neuro-raised max-w-md text-center p-8">
          <div className="text-blue-400 text-lg">Loading performance data...</div>
        </div>
      </div>
    )
  }

  const strugglingTopics = topicStats.filter(t => t.status === 'struggling')
  const progressingTopics = topicStats.filter(t => t.status === 'progressing' && t.overallMastery >= 70)
  const startedTopics = topicStats.filter(t => t.totalAttempts > 0)

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChartIcon size={24} className="text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-200 truncate">
              {chapterData?.name}
            </h1>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tooltip content="Topics you've practiced at least once">
            <div className="neuro-stat group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-blue-400 font-medium">Topics Started</div>
                <TargetIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                {chapterSummary?.topicsStarted || 0}
                <span className="text-lg text-gray-500">/{chapterSummary?.topicsTotal || 0}</span>
              </div>
            </div>
          </Tooltip>

          <Tooltip content="Topics with 80%+ mastery (high-confidence correct answers)">
            <div className="neuro-stat group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-green-400 font-medium">Topics Mastered</div>
                <AwardIcon size={20} className="text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                {chapterSummary?.topicsMastered || 0}
              </div>
            </div>
          </Tooltip>

          <Tooltip content="Total question attempts across all topics">
            <div className="neuro-stat group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-cyan-400 font-medium">Questions</div>
                <CheckIcon size={20} className="text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                {chapterSummary?.totalQuestions || 0}
              </div>
            </div>
          </Tooltip>

          <Tooltip content="Percentage of all attempts answered correctly (includes low confidence)">
            <div className="neuro-stat group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-blue-400 font-medium">Raw Accuracy</div>
                <TrendingUpIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                {chapterSummary?.overallAccuracy ? Math.round(chapterSummary.overallAccuracy) : 0}%
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Priority Topics */}
        {(strugglingTopics.length > 0 || progressingTopics.length > 0) && (
          <div className="neuro-raised border-l-4 border-yellow-500">
            <button
              type="button"
              onClick={() => setShowPriorityTopics(!showPriorityTopics)}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                  <AlertTriangleIcon size={20} className="text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Topics Needing Attention
                </h2>
              </div>
              <span className="text-gray-400 text-xl">
                {showPriorityTopics ? '▼' : '▶'}
              </span>
            </button>

            {showPriorityTopics && (
              <div className="space-y-4">
                {strugglingTopics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-red-400 mb-3">Struggling Topics (Negative Mastery)</h3>
                    <div className="space-y-2">
                      {strugglingTopics.map(topic => (
                        <div key={topic.id} className="neuro-inset p-4 rounded-lg flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-200 font-medium truncate">{topic.name}</div>
                            <div className="text-sm text-gray-500">
                              Mastery: <span className="text-red-400 font-semibold">{topic.overallMastery !== null ? Math.round(topic.overallMastery) : '--'}%</span>
                              {topic.overallRawAccuracy !== null && (
                                <span className="ml-3">Raw Accuracy: {Math.round(topic.overallRawAccuracy)}%</span>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/performance/${subject}/${chapter}/${encodeURIComponent(topic.name)}`}
                            className="neuro-btn text-sm text-red-400 hover:text-red-300 px-4 py-2 ml-4 flex-shrink-0"
                          >
                            Review
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {progressingTopics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-yellow-400 mb-3">Close to Unlock (70-79% Mastery)</h3>
                    <div className="space-y-2">
                      {progressingTopics.map(topic => (
                        <div key={topic.id} className="neuro-inset p-4 rounded-lg flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-200 font-medium truncate">{topic.name}</div>
                            <div className="text-sm text-gray-500">
                              Mastery: <span className="text-yellow-400 font-semibold">{topic.overallMastery !== null ? Math.round(topic.overallMastery) : '--'}%</span>
                              <span className="ml-3 text-gray-400">Need {80 - Math.round(topic.overallMastery || 0)}% more</span>
                            </div>
                          </div>
                          <Link
                            href={`/performance/${subject}/${chapter}/${encodeURIComponent(topic.name)}`}
                            className="neuro-btn text-sm text-yellow-400 hover:text-yellow-300 px-4 py-2 ml-4 flex-shrink-0"
                          >
                            Practice
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* All Topics */}
        <div className="neuro-raised">
          <div className="flex items-center gap-3 mb-6">
            <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
              <TargetIcon size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-200">
              All Topics
            </h2>
          </div>

          {startedTopics.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
              {topicStats.map(topic => (
                <div
                  key={topic.id}
                  className={`neuro-inset p-4 rounded-lg flex items-center justify-between hover:bg-gray-900/30 transition-colors ${
                    topic.status === 'not_started' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-200 font-medium truncate">{topic.name}</h3>
                      {topic.status === 'mastered' && (
                        <span className="neuro-raised px-2 py-0.5 text-xs text-green-400 rounded flex-shrink-0">
                          Mastered
                        </span>
                      )}
                      {topic.status === 'struggling' && (
                        <span className="neuro-raised px-2 py-0.5 text-xs text-red-400 rounded flex-shrink-0">
                          Needs Review
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-gray-500">
                        Level: <span className="text-blue-400 font-medium">L{topic.currentBloomLevel}</span>
                      </div>
                      {topic.overallMastery !== null && (
                        <Tooltip content="Based on high-confidence (4-5) correct answers only">
                          <div className="text-gray-500">
                            Mastery: <span className={`font-semibold ${
                              topic.overallMastery >= 80 ? 'text-green-400' :
                              topic.overallMastery >= 60 ? 'text-blue-400' :
                              topic.overallMastery >= 40 ? 'text-yellow-400' :
                              topic.overallMastery >= 0 ? 'text-red-500' :
                              'text-red-400'
                            }`}>
                              {Math.round(topic.overallMastery)}%
                            </span>
                          </div>
                        </Tooltip>
                      )}
                      {topic.overallRawAccuracy !== null && (
                        <Tooltip content="Includes all attempts regardless of confidence">
                          <div className="text-gray-500">
                            Raw Accuracy: <span className="text-gray-400">{Math.round(topic.overallRawAccuracy)}%</span>
                          </div>
                        </Tooltip>
                      )}
                      {topic.totalAttempts > 0 && (
                        <div className="text-gray-500">
                          {topic.totalAttempts} attempt{topic.totalAttempts === 1 ? '' : 's'}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/performance/${subject}/${chapter}/${encodeURIComponent(topic.name)}`}
                    className="neuro-btn text-sm text-gray-300 hover:text-blue-400 px-4 py-2 ml-4 flex-shrink-0 flex items-center gap-2"
                  >
                    View Details
                    <ArrowRightIcon size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="neuro-inset p-8 rounded-lg text-center">
              <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TargetIcon size={40} className="text-gray-600" />
              </div>
              <div className="text-gray-400 text-lg font-semibold mb-2">
                No topics started yet
              </div>
              <div className="text-sm text-gray-600">
                Begin learning to see your progress here!
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
