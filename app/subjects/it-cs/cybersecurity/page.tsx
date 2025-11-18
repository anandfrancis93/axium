'use client'

import { useState, useEffect } from 'react'
import { ShieldIcon, SearchIcon, TrashIcon } from '@/components/icons'
import Image from 'next/image'
import HamburgerMenu from '@/components/HamburgerMenu'
import Modal from '@/components/Modal'
import { createClient } from '@/lib/supabase/client'
import LearningCurveChart from '@/components/LearningCurveChart'

interface TopicProgress {
  topic_id: string
  topic_name: string
  total_attempts: number
  correct_answers: number
  mastery_scores: Record<string, number>
  last_practiced_at: string
  calibration_slope: number | null
  calibration_stddev: number | null
  calibration_r_squared: number | null
  calibration_mean: number | null
  recent_responses: { attempt: number; score: number; isCorrect: boolean }[]
}

export default function CybersecurityPage() {
  const [topicsProgress, setTopicsProgress] = useState<TopicProgress[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchTopicsProgress()
  }, [])

  async function fetchTopicsProgress() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user progress for Cybersecurity topics
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          topic_id,
          total_attempts,
          correct_answers,
          mastery_scores,
          last_practiced_at,
          calibration_slope,
          calibration_stddev,
          calibration_r_squared,
          calibration_mean,
          topics (
            name,
            subjects (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('last_practiced_at', { ascending: false, nullsFirst: false })

      if (error) {
        console.error('Error fetching topics progress:', error)
        return
      }

      // Filter for Cybersecurity subject and format data
      const cybersecurityTopics = data
        ?.filter((item: any) => item.topics?.subjects?.name === 'Cybersecurity')
        .map((item: any) => ({
          topic_id: item.topic_id,
          topic_name: item.topics?.name || 'Unknown Topic',
          total_attempts: item.total_attempts,
          correct_answers: item.correct_answers,
          mastery_scores: item.mastery_scores,
          last_practiced_at: item.last_practiced_at,
          calibration_slope: item.calibration_slope,
          calibration_stddev: item.calibration_stddev,
          calibration_r_squared: item.calibration_r_squared,
          calibration_mean: item.calibration_mean,
          recent_responses: [] // Will be populated below
        })) || []

      // Fetch recent responses for all these topics to build sparklines
      if (cybersecurityTopics.length > 0) {
        const topicIds = cybersecurityTopics.map((t: any) => t.topic_id)
        console.log('Fetching responses for topics:', topicIds)

        const { data: responsesData, error: responseError } = await supabase
          .from('user_responses')
          .select('topic_id, calibration_score, is_correct, created_at')
          .in('topic_id', topicIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500)

        if (responseError) {
          console.error('Error fetching responses:', responseError)
        }

        if (responsesData) {
          console.log(`Found ${responsesData.length} responses for sparklines`)
          // Group responses by topic
          const responsesByTopic: Record<string, any[]> = {}
          responsesData.forEach((r: any) => {
            if (!responsesByTopic[r.topic_id]) {
              responsesByTopic[r.topic_id] = []
            }
            // Limit to last 15 per topic for sparkline
            if (responsesByTopic[r.topic_id].length < 15) {
              responsesByTopic[r.topic_id].push(r)
            }
          })

          // Attach to topics
          cybersecurityTopics.forEach((topic: any) => {
            const rawResponses = responsesByTopic[topic.topic_id] || []
            // Reverse to chronological order for the chart
            const chronological = [...rawResponses].reverse()

            topic.recent_responses = chronological.map((r, i) => ({
              attempt: i + 1,
              score: r.calibration_score !== null ? Number(r.calibration_score) : (r.is_correct ? 1.0 : -1.0),
              isCorrect: r.is_correct
            }))
            console.log(`Topic ${topic.topic_name}: ${topic.recent_responses.length} points for graph`)
          })
        } else {
          console.log('No responses data found')
        }
      }

      setTopicsProgress(cybersecurityTopics)
    } catch (error) {
      console.error('Error in fetchTopicsProgress:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetProgress() {
    setShowResetModal(true)
  }

  async function confirmReset() {
    setShowResetModal(false)

    try {
      setResetting(true)
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErrorMessage('You must be logged in to reset progress')
        setShowErrorModal(true)
        return
      }

      // Call API to delete progress
      const response = await fetch('/api/progress/reset-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Cybersecurity' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset progress')
      }

      // Refresh the page to show empty state
      await fetchTopicsProgress()

      // Show detailed message
      const hasUserData = (result.progressRecords || 0) > 0 || (result.responseRecords || 0) > 0
      const hasQuestions = (result.questionsRecords || 0) > 0

      let message = ''
      if (result.deletedCount === 0) {
        message = 'No records found to delete. You haven\'t started any quizzes yet for Cybersecurity topics.'
      } else if (!hasUserData && hasQuestions) {
        // Only questions deleted, no user progress/responses
        message = `Deleted ${result.questionsRecords} generated question(s).\n\nNote: You generated questions but didn't answer any yet.`
      } else {
        // Has user data (and possibly questions)
        const details = [
          result.progressRecords > 0 ? `${result.progressRecords} progress record(s)` : null,
          result.responseRecords > 0 ? `${result.responseRecords} response(s)` : null,
          result.questionsRecords > 0 ? `${result.questionsRecords} generated question(s)` : null
        ].filter(Boolean).join(', ')

        message = `Successfully deleted ${details}.`
      }

      setSuccessMessage(message)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error resetting progress:', error)
      setErrorMessage('Failed to reset progress. Please try again.')
      setShowErrorModal(true)
    } finally {
      setResetting(false)
    }
  }

  // Filter topics based on search query
  const filteredTopics = topicsProgress.filter(topic =>
    topic.topic_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate overall mastery (average across all Bloom levels)
  const calculateOverallMastery = (masteryScores: Record<string, number>) => {
    const scores = Object.values(masteryScores).filter(score => score > 0)
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    // If less than 1 minute ago
    if (diffMinutes < 1) return 'Just now'

    // If less than 1 hour ago, show minutes
    if (diffMinutes < 60) {
      if (diffMinutes === 1) return '1 minute ago'
      return `${diffMinutes} minutes ago`
    }

    // If less than 24 hours ago, show hours
    if (diffHours < 24) {
      if (diffHours === 1) return '1 hour ago'
      return `${diffHours} hours ago`
    }

    // Otherwise show full date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="neuro-inset w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
              <Image src="/icon.svg" width={40} height={40} alt="Axium Logo" className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-white truncate">
              Cybersecurity
            </h1>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">

        {/* Quick Action - Start Practice */}
        <div className="neuro-card p-1 rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Level Up?</h2>
                <p className="text-gray-400 max-w-xl">
                  AI will analyze your performance and select the optimal topic to boost your cybersecurity mastery.
                </p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem('quiz_authorized', 'true')
                  window.location.href = '/subjects/it-cs/cybersecurity/learn'
                }}
                className="neuro-btn-primary px-8 py-4 font-bold text-lg flex items-center gap-2 whitespace-nowrap group"
              >
                <span>Start Adaptive Quiz</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Topics Progress */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-200">Your Progress</h3>
            {topicsProgress.length > 0 && (
              <button
                onClick={resetProgress}
                disabled={resetting}
                className="neuro-btn text-red-400 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-red-500/10"
              >
                <TrashIcon size={18} />
                <span>{resetting ? 'Resetting...' : 'Reset'}</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative group">
              <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neuro-input w-full pl-12 py-4 text-lg bg-[#151515] focus:bg-[#1a1a1a]"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="neuro-card h-48 animate-pulse"></div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && topicsProgress.length === 0 && (
            <div className="neuro-inset p-12 rounded-2xl text-center">
              <div className="neuro-inset w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldIcon size={48} className="text-gray-600" />
              </div>
              <div className="text-gray-400 text-xl font-semibold mb-2">
                No topics attempted yet
              </div>
              <div className="text-gray-600 mb-8 max-w-md mx-auto">
                Your learning journey begins with a single step. Start a quiz to begin tracking your mastery.
              </div>
            </div>
          )}

          {/* Topics Grid */}
          {!loading && filteredTopics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map((topic, index) => {
                const accuracy = topic.total_attempts > 0
                  ? Math.round((topic.correct_answers / topic.total_attempts) * 100)
                  : 0
                const overallMastery = calculateOverallMastery(topic.mastery_scores)

                // Determine mastery color
                let masteryColor = 'text-red-400'
                let masteryBg = 'bg-red-500/10'
                let masteryBorder = 'border-red-500/20'

                if (overallMastery >= 80) {
                  masteryColor = 'text-green-400'
                  masteryBg = 'bg-green-500/10'
                  masteryBorder = 'border-green-500/20'
                } else if (overallMastery >= 60) {
                  masteryColor = 'text-yellow-400'
                  masteryBg = 'bg-yellow-500/10'
                  masteryBorder = 'border-yellow-500/20'
                }

                return (
                  <a
                    key={topic.topic_id}
                    href={`/subjects/it-cs/cybersecurity/${encodeURIComponent(topic.topic_name)}`}
                    className="neuro-card p-5 group hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full animate-slide-up"
                    style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-lg text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-2 flex-1 mr-2">
                        {topic.topic_name}
                      </h4>
                      <div className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${masteryColor} ${masteryBg} ${masteryBorder}`}>
                        {overallMastery}%
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 font-medium">{topic.total_attempts}</span>
                        <span>attempts</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 font-medium">{accuracy}%</span>
                        <span>accuracy</span>
                      </div>
                    </div>

                    {/* Learning Curve */}
                    <div className="mt-auto">
                      <div className="h-16 w-full mb-3 relative">
                        {topic.recent_responses.length > 1 ? (
                          <LearningCurveChart
                            data={topic.recent_responses}
                            slope={topic.calibration_slope}
                            intercept={null}
                            stddev={topic.calibration_stddev}
                            height={64}
                            sparkline={true}
                            className="opacity-70 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-gray-700 border border-dashed border-gray-800 rounded-lg">
                            Not enough data
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Learning Curve</span>
                        <span>{formatDateTime(topic.last_practiced_at)}</span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}

          {/* No Search Results */}
          {!loading && topicsProgress.length > 0 && filteredTopics.length === 0 && (
            <div className="neuro-inset p-12 rounded-2xl text-center">
              <div className="text-gray-400 text-xl font-semibold mb-2">
                No topics found matching "{searchQuery}"
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:text-blue-300 hover:underline mt-2"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Reset Progress Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Progress"
        type="warning"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setShowResetModal(false),
            variant: 'secondary'
          },
          {
            label: 'Reset Progress',
            onClick: confirmReset,
            variant: 'danger'
          }
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This will permanently delete <strong>ALL</strong> your Cybersecurity progress:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>All quiz attempts will be deleted</li>
            <li>All mastery scores will be reset</li>
            <li>All learning history will be lost</li>
          </ul>
          <p className="text-red-400 font-semibold">
            This action cannot be undone. Are you sure you want to continue?
          </p>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Reset Complete"
        type="success"
        actions={[
          {
            label: 'OK',
            onClick: () => setShowSuccessModal(false),
            variant: 'primary'
          }
        ]}
      >
        <div className="text-gray-300 whitespace-pre-line">
          {successMessage}
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        type="warning"
        actions={[
          {
            label: 'OK',
            onClick: () => setShowErrorModal(false),
            variant: 'secondary'
          }
        ]}
      >
        <div className="text-gray-300">
          {errorMessage}
        </div>
      </Modal>
    </div>
  )
}
