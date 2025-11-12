'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BarChartIcon, TrendingUpIcon, AwardIcon, TargetIcon, CheckIcon, ArrowRightIcon } from '@/components/icons'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'topics'>('overview')
  const [expandedSection, setExpandedSection] = useState<'started' | 'mastered' | 'questions' | null>(null)
  const [allQuestions, setAllQuestions] = useState<any[]>([])

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

      // Build topic stats
      const topicStatsMap = new Map<string, any>()
      const topicIds = topicsData?.map(t => t.id) || []

      // Get ALL user responses for this user, then filter client-side
      // (Can't use .in() with 837 topic IDs - hits URL length limit)
      const { data: allUserResponses } = await supabase
        .from('user_responses')
        .select('topic_id, is_correct, confidence')
        .eq('user_id', user.id)

      // Filter to only responses for topics in this chapter
      const topicIdSet = new Set(topicIds)
      const userResponses = allUserResponses?.filter(r => topicIdSet.has(r.topic_id)) || []

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

      // Calculate mastery per dimension, then average (per our agreement)
      // Also calculate raw accuracy from all responses
      const topicDimensionStats = new Map<string, {
        dimensionMastery: Map<string, { correct: number, total: number }>
        totalCorrect: number
        totalAttempts: number
      }>()

      // Get all responses with dimension info
      const { data: responsesWithDimension } = await supabase
        .from('user_responses')
        .select('topic_id, is_correct, confidence, questions(dimension)')
        .eq('user_id', user.id)

      // Filter to this chapter and process
      responsesWithDimension?.filter(r => topicIdSet.has(r.topic_id)).forEach((response: any) => {
        const topicId = response.topic_id
        const dimension = response.questions?.dimension || 'unknown'
        const isCorrect = response.is_correct
        const confidence = response.confidence || 0
        const isHighConfidence = confidence >= 4

        if (!topicDimensionStats.has(topicId)) {
          topicDimensionStats.set(topicId, {
            dimensionMastery: new Map(),
            totalCorrect: 0,
            totalAttempts: 0
          })
        }

        const stats = topicDimensionStats.get(topicId)!
        stats.totalAttempts++

        if (isCorrect) {
          stats.totalCorrect++
        }

        // Track per-dimension high-confidence stats
        if (isHighConfidence) {
          if (!stats.dimensionMastery.has(dimension)) {
            stats.dimensionMastery.set(dimension, { correct: 0, total: 0 })
          }
          const dimStats = stats.dimensionMastery.get(dimension)!
          dimStats.total++
          if (isCorrect) {
            dimStats.correct++
          }
        }
      })

      // Calculate overall metrics and determine status
      let debugMasteredCount = 0
      topicStatsMap.forEach((stats, topicId) => {
        const dimStats = topicDimensionStats.get(topicId)
        if (dimStats) {
          // Calculate mastery per dimension, then average (per our agreement)
          const dimensionScores: number[] = []
          dimStats.dimensionMastery.forEach((dimData) => {
            if (dimData.total > 0) {
              const score = (dimData.correct / dimData.total) * 100
              dimensionScores.push(score)
            }
          })

          // Average across dimensions (or null if no dimensions tested)
          stats.overallMastery = dimensionScores.length > 0
            ? dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length
            : null

          // Raw accuracy (all attempts)
          stats.overallRawAccuracy = dimStats.totalAttempts > 0
            ? (dimStats.totalCorrect / dimStats.totalAttempts) * 100
            : null

          // Determine status
          // Require ALL 7 dimensions tested with 80%+ average to be "mastered"
          const totalDimensions = 7

          if (stats.overallMastery === null) {
            stats.status = 'not_started'
          } else if (stats.overallMastery < 0) {
            stats.status = 'struggling'
          } else if (stats.overallMastery >= 80 && dimensionScores.length === totalDimensions) {
            stats.status = 'mastered'
            debugMasteredCount++
            console.log('Mastered topic:', stats.name, 'Mastery:', stats.overallMastery, 'Dimensions tested:', dimensionScores.length, 'Scores:', dimensionScores)
          } else {
            stats.status = 'progressing'
            if (stats.overallMastery >= 80) {
              console.log('High mastery but incomplete dimensions:', stats.name, 'Mastery:', stats.overallMastery, 'Dimensions:', dimensionScores.length, '/ 7')
            }
          }
        }
      })

      console.log('Total topics marked as mastered:', debugMasteredCount)

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

      // Fetch all questions with details (fetch ALL, filter client-side to avoid URL length limit)
      const { data: allQuestionsData } = await supabase
        .from('user_responses')
        .select(`
          id,
          is_correct,
          confidence,
          created_at,
          bloom_level,
          topic_id,
          topics(name),
          questions(id, question_text, dimension)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Filter to only questions for topics in this chapter
      const filteredQuestions = allQuestionsData?.filter(q => topicIdSet.has(q.topic_id)) || []
      setAllQuestions(filteredQuestions)
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

  const startedTopics = topicStats.filter(t => t.totalAttempts > 0)
  const masteredTopics = topicStats
    .filter(t => t.status === 'mastered')
    .sort((a, b) => (b.overallMastery || 0) - (a.overallMastery || 0))

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

        {/* Tab Navigation */}
        <div className="flex gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'overview' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'topics' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            All Topics
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tooltip content="Topics you've practiced at least once">
            <button
              onClick={() => setExpandedSection(expandedSection === 'started' ? null : 'started')}
              className="neuro-stat group w-full text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-blue-400 font-medium">Topics Started</div>
                <TargetIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                {chapterSummary?.topicsStarted || 0}
                <span className="text-lg text-gray-500">/{chapterSummary?.topicsTotal || 0}</span>
              </div>
            </button>
          </Tooltip>

          <Tooltip content="Topics with 80%+ average mastery across all 7 dimensions">
            <button
              onClick={() => setExpandedSection(expandedSection === 'mastered' ? null : 'mastered')}
              className="neuro-stat group w-full text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-green-400 font-medium">Topics Mastered</div>
                <AwardIcon size={20} className="text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                {chapterSummary?.topicsMastered || 0}
              </div>
            </button>
          </Tooltip>

          <Tooltip content="Total question attempts across all topics">
            <button
              onClick={() => setExpandedSection(expandedSection === 'questions' ? null : 'questions')}
              className="neuro-stat group w-full text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-cyan-400 font-medium">Questions</div>
                <CheckIcon size={20} className="text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">
                {chapterSummary?.totalQuestions || 0}
              </div>
            </button>
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

        {/* Started Topics List */}
        {expandedSection === 'started' && startedTopics.length > 0 && (
          <div className="neuro-raised">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                  <TargetIcon size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Topics Started ({startedTopics.length})
                </h2>
              </div>
              <button
                onClick={() => setExpandedSection(null)}
                className="neuro-btn text-sm text-gray-400 hover:text-gray-300 px-4 py-2"
              >
                Close
              </button>
            </div>

            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
              {startedTopics.map(topic => (
                <div
                  key={topic.id}
                  className="neuro-inset p-4 rounded-lg flex items-center justify-between hover:bg-gray-900/30 transition-colors"
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
                      {topic.overallRawAccuracy !== null && (
                        <Tooltip content="Includes all attempts regardless of confidence">
                          <div className="text-gray-500">
                            Raw Accuracy: <span className="text-gray-400">{Math.round(topic.overallRawAccuracy)}%</span>
                          </div>
                        </Tooltip>
                      )}
                      {topic.totalAttempts > 0 && (
                        <div className="text-gray-500">
                          Attempts: <span className="text-gray-400">{topic.totalAttempts}</span>
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
          </div>
        )}

        {/* Mastered Topics List */}
        {expandedSection === 'mastered' && (
          <div className="neuro-raised">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                  <AwardIcon size={20} className="text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Topics Mastered ({masteredTopics.length})
                </h2>
              </div>
              <button
                onClick={() => setExpandedSection(null)}
                className="neuro-btn text-sm text-gray-400 hover:text-gray-300 px-4 py-2"
              >
                Close
              </button>
            </div>

            {masteredTopics.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
                {masteredTopics.map(topic => (
                  <div
                    key={topic.id}
                    className="neuro-inset p-4 rounded-lg flex items-center justify-between hover:bg-gray-900/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-gray-200 font-medium truncate">{topic.name}</h3>
                        <span className="neuro-raised px-2 py-0.5 text-xs text-green-400 rounded flex-shrink-0">
                          Mastered
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-gray-500">
                          Level: <span className="text-blue-400 font-medium">L{topic.currentBloomLevel}</span>
                        </div>
                        {topic.overallRawAccuracy !== null && (
                          <Tooltip content="Includes all attempts regardless of confidence">
                            <div className="text-gray-500">
                              Raw Accuracy: <span className="text-gray-400">{Math.round(topic.overallRawAccuracy)}%</span>
                            </div>
                          </Tooltip>
                        )}
                        {topic.totalAttempts > 0 && (
                          <div className="text-gray-500">
                            Attempts: <span className="text-gray-400">{topic.totalAttempts}</span>
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
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No mastered topics yet
                </div>
                <div className="text-sm text-gray-600">
                  Topics require 80%+ average mastery across all 7 dimensions to be considered mastered.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions List */}
        {expandedSection === 'questions' && (
          <div className="neuro-raised">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                  <CheckIcon size={20} className="text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Questions Attempted ({allQuestions.length})
                </h2>
              </div>
              <button
                onClick={() => setExpandedSection(null)}
                className="neuro-btn text-sm text-gray-400 hover:text-gray-300 px-4 py-2"
              >
                Close
              </button>
            </div>

            {allQuestions.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
                {allQuestions.map((q: any) => (
                  <div
                    key={q.id}
                    className="neuro-inset p-4 rounded-lg hover:bg-gray-900/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-200 text-sm mb-2 leading-relaxed">
                          {q.questions?.question_text || 'Question text unavailable'}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`neuro-raised px-2 py-0.5 text-xs rounded ${
                            q.is_correct ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {q.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className="text-gray-500 text-xs">
                            Confidence: <span className="text-gray-400">
                              {q.confidence === 4
                                ? 'High'
                                : q.confidence === 3
                                  ? 'Medium'
                                  : q.confidence === 2
                                    ? 'Low'
                                    : 'N/A'}
                            </span>
                          </span>
                          <span className="text-gray-500 text-xs">
                            Dimension: <span className="text-gray-400">{q.questions?.dimension || 'N/A'}</span>
                          </span>
                          <span className="text-gray-500 text-xs">
                            Bloom L{q.bloom_level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div>
                        Topic: <span className="text-gray-500">{q.topics?.name || 'Unknown'}</span>
                      </div>
                      <div>
                        {new Date(q.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="neuro-inset p-8 rounded-lg text-center">
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No questions attempted yet
                </div>
                <div className="text-sm text-gray-600">
                  Start practicing to see your question history here.
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* All Topics Tab */}
        {activeTab === 'topics' && (
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
                      {topic.overallRawAccuracy !== null && (
                        <Tooltip content="Includes all attempts regardless of confidence">
                          <div className="text-gray-500">
                            Raw Accuracy: <span className="text-gray-400">{Math.round(topic.overallRawAccuracy)}%</span>
                          </div>
                        </Tooltip>
                      )}
                      {topic.totalAttempts > 0 && (
                        <div className="text-gray-500">
                          Attempts: <span className="text-gray-400">{topic.totalAttempts}</span>
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
        )}

      </main>
    </div>
  )
}
