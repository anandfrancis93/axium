'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { RefreshIcon, AlertTriangleIcon, CheckIcon, XIcon, BarChartIcon, TrendingUpIcon, AwardIcon, TargetIcon, ChevronDownIcon, LockIcon, LockOpenIcon, TrophyIcon, TrashIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'
import { Tooltip } from '@/components/Tooltip'
import Modal from '@/components/Modal'
import { estimateThetaAuto } from '@/lib/irt/theta-estimation'
import { thetaToExamScore, calculateScoreConfidenceInterval, calculatePassProbability, getScoreInterpretation, calculateReliability } from '@/lib/irt/exam-score'

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
  const [uniqueQuestionCounts, setUniqueQuestionCounts] = useState<Record<string, number>>({})
  const [resetting, setResetting] = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)
  const [heatmapExpanded, setHeatmapExpanded] = useState(false)
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [examPredictionExpanded, setExamPredictionExpanded] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [resetResults, setResetResults] = useState<any>(null)
  const [preResetCounts, setPreResetCounts] = useState<any>(null)
  const [loadingCounts, setLoadingCounts] = useState(false)
  const [examPrediction, setExamPrediction] = useState<any>(null)
  const [showTopicResetModal, setShowTopicResetModal] = useState(false)
  const [resetTopicData, setResetTopicData] = useState<{ topic: string, topic_id: string } | null>(null)
  const [resettingTopic, setResettingTopic] = useState(false)

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

      // Get all topics for this chapter with hierarchical info
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, name, full_name, depth, description')
        .eq('chapter_id', fetchedChapter.id)
        .order('name')

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

      let allResponses: any[] = []

      // Get ALL responses for EMA calculation (not just recent 20)
      if (chapterSessions && chapterSessions.length > 0) {
        const sessionIds = chapterSessions.map(s => s.id)

        // Get all responses for heatmap calculation
        const { data: allResponsesData } = await supabase
          .from('user_responses')
          .select('*, topics(name)')
          .eq('user_id', user.id)
          .in('session_id', sessionIds)
          .order('created_at', { ascending: true }) // Ascending for EMA calculation

        allResponses = allResponsesData || []

        // Get recent responses for activity feed (last 20)
        const { data: recentResponsesData } = await supabase
          .from('user_responses')
          .select('*, topics(name)')
          .eq('user_id', user.id)
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })
          .limit(20)

        setRecentActivity(recentResponsesData || [])
      } else {
        setRecentActivity([])
      }

      // Calculate EMA-based mastery heatmap from responses
      // Group responses by topic and bloom_level
      const masteryMap = new Map<string, Map<number, number>>() // topic -> bloom_level -> EMA
      const latestResponseMap = new Map<string, Date>() // topic -> latest response timestamp
      const alpha = 0.3 // Same EMA smoothing factor

      allResponses.forEach((response: any) => {
        const topicName = response.topics?.name
        const bloomLevel = response.bloom_level
        if (!topicName || !bloomLevel) return

        if (!masteryMap.has(topicName)) {
          masteryMap.set(topicName, new Map())
        }

        // Track latest response timestamp for this topic
        const responseDate = new Date(response.created_at)
        const currentLatest = latestResponseMap.get(topicName)
        if (!currentLatest || responseDate > currentLatest) {
          latestResponseMap.set(topicName, responseDate)
        }

        const topicMap = masteryMap.get(topicName)!
        const currentScore = response.is_correct ? 100 : 0
        const existingEMA = topicMap.get(bloomLevel)

        if (existingEMA === undefined) {
          // First response for this topic-bloom combination
          topicMap.set(bloomLevel, currentScore)
        } else {
          // Update EMA: new_ema = alpha * current + (1-alpha) * old
          const newEMA = alpha * currentScore + (1 - alpha) * existingEMA
          topicMap.set(bloomLevel, newEMA)
        }
      })

      // Convert masteryMap to heatmap format
      const heatmapData: any[] = []
      if (topicsData) {
        topicsData.forEach((topic: any) => {
          const topicMastery = masteryMap.get(topic.name)
          if (!topicMastery) return // Skip topics with no responses

          const row: any = {
            user_id: user.id,
            chapter_id: fetchedChapter.id,
            topic: topic.name,
            topic_id: topic.id,
            full_name: topic.full_name || topic.name,
            depth: topic.depth || 0,
            description: topic.description,
            latest_response: latestResponseMap.get(topic.name),
            bloom_1: topicMastery.get(1) !== undefined ? topicMastery.get(1) : null,
            bloom_2: topicMastery.get(2) !== undefined ? topicMastery.get(2) : null,
            bloom_3: topicMastery.get(3) !== undefined ? topicMastery.get(3) : null,
            bloom_4: topicMastery.get(4) !== undefined ? topicMastery.get(4) : null,
            bloom_5: topicMastery.get(5) !== undefined ? topicMastery.get(5) : null,
            bloom_6: topicMastery.get(6) !== undefined ? topicMastery.get(6) : null,
          }

          // Calculate average mastery (only from levels with data)
          const masteryValues = Array.from(topicMastery.values())
          row.avg_mastery = masteryValues.length > 0
            ? masteryValues.reduce((sum, val) => sum + val, 0) / masteryValues.length
            : 0

          heatmapData.push(row)
        })
      }

      // Sort by latest response timestamp (most recent first)
      heatmapData.sort((a, b) => {
        const dateA = a.latest_response ? new Date(a.latest_response).getTime() : 0
        const dateB = b.latest_response ? new Date(b.latest_response).getTime() : 0
        return dateB - dateA
      })

      setMasteryHeatmap(heatmapData)

      // Get unique question counts for each topic × Bloom level
      const { data: dimensionData } = await supabase
        .from('user_dimension_coverage')
        .select('topic_id, bloom_level, unique_questions_answered, topics(name)')
        .eq('user_id', user.id)
        .eq('chapter_id', fetchedChapter.id)

      // Build mapping from "topicName-bloomLevel" to unique question count
      const countsMap: Record<string, number> = {}
      if (dimensionData) {
        dimensionData.forEach((item: any) => {
          const topicName = item.topics?.name
          if (topicName) {
            const key = `${topicName}-${item.bloom_level}`
            const uniqueCount = item.unique_questions_answered?.length || 0
            // Track the maximum unique count across all dimensions for this topic-bloom combo
            countsMap[key] = Math.max(countsMap[key] || 0, uniqueCount)
          }
        })
      }
      setUniqueQuestionCounts(countsMap)

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

      // Calculate exam score prediction using IRT
      if (allResponses.length >= 5) {
        const responses = allResponses.map((r: any) => ({
          is_correct: r.is_correct,
          bloom_level: r.bloom_level || 3,
          question_type: 'mcq_single'
        }))

        const { theta, standardError, responsesCount, information } = estimateThetaAuto(responses)
        const predictedScore = thetaToExamScore(theta)
        const { lower, upper } = calculateScoreConfidenceInterval(theta, standardError, 0.95)
        const passProbability = calculatePassProbability(theta, standardError, 750)
        const reliability = calculateReliability(information)
        const interpretation = getScoreInterpretation(predictedScore, passProbability, responsesCount)

        setExamPrediction({
          theta,
          standardError,
          predictedScore,
          confidenceLower: lower,
          confidenceUpper: upper,
          passProbability,
          reliability,
          responsesCount,
          interpretation
        })
      } else {
        setExamPrediction(null)
      }

      setLoading(false)

    } catch (error) {
      console.error('Error loading performance data:', error)
      setLoading(false)
    }
  }

  const loadPreResetCounts = async () => {
    if (!chapterData?.id) return

    setLoadingCounts(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all sessions for this chapter
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterData.id)

      const sessionIds = sessions?.map(s => s.id) || []

      // Count responses
      const { count: responsesCount } = await supabase
        .from('user_responses')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds)

      // Count sessions
      const sessionsCount = sessions?.length || 0

      // Count mastery records
      const { count: masteryCount } = await supabase
        .from('user_topic_mastery')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('chapter_id', chapterData.id)

      // Count arm stats
      const { count: armStatsCount } = await supabase
        .from('rl_arm_stats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('chapter_id', chapterData.id)

      // Count dimension coverage
      const { count: dimensionCoverageCount } = await supabase
        .from('user_dimension_coverage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('chapter_id', chapterData.id)

      // Count AI-generated questions for this user in this chapter
      const { count: questionsCount, error: questionsCountError } = await supabase
        .from('questions')
        .select('topic_id, topics!inner(chapter_id)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('topics.chapter_id', chapterData.id)
        .eq('source_type', 'ai_generated_realtime')

      console.log('AI-generated questions count:', {
        count: questionsCount,
        error: questionsCountError
      })

      setPreResetCounts({
        responses: responsesCount || 0,
        sessions: sessionsCount,
        mastery: masteryCount || 0,
        armStats: armStatsCount || 0,
        dimensionCoverage: dimensionCoverageCount || 0,
        questions: questionsCount || 0
      })
    } catch (error) {
      console.error('Error loading counts:', error)
    } finally {
      setLoadingCounts(false)
    }
  }

  const handleShowConfirmModal = async () => {
    setShowConfirmModal(true)
    await loadPreResetCounts()
  }

  const handleResetProgress = async () => {
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

      // Store results and show success modal
      setResetResults(data.deleted)
      setShowConfirmModal(false)
      setShowSuccessModal(true)
      setResetting(false)
    } catch (error: any) {
      console.error('Error resetting progress:', error)
      setShowConfirmModal(false)
      setResetting(false)
      // TODO: Show error modal instead of alert
      alert(`ERROR: ${error.message}`)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    // Force full page reload to clear all cached data
    window.location.reload()
  }

  const handleShowTopicResetModal = async (topic: string, topicId: string) => {
    setResetTopicData({ topic, topic_id: topicId })
    setShowTopicResetModal(true)
  }

  const handleResetTopic = async () => {
    if (!resetTopicData) return

    try {
      setResettingTopic(true)

      const response = await fetch('/api/rl/reset-topic-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterData?.id,
          topic_id: resetTopicData.topic_id,
          bloom_level: null // Reset all Bloom levels for this topic
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset topic progress')
      }

      setShowTopicResetModal(false)
      setResetTopicData(null)
      setResettingTopic(false)

      // Reload the page data
      await loadPerformanceData()
    } catch (error: any) {
      console.error('Error resetting topic progress:', error)
      setShowTopicResetModal(false)
      setResetTopicData(null)
      setResettingTopic(false)
      alert(`ERROR: ${error.message}`)
    }
  }

  const getMasteryColor = (mastery: number | null, uniqueCount: number) => {
    if (mastery === null || mastery === undefined || uniqueCount === 0) return 'text-gray-500'
    // Show color based on actual score, regardless of data sufficiency
    if (uniqueCount >= 5 && mastery >= 80) return 'text-green-700' // Deep mastery
    if (mastery >= 80) return 'text-green-500' // Mastered
    if (mastery >= 60) return 'text-blue-500' // Proficient
    if (mastery >= 40) return 'text-yellow-500' // Developing
    return 'text-red-500' // Struggling
  }

  const getMasteryLabel = (mastery: number | null, uniqueCount: number) => {
    if (mastery === null || mastery === undefined || uniqueCount === 0) return 'Not Tested'
    if (uniqueCount < 3) return 'Insufficient'
    if (uniqueCount >= 5 && mastery >= 80) return 'Deep Mastery'
    if (mastery >= 80) return 'Mastered'
    if (mastery >= 60) return 'Proficient'
    if (mastery >= 40) return 'Developing'
    return 'Struggling'
  }

  const getMasteryTooltip = (mastery: number, uniqueCount: number) => {
    const label = getMasteryLabel(mastery, uniqueCount)
    let range = ''
    let meaning = ''

    if (uniqueCount === 0) {
      return 'Not Tested\n\nNo questions answered yet'
    } else if (uniqueCount < 3) {
      return `${Math.round(mastery)}% Mastery\n\n⚠️ Insufficient Data (${uniqueCount}/3 questions)\n\nNeed ${3 - uniqueCount} more question${3 - uniqueCount === 1 ? '' : 's'} for accurate mastery assessment.\n\nCurrent score may not reflect true understanding.`
    } else if (uniqueCount >= 5 && mastery >= 80) {
      range = '5+ questions, 80%+'
      meaning = 'Excellent mastery, ready for advanced topics'
    } else if (mastery >= 80) {
      range = '80%+'
      meaning = 'Ready to advance to next level'
    } else if (mastery >= 60) {
      range = '60-79%'
      meaning = 'Good progress, keep practicing'
    } else if (mastery >= 40) {
      range = '40-59%'
      meaning = 'Building understanding'
    } else {
      range = '<40%'
      meaning = 'Review fundamentals and practice more'
    }

    return `${Math.round(mastery)}% Mastery (${label})

${uniqueCount} unique question${uniqueCount === 1 ? '' : 's'} answered
Range: ${range}
${meaning}

Mastery calculated using EMA (recent performance weighted higher)`
  }

  const getBloomLevelTooltip = (level: number) => {
    const levels: Record<number, { name: string, description: string }> = {
      1: { name: 'Remember', description: 'Recalling facts and basic concepts' },
      2: { name: 'Understand', description: 'Explaining ideas or concepts' },
      3: { name: 'Apply', description: 'Using information in new situations' },
      4: { name: 'Analyze', description: 'Drawing connections and finding patterns' },
      5: { name: 'Evaluate', description: 'Justifying decisions and making judgments' },
      6: { name: 'Create', description: 'Producing new or original work' }
    }
    const info = levels[level] || { name: 'Unknown', description: 'Unknown level' }
    return `Level ${level}: ${info.name}\n${info.description}`
  }

  const getConfidenceTooltip = (confidence: number) => {
    const meanings: Record<number, string> = {
      1: 'Not confident - You were very unsure about your answer',
      2: 'Slightly confident - You had some doubts about your answer',
      3: 'Moderately confident - You felt somewhat sure about your answer',
      4: 'Confident - You felt quite sure about your answer',
      5: 'Very confident - You were certain about your answer'
    }
    return `Confidence ${confidence}/5: ${meanings[confidence] || 'Unknown confidence level'}`
  }

  const getScoreTooltip = (score: number) => {
    let interpretation = ''
    if (score >= 15) {
      interpretation = 'Excellent! Strong learning with good confidence calibration'
    } else if (score >= 10) {
      interpretation = 'Very good learning progress'
    } else if (score >= 5) {
      interpretation = 'Good progress, keep going'
    } else if (score >= 0) {
      interpretation = 'Positive progress'
    } else if (score >= -5) {
      interpretation = 'Room for improvement in accuracy or confidence calibration'
    } else {
      interpretation = 'Consider reviewing the material'
    }
    return `Score ${score >= 0 ? '+' : ''}${score.toFixed(1)}: ${interpretation}\n\nBased on correctness, confidence calibration, timing, and retention`
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
            <h2 className="text-xl font-semibold text-gray-200">
              Overall Statistics
            </h2>
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

        {/* Exam Score Prediction - Collapsible */}
        {examPrediction && (
          <div className="neuro-card mb-6">
            <button
              onClick={() => setExamPredictionExpanded(!examPredictionExpanded)}
              className="w-full flex items-center justify-between p-2 -m-2 hover:bg-gray-800/20 rounded-lg transition-colors"
            >
              <h2 className="text-xl font-semibold text-gray-200">
                CompTIA Security+ Exam Prediction
              </h2>
              <ChevronDownIcon
                size={24}
                className={`text-gray-400 transition-transform ${examPredictionExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {examPredictionExpanded && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                {/* Predicted Score */}
                <div className="neuro-raised rounded-2xl p-8 mb-6 text-center">
                  <div className="text-sm text-gray-400 mb-2">Your Predicted Exam Score</div>
                  <div className={`text-6xl font-bold mb-3 ${examPrediction.predictedScore >= 750 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {examPrediction.predictedScore}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    95% CI: {examPrediction.confidenceLower} - {examPrediction.confidenceUpper}
                  </div>
                  <div className="text-xs text-gray-600 mb-4">
                    Scale: 100-900 | Passing: 750
                  </div>
                  <div className={`text-sm font-medium ${examPrediction.predictedScore >= 750 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {examPrediction.interpretation}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <Tooltip content={`Probability you will score 750 or higher on the exam. Based on ${examPrediction.responsesCount} responses.`}>
                    <div className="neuro-stat group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-green-400 font-medium">Pass Probability</div>
                        <CheckIcon size={20} className="text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className={`text-4xl font-bold group-hover:text-green-400 transition-colors ${
                        examPrediction.passProbability >= 0.9 ? 'text-green-500' :
                        examPrediction.passProbability >= 0.7 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {Math.round(examPrediction.passProbability * 100)}%
                      </div>
                    </div>
                  </Tooltip>

                  <Tooltip content="How confident we are in this prediction. Higher is better. Increases with more questions answered.">
                    <div className="neuro-stat group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-purple-400 font-medium">Reliability</div>
                        <TargetIcon size={20} className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-4xl font-bold text-gray-200 group-hover:text-purple-400 transition-colors">
                        {Math.round(examPrediction.reliability * 100)}%
                      </div>
                    </div>
                  </Tooltip>

                  <Tooltip content={`Your ability (θ) on the IRT scale. Average = 0, Higher = Better. Standard Error: ±${examPrediction.standardError.toFixed(2)}`}>
                    <div className="neuro-stat group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-blue-400 font-medium">Ability (θ)</div>
                        <TrendingUpIcon size={20} className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                        {examPrediction.theta >= 0 ? '+' : ''}{examPrediction.theta.toFixed(2)}
                      </div>
                    </div>
                  </Tooltip>
                </div>

                {/* Data Quality Warning */}
                {examPrediction.responsesCount < 50 && (
                  <div className="neuro-inset rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangleIcon size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-400">
                      <span className="font-semibold text-yellow-500">Limited Data</span>
                      <br />
                      You've answered {examPrediction.responsesCount} questions. Predictions become more accurate with 50+ questions across all topics.
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div className="mt-6 text-xs text-gray-500 neuro-inset rounded-lg p-4">
                  <div className="font-semibold text-gray-400 mb-2">How This Works:</div>
                  <div className="space-y-1">
                    <div>• <strong>Item Response Theory (IRT)</strong>: Statistical model that estimates your ability (θ) from response patterns</div>
                    <div>• <strong>Predicted Score</strong>: Your θ mapped to CompTIA's 100-900 scale using percentile transformation</div>
                    <div>• <strong>Confidence Interval</strong>: 95% probability your true score falls within this range</div>
                    <div>• <strong>Pass Probability</strong>: Statistical likelihood of scoring ≥750 based on current performance</div>
                    <div>• <strong>Reliability</strong>: Measurement precision based on question coverage and consistency</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mastery Heatmap - Collapsible */}
        <div className="neuro-card mb-6">
          <button
            onClick={() => setHeatmapExpanded(!heatmapExpanded)}
            className="w-full flex items-center justify-between p-2 -m-2 hover:bg-gray-800/20 rounded-lg transition-colors"
          >
            <h2 className="text-xl font-semibold text-gray-200">
              Mastery Heatmap
            </h2>
            <ChevronDownIcon
              size={24}
              className={`text-gray-400 transition-transform ${heatmapExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {heatmapExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              {/* Legend */}
              <div className="mb-6">
                <div className="flex items-center gap-4 text-sm mb-3 flex-wrap">
                  <span className="text-gray-400 font-medium">Mastery Levels:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-gray-500">Struggling (&lt;40%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span className="text-gray-500">Developing (40-59%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-gray-500">Proficient (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-gray-500">Mastered (80%+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-700"></div>
                    <span className="text-gray-500">Deep Mastery (5+, 80%+)</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-start gap-2">
                  <AlertTriangleIcon size={10} className="text-yellow-500 mt-0.5" />
                  <span>Warning triangle indicates insufficient data (&lt;3 unique questions). Scores shown but may not reflect true mastery.</span>
                </div>
              </div>

              {masteryHeatmap.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="max-h-[600px] overflow-y-auto neuro-inset rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                        <tr>
                          <th className="text-left p-4 text-gray-400 font-medium">Topic</th>
                          {bloomLevels.map(level => (
                            <th key={level.num} className="p-4 text-center text-gray-400 font-medium">
                              <div>L{level.num}</div>
                              <div className="text-xs text-gray-500">{level.name}</div>
                            </th>
                          ))}
                          <th className="p-4 text-center text-gray-400 font-medium">Avg</th>
                          <th className="p-4 text-center text-gray-400 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masteryHeatmap.map((row, idx) => {
                        // Calculate total unique questions across all Bloom levels for this topic
                        const totalUniqueCount = bloomLevels.reduce((sum, level) => {
                          const uniqueCountKey = `${row.topic}-${level.num}`
                          return sum + (uniqueQuestionCounts[uniqueCountKey] || 0)
                        }, 0)

                        return (
                        <tr key={idx} className="border-t border-gray-800 hover:bg-gray-900/30 transition-colors">
                          <td className="p-4 text-gray-200 font-medium max-w-xs">
                            <Tooltip content={row.full_name && row.full_name !== row.topic ? `${row.full_name.replace(/ > /g, '\n')}${row.description ? `\n\n${row.description}` : ''}` : (row.description || row.topic)}>
                              <Link
                                href={`/performance/${subject}/${chapter}/${encodeURIComponent(row.topic)}`}
                                className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                              >
                                <span className="truncate">{row.topic}</span>
                                <span className="opacity-0 group-hover:opacity-100 text-blue-400 text-xs">
                                  →
                                </span>
                              </Link>
                            </Tooltip>
                          </td>
                          {bloomLevels.map(level => {
                            const masteryKey = `bloom_${level.num}` as keyof typeof row
                            const mastery = row[masteryKey] as number | null
                            const hasData = mastery !== null && mastery !== undefined
                            // Default to 1 (L1 always unlocked), or use current unlock level if higher
                            const currentBloomLevel = Math.max(1, topicUnlockLevels[row.topic] || 1)
                            const isLocked = level.num > currentBloomLevel
                            const isUnlockedNoData = !isLocked && !hasData

                            // Get unique question count for this topic-bloom combination
                            const uniqueCountKey = `${row.topic}-${level.num}`
                            const uniqueCount = uniqueQuestionCounts[uniqueCountKey] || 0

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
                                  <div className="inline-flex items-center gap-1.5">
                                    <Tooltip content={getMasteryTooltip(mastery || 0, uniqueCount)}>
                                      <div className={`${getMasteryColor(mastery, uniqueCount)} font-medium text-sm`}>
                                        {Math.round(mastery || 0)}%
                                      </div>
                                    </Tooltip>
                                    {uniqueCount < 3 && (
                                      <Tooltip content={`⚠️ Insufficient Data\n\nOnly ${uniqueCount} unique question${uniqueCount === 1 ? '' : 's'} at this level.\n\nNeed ${3 - uniqueCount} more for reliable assessment.`}>
                                        <AlertTriangleIcon size={10} className="text-yellow-500" />
                                      </Tooltip>
                                    )}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          <td className="p-4 text-center">
                            {row.avg_mastery !== null && row.avg_mastery !== undefined ? (
                              <div className="inline-flex items-center gap-1.5">
                                <Tooltip content={`${row.topic} - Average Mastery\n\nAverage EMA Score: ${Math.round(row.avg_mastery)}%\n\nTotal Unique Questions: ${totalUniqueCount}`}>
                                  <div className={`${getMasteryColor(row.avg_mastery, totalUniqueCount)} font-medium`}>
                                    {Math.round(row.avg_mastery)}%
                                  </div>
                                </Tooltip>
                                {totalUniqueCount < 3 && (
                                  <Tooltip content={`⚠️ Insufficient Data\n\nOnly ${totalUniqueCount} total unique question${totalUniqueCount === 1 ? '' : 's'} across all Bloom levels.\n\nNeed ${3 - totalUniqueCount} more for reliable assessment.`}>
                                    <AlertTriangleIcon size={10} className="text-yellow-500" />
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-600">--</div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Tooltip content={`Reset all progress for ${row.topic}`}>
                              <button
                                onClick={() => handleShowTopicResetModal(row.topic, row.topic_id)}
                                disabled={resettingTopic}
                                className="neuro-btn text-xs px-2 py-1 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <TrashIcon size={14} />
                              </button>
                            </Tooltip>
                          </td>
                        </tr>
                        )
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="neuro-inset p-8 rounded-lg text-center">
                  <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChartIcon size={40} className="text-gray-600" />
                  </div>
                  <div className="text-gray-400 text-lg mb-2 font-semibold">No mastery data yet</div>
                  <div className="text-sm text-gray-600">Start learning to see your progress!</div>
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
            <h2 className="text-xl font-semibold text-gray-200">
              Recent Activity
            </h2>
            <ChevronDownIcon
              size={24}
              className={`text-gray-400 transition-transform ${activityExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {activityExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              {recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {recentActivity.slice(0, 10).map((response: any) => {
                    const topicName = response.topics?.name || 'Unknown Topic'

                    return (
                      <div
                        key={response.id}
                        className="neuro-inset p-6 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              response.is_correct ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                              {response.is_correct ? (
                                <CheckIcon size={20} className="text-green-400" />
                              ) : (
                                <XIcon size={20} className="text-red-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-200 mb-1">{topicName}</div>
                              <div className="text-sm text-gray-500">
                                {response.is_correct ? 'Correct answer' : 'Incorrect answer'}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(response.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          {response.bloom_level && (
                            <Tooltip content={getBloomLevelTooltip(response.bloom_level)}>
                              <span className="neuro-raised px-2 py-1 rounded text-blue-400">
                                Level {response.bloom_level}
                              </span>
                            </Tooltip>
                          )}
                          {response.confidence !== null && response.confidence !== undefined && (
                            <Tooltip content={getConfidenceTooltip(response.confidence)}>
                              <span className="text-gray-500">
                                Confidence: {response.confidence}/5
                              </span>
                            </Tooltip>
                          )}
                          {response.reward !== null && response.reward !== undefined && (
                            <Tooltip content={getScoreTooltip(response.reward)}>
                              <span className={`font-medium ${
                                response.reward >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                Score: {response.reward >= 0 ? '+' : ''}{response.reward.toFixed(1)}
                              </span>
                            </Tooltip>
                          )}
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
                  <div className="text-sm text-gray-600">Answer some questions to see your history!</div>
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
              onClick={handleShowConfirmModal}
              disabled={resetting}
              className="neuro-btn text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 hover:text-red-300 px-6 py-3 whitespace-nowrap"
            >
              <RefreshIcon size={16} className={resetting ? 'animate-spin' : ''} />
              {resetting ? 'Resetting...' : 'Reset Progress'}
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Reset Progress?"
        type="warning"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowConfirmModal(false),
            variant: 'secondary'
          },
          {
            label: resetting ? 'Resetting...' : 'Reset Progress',
            onClick: handleResetProgress,
            variant: 'danger'
          }
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This will permanently delete all progress for this chapter:
          </p>

          {loadingCounts ? (
            <div className="neuro-inset p-6 rounded-lg text-center">
              <RefreshIcon size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Calculating items to delete...</p>
            </div>
          ) : preResetCounts ? (
            <div className="neuro-inset p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Responses:</span>
                  <span className="text-red-400 font-medium">{preResetCounts.responses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sessions:</span>
                  <span className="text-red-400 font-medium">{preResetCounts.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mastery Records:</span>
                  <span className="text-red-400 font-medium">{preResetCounts.mastery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Arm Stats:</span>
                  <span className="text-red-400 font-medium">{preResetCounts.armStats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dimension Coverage:</span>
                  <span className="text-red-400 font-medium">{preResetCounts.dimensionCoverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Generated Questions:</span>
                  <span className="text-red-400 font-medium">{preResetCounts.questions}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="neuro-inset p-4 rounded-lg">
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>All mastery scores</li>
                <li>Learning history and responses</li>
                <li>Thompson Sampling statistics</li>
                <li>Session data</li>
                <li>Dimension coverage records</li>
                <li>Generated questions</li>
              </ul>
            </div>
          )}

          <p className="text-red-400 font-semibold">
            This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Progress Reset Complete"
        type="success"
        actions={[
          {
            label: 'Close',
            onClick: handleSuccessModalClose,
            variant: 'primary'
          }
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-center">
            Your progress has been successfully reset.
          </p>
          {resetResults && (
            <div className="neuro-inset p-4 rounded-lg space-y-2">
              <div className="text-sm font-medium text-gray-400 mb-3">Deleted Items:</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Responses:</span>
                  <span className="text-blue-400 font-medium">{resetResults.responses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sessions:</span>
                  <span className="text-blue-400 font-medium">{resetResults.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mastery Records:</span>
                  <span className="text-blue-400 font-medium">{resetResults.mastery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Arm Stats:</span>
                  <span className="text-blue-400 font-medium">{resetResults.armStats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dimension Coverage:</span>
                  <span className="text-blue-400 font-medium">{resetResults.dimensionCoverage || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Generated Questions:</span>
                  <span className="text-blue-400 font-medium">{resetResults.questions || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Topic Reset Confirmation Modal */}
      <Modal
        isOpen={showTopicResetModal}
        onClose={() => {
          setShowTopicResetModal(false)
          setResetTopicData(null)
        }}
        title={`Reset ${resetTopicData?.topic || 'Topic'}?`}
        type="warning"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setShowTopicResetModal(false)
              setResetTopicData(null)
            },
            variant: 'secondary'
          },
          {
            label: resettingTopic ? 'Resetting...' : 'Reset Topic',
            onClick: handleResetTopic,
            variant: 'danger'
          }
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This will permanently delete all progress data for <strong>{resetTopicData?.topic}</strong> across all Bloom levels.
          </p>
          <div className="neuro-inset p-4 rounded-lg">
            <div className="text-sm text-gray-400 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>All question responses for this topic</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Mastery scores for all Bloom levels</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>RL learning statistics for this topic</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Dimension coverage records</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Learning sessions for this topic</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>AI-generated questions for this topic</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>This action cannot be undone</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
