'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BarChartIcon, TrendingUpIcon, AwardIcon, TargetIcon, CheckIcon, ArrowRightIcon, TrophyIcon } from '@/components/icons'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'spacing' | 'api-costs' | 'exam-score'>('overview')
  const [expandedSection, setExpandedSection] = useState<'started' | 'mastered' | 'questions' | null>(null)
  const [allQuestions, setAllQuestions] = useState<any[]>([])
  const [spacedRepetitionData, setSpacedRepetitionData] = useState<any[]>([])
  const [apiCostData, setApiCostData] = useState<any>(null)
  const [examScoreData, setExamScoreData] = useState<any>(null)

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
        const isHighConfidence = confidence >= 3  // High confidence is now 3 (was 4)

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

      // Update lastPracticed for each topic based on most recent response
      filteredQuestions.forEach((response: any) => {
        const topicId = response.topic_id
        if (topicStatsMap.has(topicId)) {
          const stats = topicStatsMap.get(topicId)
          const responseDate = new Date(response.created_at)
          if (!stats.lastPracticed || responseDate > stats.lastPracticed) {
            stats.lastPracticed = responseDate
          }
        }
      })

      setChapterSummary(summary)

      // Load spaced repetition data
      const { data: masteryDataForSpacing } = await supabase
        .from('user_topic_mastery')
        .select('topic_id, bloom_level, last_practiced_at, questions_attempted, questions_correct, topics(name, full_name)')
        .eq('user_id', user.id)
        .eq('chapter_id', fetchedChapter.id)
        .not('last_practiced_at', 'is', null)

      const now = new Date()
      const spacingData: any[] = []

      masteryDataForSpacing?.forEach((m: any) => {
        const lastPracticed = new Date(m.last_practiced_at)
        const timeSinceMs = now.getTime() - lastPracticed.getTime()
        const daysSince = Math.floor(timeSinceMs / (1000 * 60 * 60 * 24))
        const hoursSince = Math.floor(timeSinceMs / (1000 * 60 * 60))
        const minutesSince = Math.floor(timeSinceMs / (1000 * 60))

        // Calculate accuracy-based mastery
        const accuracy = m.questions_attempted > 0
          ? (m.questions_correct / m.questions_attempted) * 100
          : 0

        // Calculate optimal interval based on accuracy
        let optimalInterval = 1
        if (accuracy >= 80) optimalInterval = 14
        else if (accuracy >= 60) optimalInterval = 7
        else if (accuracy >= 40) optimalInterval = 3
        else optimalInterval = 1

        // First-time correct bonus
        if (m.questions_attempted === 1 && m.questions_correct === 1) {
          optimalInterval = Math.max(optimalInterval, 3)
        }

        const daysSinceOptimal = daysSince - optimalInterval
        const isOverdue = daysSince >= optimalInterval
        const topic = Array.isArray(m.topics) ? m.topics[0] : m.topics

        spacingData.push({
          topicId: m.topic_id,
          topicName: topic?.name || 'Unknown',
          topicFullName: topic?.full_name || topic?.name || 'Unknown',
          bloomLevel: m.bloom_level,
          lastPracticed: m.last_practiced_at,
          daysSince,
          hoursSince,
          minutesSince,
          optimalInterval,
          daysSinceOptimal,
          isOverdue,
          accuracy,
          questionsAttempted: m.questions_attempted,
          questionsCorrect: m.questions_correct
        })
      })

      // Sort by earliest due for review
      spacingData.sort((a, b) => {
        // Both overdue: most overdue first (highest hours overdue)
        if (a.isOverdue && b.isOverdue) {
          const aHoursOverdue = a.hoursSince - (a.optimalInterval * 24)
          const bHoursOverdue = b.hoursSince - (b.optimalInterval * 24)
          return bHoursOverdue - aHoursOverdue
        }

        // One overdue, one not: overdue comes first
        if (a.isOverdue) return -1
        if (b.isOverdue) return 1

        // Both not yet due: soonest due first (smallest hours remaining)
        // Calculate hours remaining until due
        const aHoursRemaining = (a.optimalInterval * 24) - a.hoursSince
        const bHoursRemaining = (b.optimalInterval * 24) - b.hoursSince
        return aHoursRemaining - bHoursRemaining
      })

      setSpacedRepetitionData(spacingData)

      // Load API cost data
      const { data: apiCallLogs } = await supabase
        .from('api_call_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (apiCallLogs && apiCallLogs.length > 0) {
        // Calculate totals
        const totalCost = apiCallLogs.reduce((sum, log) => sum + parseFloat(log.total_cost || 0), 0)
        const totalInputTokens = apiCallLogs.reduce((sum, log) => sum + (log.input_tokens || 0), 0)
        const totalOutputTokens = apiCallLogs.reduce((sum, log) => sum + (log.output_tokens || 0), 0)
        const totalTokens = apiCallLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0)

        // Group by provider
        const byProvider = apiCallLogs.reduce((acc, log) => {
          const provider = log.provider || 'unknown'
          if (!acc[provider]) {
            acc[provider] = {
              calls: 0,
              cost: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              avgLatency: 0,
              latencies: []
            }
          }
          acc[provider].calls++
          acc[provider].cost += parseFloat(log.total_cost || 0)
          acc[provider].inputTokens += log.input_tokens || 0
          acc[provider].outputTokens += log.output_tokens || 0
          acc[provider].totalTokens += log.total_tokens || 0
          if (log.latency_ms) {
            acc[provider].latencies.push(log.latency_ms)
          }
          return acc
        }, {} as Record<string, any>)

        // Calculate average latencies
        Object.keys(byProvider).forEach(provider => {
          const latencies = byProvider[provider].latencies
          if (latencies.length > 0) {
            byProvider[provider].avgLatency = latencies.reduce((sum: number, l: number) => sum + l, 0) / latencies.length
          }
          delete byProvider[provider].latencies
        })

        // Group by model
        const byModel = apiCallLogs.reduce((acc, log) => {
          const model = log.model || 'unknown'
          if (!acc[model]) {
            acc[model] = {
              calls: 0,
              cost: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0
            }
          }
          acc[model].calls++
          acc[model].cost += parseFloat(log.total_cost || 0)
          acc[model].inputTokens += log.input_tokens || 0
          acc[model].outputTokens += log.output_tokens || 0
          acc[model].totalTokens += log.total_tokens || 0
          return acc
        }, {} as Record<string, any>)

        // Group by endpoint
        const byEndpoint = apiCallLogs.reduce((acc, log) => {
          const endpoint = log.endpoint || 'unknown'
          if (!acc[endpoint]) {
            acc[endpoint] = {
              calls: 0,
              cost: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0
            }
          }
          acc[endpoint].calls++
          acc[endpoint].cost += parseFloat(log.total_cost || 0)
          acc[endpoint].inputTokens += log.input_tokens || 0
          acc[endpoint].outputTokens += log.output_tokens || 0
          acc[endpoint].totalTokens += log.total_tokens || 0
          return acc
        }, {} as Record<string, any>)

        // Group by purpose
        const byPurpose = apiCallLogs.reduce((acc, log) => {
          const purpose = log.purpose || 'unknown'
          if (!acc[purpose]) {
            acc[purpose] = {
              calls: 0,
              cost: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0
            }
          }
          acc[purpose].calls++
          acc[purpose].cost += parseFloat(log.total_cost || 0)
          acc[purpose].inputTokens += log.input_tokens || 0
          acc[purpose].outputTokens += log.output_tokens || 0
          acc[purpose].totalTokens += log.total_tokens || 0
          return acc
        }, {} as Record<string, any>)

        // Calculate daily costs (last 30 days)
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const dailyCosts = apiCallLogs
          .filter(log => new Date(log.created_at) >= thirtyDaysAgo)
          .reduce((acc, log) => {
            const date = new Date(log.created_at).toISOString().split('T')[0]
            if (!acc[date]) {
              acc[date] = { cost: 0, calls: 0 }
            }
            acc[date].cost += parseFloat(log.total_cost || 0)
            acc[date].calls++
            return acc
          }, {} as Record<string, any>)

        // Recent calls (last 20)
        const recentCalls = apiCallLogs.slice(0, 20)

        setApiCostData({
          totalCost,
          totalInputTokens,
          totalOutputTokens,
          totalTokens,
          totalCalls: apiCallLogs.length,
          byProvider,
          byModel,
          byEndpoint,
          byPurpose,
          dailyCosts,
          recentCalls
        })
      } else {
        setApiCostData({
          totalCost: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          totalCalls: 0,
          byProvider: {},
          byModel: {},
          byEndpoint: {},
          byPurpose: {},
          dailyCosts: {},
          recentCalls: []
        })
      }

      // Calculate Exam Score Prediction
      // CompTIA Security+ scoring: 100-900 scale, passing score is 750

      // Get all user responses for this chapter (directly from user_responses, not aggregated)
      // Filter to only responses for topics in this chapter
      const { data: allUserResponsesForExam } = await supabase
        .from('user_responses')
        .select('is_correct, bloom_level, topic_id, topics(chapter_id)')
        .eq('user_id', user.id)

      // Filter to only this chapter's responses
      const chapterResponses = allUserResponsesForExam?.filter(
        (r: any) => r.topics?.chapter_id === fetchedChapter.id
      ) || []

      if (chapterResponses.length > 0) {
        // Calculate metrics
        let totalQuestions = chapterResponses.length
        let totalCorrect = 0
        let bloomLevelPerformance: Record<number, { correct: number, total: number }> = {}

        chapterResponses.forEach((response: any) => {
          const isCorrect = response.is_correct
          const bloom = response.bloom_level

          if (isCorrect) {
            totalCorrect++
          }

          if (!bloomLevelPerformance[bloom]) {
            bloomLevelPerformance[bloom] = { correct: 0, total: 0 }
          }
          bloomLevelPerformance[bloom].total++
          if (isCorrect) {
            bloomLevelPerformance[bloom].correct++
          }
        })

        const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) : 0

        // Calculate Bloom level mastery distribution
        const bloomAccuracies: Record<number, number> = {}
        Object.keys(bloomLevelPerformance).forEach(bloom => {
          const level = parseInt(bloom)
          const perf = bloomLevelPerformance[level]
          bloomAccuracies[level] = perf.total > 0 ? (perf.correct / perf.total) : 0
        })

        // Weighted scoring (higher Bloom levels weighted more)
        // Bloom 1-2: 15% each, Bloom 3-4: 20% each, Bloom 5-6: 15% each
        const bloomWeights: Record<number, number> = {
          1: 0.15,
          2: 0.15,
          3: 0.20,
          4: 0.20,
          5: 0.15,
          6: 0.15
        }

        let weightedScore = 0
        let totalWeight = 0
        Object.keys(bloomAccuracies).forEach(bloom => {
          const level = parseInt(bloom)
          const weight = bloomWeights[level] || 0.10
          weightedScore += bloomAccuracies[level] * weight
          totalWeight += weight
        })

        // Normalize if not all Bloom levels practiced
        if (totalWeight > 0) {
          weightedScore = weightedScore / totalWeight
        } else {
          weightedScore = overallAccuracy
        }

        // Map to 100-900 scale
        // Base score starts at 100 (no knowledge) and goes to 900 (perfect)
        const baseScore = 100 + (weightedScore * 800)

        // Calculate confidence interval based on sample size
        // More questions answered = narrower confidence interval
        const minQuestionsForConfidence = 100
        const confidenceWidth = Math.max(50, 200 * (1 - Math.min(totalQuestions / minQuestionsForConfidence, 1)))

        // Apply penalty for low sample size
        let sampleSizePenalty = 0
        if (totalQuestions < 20) {
          sampleSizePenalty = 100 * (1 - totalQuestions / 20)
        }

        const predictedScore = Math.max(100, Math.min(900, Math.round(baseScore - sampleSizePenalty)))
        const lowerBound = Math.max(100, Math.round(predictedScore - confidenceWidth))
        const upperBound = Math.min(900, Math.round(predictedScore + confidenceWidth))

        // Calculate readiness metrics
        const passingScore = 750
        const isLikelyToPass = lowerBound >= passingScore
        const isPossibleToPass = upperBound >= passingScore
        const confidenceLevel = totalQuestions >= minQuestionsForConfidence ? 'high' :
                               totalQuestions >= 50 ? 'medium' : 'low'

        // Recommendations
        const recommendations: string[] = []

        if (totalQuestions < 20) {
          recommendations.push('Complete more practice questions to get an accurate prediction')
        }

        Object.keys(bloomWeights).forEach(bloom => {
          const level = parseInt(bloom)
          const accuracy = bloomAccuracies[level] || 0
          if (accuracy < 0.6) {
            recommendations.push(`Focus on Bloom Level ${level} topics (currently ${(accuracy * 100).toFixed(0)}% accuracy)`)
          }
        })

        if (!isLikelyToPass) {
          if (isPossibleToPass) {
            recommendations.push(`Your score range spans the passing threshold - focus on consistency to ensure passing`)
          } else {
            const pointsNeeded = passingScore - upperBound
            recommendations.push(`Need to improve by approximately ${pointsNeeded} points to reach passing score range`)
          }
        }

        if (recommendations.length === 0 && isLikelyToPass) {
          recommendations.push('You are well-prepared! Continue reviewing weaker topics to maintain readiness')
        }

        setExamScoreData({
          predictedScore,
          lowerBound,
          upperBound,
          confidenceLevel,
          confidenceWidth,
          totalQuestions,
          totalCorrect,
          overallAccuracy,
          bloomAccuracies,
          bloomLevelPerformance,
          isLikelyToPass,
          isPossibleToPass,
          passingScore,
          recommendations
        })
      } else {
        setExamScoreData({
          predictedScore: null,
          lowerBound: null,
          upperBound: null,
          confidenceLevel: 'none',
          totalQuestions: 0,
          recommendations: ['Start practicing to get your exam score prediction']
        })
      }

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

  const startedTopics = topicStats
    .filter(t => t.totalAttempts > 0)
    .sort((a, b) => {
      // Sort by most recent practice first
      if (!a.lastPracticed && !b.lastPracticed) return 0
      if (!a.lastPracticed) return 1
      if (!b.lastPracticed) return -1
      return b.lastPracticed.getTime() - a.lastPracticed.getTime()
    })
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
          <button
            onClick={() => setActiveTab('spacing')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'spacing' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            Spaced Repetition
            {spacedRepetitionData.filter(s => s.isOverdue).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                {spacedRepetitionData.filter(s => s.isOverdue).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('api-costs')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'api-costs' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            API Costs
          </button>
          <button
            onClick={() => setActiveTab('exam-score')}
            className={`neuro-btn px-6 py-3 whitespace-nowrap transition-colors ${
              activeTab === 'exam-score' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            Exam Score
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
                              {q.confidence === 3
                                ? 'High'
                                : q.confidence === 2
                                  ? 'Medium'
                                  : q.confidence === 1
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

        {/* Spaced Repetition Tab */}
        {activeTab === 'spacing' && (
          <div className="neuro-raised">
            <div className="flex items-center gap-3 mb-6">
              <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                <TrendingUpIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                Spaced Repetition Schedule
              </h2>
            </div>

            {spacedRepetitionData.length > 0 ? (
              <>
                <div className="mb-6 neuro-inset p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">
                    Review intervals adapt based on your accuracy:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500"></div>
                      <span className="text-gray-500">&lt;40% → 1 day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      <span className="text-gray-500">40-59% → 3 days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span className="text-gray-500">60-79% → 7 days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span className="text-gray-500">≥80% → 14 days</span>
                    </div>
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
                  {spacedRepetitionData.map((item, index) => {
                    const urgencyColor = item.isOverdue
                      ? item.daysSinceOptimal > 7
                        ? 'text-red-400'
                        : item.daysSinceOptimal > 3
                          ? 'text-orange-400'
                          : 'text-yellow-400'
                      : 'text-gray-400'

                    return (
                      <div
                        key={`${item.topicId}-${item.bloomLevel}`}
                        className={`neuro-inset p-4 rounded-lg hover:bg-gray-900/30 transition-colors ${
                          item.isOverdue ? 'border-l-4 border-red-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-base font-medium text-gray-200 truncate">
                                {item.topicName}
                              </div>
                              <div className="neuro-inset px-2 py-0.5 rounded text-xs text-blue-400 whitespace-nowrap">
                                Bloom L{item.bloomLevel}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              <Tooltip content={`Last practiced ${new Date(item.lastPracticed).toLocaleDateString()} ${new Date(item.lastPracticed).toLocaleTimeString()}`}>
                                <div className="flex flex-col cursor-help">
                                  <span className="text-gray-500">Last Practice</span>
                                  <span className={`font-medium ${urgencyColor}`}>
                                    {item.daysSince === 0
                                      ? item.hoursSince === 0
                                        ? 'Just now'
                                        : item.hoursSince === 1
                                          ? '1 hour ago'
                                          : `${item.hoursSince} hours ago`
                                      : item.daysSince < 7
                                        ? (() => {
                                            const remainingHours = item.hoursSince % 24
                                            if (item.daysSince === 1) {
                                              return remainingHours === 0
                                                ? '1 day ago'
                                                : `1 day ${remainingHours}h ago`
                                            }
                                            return remainingHours === 0
                                              ? `${item.daysSince} days ago`
                                              : `${item.daysSince} days ${remainingHours}h ago`
                                          })()
                                        : item.daysSince < 30
                                          ? `${Math.floor(item.daysSince / 7)} weeks ago`
                                          : `${Math.floor(item.daysSince / 30)} months ago`}
                                  </span>
                                </div>
                              </Tooltip>

                              <Tooltip content={`${item.questionsCorrect} correct out of ${item.questionsAttempted} attempts`}>
                                <div className="flex flex-col cursor-help">
                                  <span className="text-gray-500">Accuracy</span>
                                  <span className="font-medium text-gray-300">
                                    {item.accuracy.toFixed(0)}%
                                  </span>
                                </div>
                              </Tooltip>

                              <div className="flex flex-col">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-medium ${item.isOverdue ? 'text-red-400' : 'text-green-400'}`}>
                                  {item.isOverdue
                                    ? (() => {
                                        if (item.daysSinceOptimal === 0) {
                                          const hoursOverdue = item.hoursSince - (item.optimalInterval * 24)
                                          return hoursOverdue === 1
                                            ? 'Overdue (1h)'
                                            : `Overdue (${hoursOverdue}h)`
                                        }
                                        const remainingHours = item.hoursSince % 24
                                        if (item.daysSinceOptimal === 1) {
                                          return remainingHours === 0
                                            ? 'Overdue (1d)'
                                            : `Overdue (1d ${remainingHours}h)`
                                        }
                                        return remainingHours === 0
                                          ? `Overdue (${item.daysSinceOptimal}d)`
                                          : `Overdue (${item.daysSinceOptimal}d ${remainingHours}h)`
                                      })()
                                    : (() => {
                                        const daysRemaining = item.optimalInterval - item.daysSince
                                        if (daysRemaining === 0) {
                                          const hoursRemaining = (item.optimalInterval * 24) - item.hoursSince
                                          return hoursRemaining === 1
                                            ? 'Due in 1h'
                                            : `Due in ${hoursRemaining}h`
                                        }
                                        const remainingHours = (24 - (item.hoursSince % 24)) % 24
                                        if (daysRemaining === 1) {
                                          return remainingHours === 0
                                            ? 'Due in 1d'
                                            : `Due in ${remainingHours}h`
                                        }
                                        return remainingHours === 0
                                          ? `Due in ${daysRemaining}d`
                                          : `Due in ${daysRemaining - 1}d ${remainingHours}h`
                                      })()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {item.isOverdue && (
                            <Link
                              href={`/subjects/${subject}/${chapter}/quiz`}
                              className="neuro-btn text-blue-400 px-4 py-2 text-sm whitespace-nowrap flex items-center gap-2"
                            >
                              Review Now
                              <ArrowRightIcon size={16} />
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 neuro-inset p-4 rounded-lg text-sm text-gray-400">
                  <div className="font-medium text-gray-300 mb-2">How it works:</div>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Topics are sorted by priority: struggling + overdue topics first</li>
                    <li>Review intervals adapt based on your accuracy (higher accuracy = longer intervals)</li>
                    <li>Overdue topics should be reviewed soon to maintain retention</li>
                    <li>First-time correct answers get at least 3 days before next review</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="neuro-inset p-8 rounded-lg text-center">
                <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUpIcon size={40} className="text-gray-600" />
                </div>
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No practice history yet
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Start practicing topics to see your spaced repetition schedule
                </div>
                <Link
                  href={`/subjects/${subject}/${chapter}/quiz`}
                  className="neuro-btn text-blue-400 inline-flex items-center gap-2 px-6 py-3"
                >
                  <CheckIcon size={18} />
                  <span>Start Practice</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* API Costs Tab */}
        {activeTab === 'api-costs' && (
          <div className="neuro-raised">
            <div className="flex items-center gap-3 mb-6">
              <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                <BarChartIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                API Costs & Usage
              </h2>
            </div>

            {apiCostData && apiCostData.totalCalls > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="neuro-stat group cursor-help" title="Total cost of all API calls">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-blue-400 font-medium">Total Cost</div>
                      <BarChartIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                      ${apiCostData.totalCost.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Across {apiCostData.totalCalls.toLocaleString()} calls
                    </div>
                  </div>

                  <div className="neuro-stat group cursor-help" title="Total tokens consumed">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-green-400 font-medium">Total Tokens</div>
                      <TrendingUpIcon size={20} className="text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                      {apiCostData.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {apiCostData.totalInputTokens.toLocaleString()} in / {apiCostData.totalOutputTokens.toLocaleString()} out
                    </div>
                  </div>

                  <div className="neuro-stat group cursor-help" title="Average cost per API call">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-yellow-400 font-medium">Avg Cost/Call</div>
                      <TargetIcon size={20} className="text-yellow-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">
                      ${(apiCostData.totalCost / apiCostData.totalCalls).toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {Math.round(apiCostData.totalTokens / apiCostData.totalCalls).toLocaleString()} tokens/call
                    </div>
                  </div>

                  <div className="neuro-stat group cursor-help" title="Number of unique providers used">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-purple-400 font-medium">Providers</div>
                      <AwardIcon size={20} className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-purple-400 transition-colors">
                      {Object.keys(apiCostData.byProvider).length}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {Object.keys(apiCostData.byModel).length} models
                    </div>
                  </div>
                </div>

                {/* By Provider */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">By Provider</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(apiCostData.byProvider)
                      .sort(([, a]: any, [, b]: any) => b.cost - a.cost)
                      .map(([provider, stats]: [string, any]) => (
                        <div key={provider} className="neuro-inset p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-base font-medium text-gray-200 capitalize">
                              {provider}
                            </div>
                            <div className="text-sm text-blue-400 font-semibold">
                              ${stats.cost.toFixed(4)}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-gray-500">
                            <div className="flex justify-between">
                              <span>Calls:</span>
                              <span className="text-gray-400">{stats.calls.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tokens:</span>
                              <span className="text-gray-400">{stats.totalTokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Latency:</span>
                              <span className="text-gray-400">{Math.round(stats.avgLatency)}ms</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* By Model */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">By Model</h3>
                  <div className="neuro-inset rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left p-3 text-gray-400 font-medium">Model</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Calls</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Cost</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Tokens</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Cost/Call</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(apiCostData.byModel)
                            .sort(([, a]: any, [, b]: any) => b.cost - a.cost)
                            .map(([model, stats]: [string, any]) => (
                              <tr key={model} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                                <td className="p-3 text-gray-300 font-mono text-xs">{model}</td>
                                <td className="p-3 text-right text-gray-400">{stats.calls.toLocaleString()}</td>
                                <td className="p-3 text-right text-blue-400 font-medium">${stats.cost.toFixed(4)}</td>
                                <td className="p-3 text-right text-gray-400">{stats.totalTokens.toLocaleString()}</td>
                                <td className="p-3 text-right text-gray-500">${(stats.cost / stats.calls).toFixed(5)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* By Endpoint */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">By Endpoint</h3>
                  <div className="neuro-inset rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left p-3 text-gray-400 font-medium">Endpoint</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Calls</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Cost</th>
                            <th className="text-right p-3 text-gray-400 font-medium">Avg Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(apiCostData.byEndpoint)
                            .sort(([, a]: any, [, b]: any) => b.calls - a.calls)
                            .map(([endpoint, stats]: [string, any]) => (
                              <tr key={endpoint} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                                <td className="p-3 text-gray-300 font-mono text-xs">{endpoint}</td>
                                <td className="p-3 text-right text-gray-400">{stats.calls.toLocaleString()}</td>
                                <td className="p-3 text-right text-blue-400 font-medium">${stats.cost.toFixed(4)}</td>
                                <td className="p-3 text-right text-gray-500">${(stats.cost / stats.calls).toFixed(5)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* By Purpose */}
                {Object.keys(apiCostData.byPurpose).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4">By Purpose</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(apiCostData.byPurpose)
                        .sort(([, a]: any, [, b]: any) => b.cost - a.cost)
                        .map(([purpose, stats]: [string, any]) => (
                          <div key={purpose} className="neuro-inset p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-base font-medium text-gray-200">
                                {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="text-sm text-green-400 font-semibold">
                                ${stats.cost.toFixed(4)}
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-500">
                              <div className="flex justify-between">
                                <span>Calls:</span>
                                <span className="text-gray-400">{stats.calls.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tokens:</span>
                                <span className="text-gray-400">{stats.totalTokens.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recent Calls */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">Recent API Calls</h3>
                  <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2">
                    {apiCostData.recentCalls.map((call: any) => (
                      <div
                        key={call.id}
                        className={`neuro-inset p-3 rounded-lg text-xs ${
                          call.status !== 'success' ? 'border-l-4 border-red-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-300 font-medium capitalize">{call.provider}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-500 font-mono">{call.model}</span>
                              {call.status !== 'success' && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                  {call.status}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 truncate mb-1">{call.endpoint}</div>
                            {call.purpose && (
                              <div className="text-gray-600 text-xs">
                                {call.purpose.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-blue-400 font-semibold mb-1">
                              ${parseFloat(call.total_cost).toFixed(5)}
                            </div>
                            <div className="text-gray-500">
                              {call.total_tokens.toLocaleString()} tokens
                            </div>
                            {call.latency_ms && (
                              <div className="text-gray-600 text-xs mt-1">
                                {call.latency_ms}ms
                              </div>
                            )}
                            <div className="text-gray-600 text-xs mt-1">
                              {new Date(call.created_at).toLocaleDateString()} {new Date(call.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="neuro-inset p-4 rounded-lg text-sm text-gray-400">
                  <div className="font-medium text-gray-300 mb-2">About API Costs</div>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Costs are calculated based on actual token usage and provider pricing</li>
                    <li>All API calls are logged for transparency and cost tracking</li>
                    <li>Input tokens include prompts and context; output tokens are AI responses</li>
                    <li>Latency measures the time taken for each API call to complete</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="neuro-inset p-8 rounded-lg text-center">
                <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChartIcon size={40} className="text-gray-600" />
                </div>
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No API usage yet
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Start using the platform to see API costs and usage statistics
                </div>
                <Link
                  href={`/subjects/${subject}/${chapter}/quiz`}
                  className="neuro-btn text-blue-400 inline-flex items-center gap-2 px-6 py-3"
                >
                  <CheckIcon size={18} />
                  <span>Start Learning</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Exam Score Tab */}
        {activeTab === 'exam-score' && (
          <div className="neuro-raised">
            <div className="flex items-center gap-3 mb-6">
              <div className="neuro-inset w-10 h-10 rounded-lg flex items-center justify-center">
                <TrophyIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                CompTIA Security+ Exam Score Prediction
              </h2>
            </div>

            {examScoreData && examScoreData.predictedScore !== null ? (
              <>
                {/* Predicted Score Display */}
                <div className="neuro-inset p-8 rounded-lg mb-6 text-center">
                  <div className="text-sm text-gray-400 mb-2">Predicted Exam Score Range</div>
                  <Tooltip content={
                    `Score calculation: Your overall accuracy (${(examScoreData.overallAccuracy * 100).toFixed(1)}%) is weighted across Bloom levels. ` +
                    `Higher levels (Apply, Analyze) count for 20% each, others 15% each. This gives a base score, mapped to 100-900 scale. ` +
                    `${examScoreData.totalQuestions < 20 ? `Sample size penalty applied (only ${examScoreData.totalQuestions} questions). ` : ''}` +
                    `Confidence interval of ±${Math.round(examScoreData.confidenceWidth)} points based on ${examScoreData.totalQuestions} questions answered. ` +
                    `More questions = narrower range. Need 100+ questions for high confidence (±50 points).`
                  }>
                    <div className="text-6xl font-bold text-blue-400 mb-6 cursor-help">
                      {examScoreData.lowerBound} - {examScoreData.upperBound}
                    </div>
                  </Tooltip>

                  {/* Passing Score Reference */}
                  <div className="text-sm text-gray-500 mb-4">
                    Passing Score: {examScoreData.passingScore}
                  </div>

                  {/* Confidence Level */}
                  <div className="text-xs text-gray-500">
                    Confidence: <span className={`font-medium ${
                      examScoreData.confidenceLevel === 'high' ? 'text-green-400' :
                      examScoreData.confidenceLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {examScoreData.confidenceLevel.toUpperCase()}
                    </span> ({examScoreData.totalQuestions} questions answered)
                  </div>
                </div>

                {/* Score Breakdown Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="neuro-stat group cursor-help" title="Overall accuracy across all questions">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-blue-400 font-medium">Overall Accuracy</div>
                      <TargetIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                      {(examScoreData.overallAccuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {examScoreData.totalCorrect} / {examScoreData.totalQuestions} correct
                    </div>
                  </div>

                  <div className="neuro-stat group cursor-help" title="Confidence interval width">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-green-400 font-medium">Confidence Width</div>
                      <TrendingUpIcon size={20} className="text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                      ±{Math.round(examScoreData.confidenceWidth)}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {examScoreData.confidenceLevel === 'high' ? 'Very precise' :
                       examScoreData.confidenceLevel === 'medium' ? 'Moderately precise' : 'Imprecise'}
                    </div>
                  </div>

                  <div className="neuro-stat group cursor-help" title="Bloom levels practiced">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-purple-400 font-medium">Bloom Levels</div>
                      <TrophyIcon size={20} className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-purple-400 transition-colors">
                      {Object.keys(examScoreData.bloomAccuracies).length}/6
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Levels practiced
                    </div>
                  </div>
                </div>

                {/* Bloom Level Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">Performance by Bloom Level</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(level => {
                      const accuracy = examScoreData.bloomAccuracies[level] || 0
                      const perf = examScoreData.bloomLevelPerformance[level]
                      const hasData = perf && perf.total > 0
                      const color = accuracy >= 0.8 ? 'text-green-400' :
                                   accuracy >= 0.6 ? 'text-blue-400' :
                                   accuracy >= 0.4 ? 'text-yellow-400' : 'text-red-400'

                      return (
                        <div key={level} className={`neuro-inset p-4 rounded-lg ${!hasData ? 'opacity-50' : ''}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-base font-medium text-gray-200">
                              Bloom Level {level}
                            </div>
                            {hasData ? (
                              <div className={`text-sm font-semibold ${color}`}>
                                {(accuracy * 100).toFixed(0)}%
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">No data</div>
                            )}
                          </div>
                          {hasData && (
                            <div className="space-y-1 text-xs text-gray-500">
                              <div className="flex justify-between">
                                <span>Questions:</span>
                                <span className="text-gray-400">{perf.total}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Correct:</span>
                                <span className="text-gray-400">{perf.correct}</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    accuracy >= 0.8 ? 'bg-green-400' :
                                    accuracy >= 0.6 ? 'bg-blue-400' :
                                    accuracy >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${accuracy * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">Recommendations</h3>
                  <div className="neuro-inset rounded-lg p-4">
                    <ul className="space-y-2">
                      {examScoreData.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Info Box */}
                <div className="neuro-inset p-4 rounded-lg text-sm text-gray-400">
                  <div className="font-medium text-gray-300 mb-2">About This Prediction</div>
                  <ul className="space-y-1 text-xs list-disc list-inside">
                    <li>Score range: 100-900 (passing score is 750)</li>
                    <li>Prediction based on weighted performance across all Bloom levels</li>
                    <li>Higher Bloom levels (Apply, Analyze) are weighted more heavily</li>
                    <li>Confidence interval narrows as you answer more questions (100+ for high confidence)</li>
                    <li>This is an estimate based on your practice performance, not an official score</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="neuro-inset p-8 rounded-lg text-center">
                <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon size={40} className="text-gray-600" />
                </div>
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No exam prediction available yet
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Start practicing topics to get your predicted exam score
                </div>
                <Link
                  href={`/subjects/${subject}/${chapter}/quiz`}
                  className="neuro-btn text-blue-400 inline-flex items-center gap-2 px-6 py-3"
                >
                  <CheckIcon size={18} />
                  <span>Start Practice</span>
                </Link>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
