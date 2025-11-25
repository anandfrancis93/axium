'use client'

import { useState, useEffect } from 'react'
import { ShieldIcon, SearchIcon, TrashIcon } from '@/components/icons'
import Image from 'next/image'
import HamburgerMenu from '@/components/HamburgerMenu'
import Modal from '@/components/Modal'
import { createClient } from '@/lib/supabase/client'


interface TopicProgress {
  topic_id: string
  topic_name: string
  total_attempts: number
  correct_answers: number
  mastery_scores: Record<string, number>
  last_practiced_at: string
  calibration_mean: number | null
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

  const [showProgress, setShowProgress] = useState(false)
  const [showSpacedRepetition, setShowSpacedRepetition] = useState(false)

  useEffect(() => {
    if (showProgress || showSpacedRepetition) {
      fetchTopicsProgress()
    }
  }, [showProgress, showSpacedRepetition])

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
          calibration_mean: item.calibration_mean,
        })) || []

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

      // Show clean message with stats
      let message = ''
      if (result.deletedCount === 0) {
        message = 'No data to reset. You haven\'t started learning yet.'
      } else {
        const stats = []
        if (result.progressRecords > 0) stats.push(`${result.progressRecords} topic${result.progressRecords > 1 ? 's' : ''}`)
        if (result.responseRecords > 0) stats.push(`${result.responseRecords} answer${result.responseRecords > 1 ? 's' : ''}`)
        if (result.reviewRecords > 0) stats.push(`${result.reviewRecords} review${result.reviewRecords > 1 ? 's' : ''}`)
        if (result.questionsRecords > 0) stats.push(`${result.questionsRecords} question${result.questionsRecords > 1 ? 's' : ''}`)

        message = `Your progress has been reset.\n\nCleared: ${stats.join(', ')}`
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

  // Calculate when a topic is due for review based on calibration score
  const calculateDueIn = (lastPracticedAt: string, calibrationScore: number) => {
    const lastPracticed = new Date(lastPracticedAt)
    const now = new Date()

    // Determine interval based on calibration score
    // -1.5 to -1.0: Critical (4 hours)
    // -1.0 to -0.5: High (12 hours)
    // -0.5 to 0.0:  Medium (1 day)
    //  0.0 to 0.5:  Medium-Low (2 days)
    //  0.5 to 1.0:  Low (4 days)
    //  1.0+:        Very Low (7 days)
    let intervalHours = 168 // Default: 7 days

    if (calibrationScore <= -1.0) {
      intervalHours = 4
    } else if (calibrationScore <= -0.5) {
      intervalHours = 12
    } else if (calibrationScore <= 0.0) {
      intervalHours = 24
    } else if (calibrationScore <= 0.5) {
      intervalHours = 48
    } else if (calibrationScore <= 1.0) {
      intervalHours = 96
    }

    // Calculate due date
    const dueDate = new Date(lastPracticed.getTime() + intervalHours * 60 * 60 * 1000)
    const timeUntilDue = dueDate.getTime() - now.getTime()

    // Convert to hours/days
    const hoursUntilDue = timeUntilDue / (1000 * 60 * 60)
    const daysUntilDue = hoursUntilDue / 24

    // Format the output
    if (hoursUntilDue <= 0) {
      // Overdue
      const hoursOverdue = Math.abs(hoursUntilDue)
      if (hoursOverdue < 1) {
        return { text: 'Due now', color: 'text-red-400' }
      } else if (hoursOverdue < 24) {
        const hours = Math.floor(hoursOverdue)
        return { text: `Overdue ${hours}h`, color: 'text-red-400' }
      } else {
        const days = Math.floor(hoursOverdue / 24)
        return { text: `Overdue ${days}d`, color: 'text-red-400' }
      }
    } else {
      // Not yet due
      if (hoursUntilDue < 1) {
        const minutes = Math.floor(hoursUntilDue * 60)
        return { text: `Due in ${minutes}m`, color: 'text-yellow-400' }
      } else if (hoursUntilDue < 24) {
        const hours = Math.floor(hoursUntilDue)
        return { text: `Due in ${hours}h`, color: 'text-yellow-400' }
      } else {
        const days = Math.floor(daysUntilDue)
        return { text: `Due in ${days}d`, color: 'text-green-400' }
      }
    }
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
        <div className="neuro-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-1">Ready to Practice?</h2>
              <p className="text-sm text-gray-500">AI will select the best topic for you based on your learning progress</p>
            </div>
            <button
              onClick={() => {
                // Set authorization flag for quiz access
                sessionStorage.setItem('quiz_authorized', 'true')
                window.location.href = '/subjects/it-cs/cybersecurity/learn'
              }}
              className="neuro-btn text-blue-400 px-6 py-3 font-semibold"
            >
              Start Quiz →
            </button>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowProgress(!showProgress)
              if (showSpacedRepetition) setShowSpacedRepetition(false)
            }}
            className={`neuro-btn px-6 py-2 font-semibold hover:bg-blue-500/10 hover:translate-y-0 transition-colors ${showProgress ? 'text-blue-400 bg-blue-500/20' : 'text-blue-400'
              }`}
          >
            My Progress
          </button>
          <button
            onClick={() => {
              setShowSpacedRepetition(!showSpacedRepetition)
              if (showProgress) setShowProgress(false)
            }}
            className={`neuro-btn px-6 py-2 font-semibold hover:bg-blue-500/10 hover:translate-y-0 transition-colors ${showSpacedRepetition ? 'text-blue-400 bg-blue-500/20' : 'text-blue-400'
              }`}
          >
            Spaced Repetition
          </button>
        </div>

        {/* Topics Progress */}
        {showProgress && (
          <div className="neuro-card overflow-hidden">
            <div className="p-6 border-b border-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-gray-200">Your Progress</h3>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-grow md:w-64">
                  <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="neuro-input w-full pl-10 py-2 text-sm"
                  />
                </div>

                {topicsProgress.length > 0 && (
                  <button
                    onClick={resetProgress}
                    disabled={resetting}
                    className="neuro-btn text-red-400 p-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Reset Progress"
                  >
                    <TrashIcon size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center">
                <div className="text-gray-400">Loading your progress...</div>
              </div>
            )}

            {/* Empty State */}
            {!loading && topicsProgress.length === 0 && (
              <div className="p-8 text-center">
                <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldIcon size={40} className="text-gray-600" />
                </div>
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No topics attempted yet
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Start your first quiz to see your progress here
                </div>
              </div>
            )}

            {/* Topics Table */}
            {!loading && filteredTopics.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Topic</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-400">Attempts</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-400">Correct</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-400">Calibration</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-400">Mastery</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-400">Last Practiced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.map((topic) => {
                      const accuracy = topic.total_attempts > 0
                        ? Math.round((topic.correct_answers / topic.total_attempts) * 100)
                        : 0
                      const overallMastery = calculateOverallMastery(topic.mastery_scores)

                      return (
                        <tr
                          key={topic.topic_id}
                          className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="p-4">
                            <a
                              href={`/subjects/it-cs/cybersecurity/${encodeURIComponent(topic.topic_name)}`}
                              className="font-medium text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                            >
                              {topic.topic_name}
                            </a>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-gray-300">{topic.total_attempts}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-gray-300">
                              {topic.correct_answers}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className={`text-lg font-bold ${(topic.calibration_mean ?? 0) >= 1.0 ? 'text-green-400' :
                                (topic.calibration_mean ?? 0) >= 0.5 ? 'text-yellow-400' :
                                  (topic.calibration_mean ?? 0) >= 0.0 ? 'text-yellow-400' :
                                    (topic.calibration_mean ?? 0) >= -0.5 ? 'text-yellow-400' :
                                      'text-red-400'
                              }`}>
                              {(topic.calibration_mean ?? 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className={`text-lg font-bold ${overallMastery >= 80 ? 'text-green-400' :
                                overallMastery >= 60 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                {overallMastery}%
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-sm text-gray-500">
                              {formatDateTime(topic.last_practiced_at)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-700 bg-gray-800/30">
                      <td className="p-4">
                        <div className="font-semibold text-gray-200">
                          Total ({filteredTopics.length} {filteredTopics.length === 1 ? 'topic' : 'topics'})
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-200">
                          {filteredTopics.reduce((sum, topic) => sum + topic.total_attempts, 0)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-200">
                          {filteredTopics.reduce((sum, topic) => sum + topic.correct_answers, 0)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {(() => {
                          const avgCalibration = filteredTopics.reduce((sum, topic) => sum + (topic.calibration_mean ?? 0), 0) / filteredTopics.length
                          return (
                            <div className={`text-lg font-bold ${avgCalibration >= 1.0 ? 'text-green-400' :
                                avgCalibration >= 0.5 ? 'text-yellow-400' :
                                  avgCalibration >= 0.0 ? 'text-yellow-400' :
                                    avgCalibration >= -0.5 ? 'text-yellow-400' :
                                      'text-red-400'
                              }`}>
                              {avgCalibration.toFixed(2)}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="p-4 text-center">
                        {(() => {
                          const avgMastery = Math.round(
                            filteredTopics.reduce((sum, topic) => sum + calculateOverallMastery(topic.mastery_scores), 0) /
                            filteredTopics.length
                          )
                          return (
                            <div className={`text-lg font-bold ${avgMastery >= 80 ? 'text-green-400' :
                              avgMastery >= 60 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                              {avgMastery}%
                            </div>
                          )
                        })()}
                      </td>
                      <td className="p-4 text-right">
                        {/* Empty - no date for summary row */}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* No Search Results */}
            {!loading && topicsProgress.length > 0 && filteredTopics.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No topics found
                </div>
                <div className="text-sm text-gray-600">
                  Try a different search term
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spaced Repetition Section */}
        {showSpacedRepetition && (
          <div className="neuro-card overflow-hidden">
            <div className="p-6 border-b border-gray-800/50">
              <h3 className="text-xl font-semibold text-gray-200">Topics Due for Review</h3>
              <p className="text-sm text-gray-500 mt-1">Practice these topics to maintain and improve your mastery</p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center">
                <div className="text-gray-400">Loading spaced repetition topics...</div>
              </div>
            )}

            {/* Empty State */}
            {!loading && topicsProgress.length === 0 && (
              <div className="p-8 text-center">
                <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldIcon size={40} className="text-gray-600" />
                </div>
                <div className="text-gray-400 text-lg font-semibold mb-2">
                  No topics to review yet
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Start practicing to build your spaced repetition queue
                </div>
              </div>
            )}

            {/* Topics Due for Review */}
            {!loading && topicsProgress.length > 0 && (() => {
              // Sort all topics by calibration score (lowest/worst first = highest priority)
              const sortedTopics = [...topicsProgress].sort((a, b) => {
                const scoreA = a.calibration_mean ?? 0
                const scoreB = b.calibration_mean ?? 0
                return scoreA - scoreB // Lowest scores first
              })

              return sortedTopics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Topic</th>
                        <th className="text-center p-4 text-sm font-semibold text-gray-400">Calibration</th>
                        <th className="text-center p-4 text-sm font-semibold text-gray-400">Mastery</th>
                        <th className="text-center p-4 text-sm font-semibold text-gray-400">Last Practiced</th>
                        <th className="text-center p-4 text-sm font-semibold text-gray-400">Due In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTopics.map((topic) => {
                        const overallMastery = calculateOverallMastery(topic.mastery_scores)
                        const calibrationScore = topic.calibration_mean ?? 0

                        // Calculate when topic is due for review
                        const dueInfo = calculateDueIn(topic.last_practiced_at, calibrationScore)

                        return (
                          <tr
                            key={topic.topic_id}
                            className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="p-4">
                              <a
                                href={`/subjects/it-cs/cybersecurity/${encodeURIComponent(topic.topic_name)}`}
                                className="font-medium text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                              >
                                {topic.topic_name}
                              </a>
                            </td>
                            <td className="p-4 text-center">
                              <div className={`text-lg font-bold ${calibrationScore >= 1.0 ? 'text-green-400' :
                                calibrationScore >= 0.5 ? 'text-yellow-400' :
                                  calibrationScore >= 0.0 ? 'text-yellow-400' :
                                    calibrationScore >= -0.5 ? 'text-yellow-400' :
                                      'text-red-400'
                                }`}>
                                {calibrationScore.toFixed(2)}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className={`text-lg font-bold ${overallMastery >= 80 ? 'text-green-400' :
                                overallMastery >= 60 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                {overallMastery}%
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-sm text-gray-500">
                                {formatDateTime(topic.last_practiced_at)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`font-semibold ${dueInfo.color}`}>
                                {dueInfo.text}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-lg font-semibold mb-2">
                    All caught up! 🎉
                  </div>
                  <div className="text-sm text-gray-600">
                    No topics are due for review right now. Check back later!
                  </div>
                </div>
              )
            })()}
          </div>
        )}
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
