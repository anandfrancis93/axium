'use client'

import { useState, useEffect } from 'react'
import { ShieldIcon, SearchIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'
import { createClient } from '@/lib/supabase/client'

interface TopicProgress {
  topic_id: string
  topic_name: string
  total_attempts: number
  correct_answers: number
  mastery_scores: Record<string, number>
  last_practiced_at: string
}

export default function CybersecurityPage() {
  const [topicsProgress, setTopicsProgress] = useState<TopicProgress[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

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
          topics (
            name,
            chapters (
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

      // Filter for Cybersecurity chapter and format data
      const cybersecurityTopics = data
        ?.filter((item: any) => item.topics?.chapters?.name === 'Cybersecurity')
        .map((item: any) => ({
          topic_id: item.topic_id,
          topic_name: item.topics?.name || 'Unknown Topic',
          total_attempts: item.total_attempts,
          correct_answers: item.correct_answers,
          mastery_scores: item.mastery_scores,
          last_practiced_at: item.last_practiced_at
        })) || []

      setTopicsProgress(cybersecurityTopics)
    } catch (error) {
      console.error('Error in fetchTopicsProgress:', error)
    } finally {
      setLoading(false)
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldIcon size={24} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-red-400 truncate">
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

        {/* Topics Progress */}
        <div>
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Your Progress</h3>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="neuro-card p-8 text-center">
              <div className="text-gray-400">Loading your progress...</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && topicsProgress.length === 0 && (
            <div className="neuro-inset p-8 rounded-lg text-center">
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
            <div className="neuro-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Topic</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-400">Attempts</th>
                      <th className="text-center p-4 text-sm font-semibold text-gray-400">Correct</th>
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
                            <div className="font-medium text-gray-200">{topic.topic_name}</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-gray-300">{topic.total_attempts}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-gray-300">
                              {topic.correct_answers}
                              <span className="text-gray-600 ml-1">({accuracy}%)</span>
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className={`text-lg font-bold ${
                                overallMastery >= 80 ? 'text-green-400' :
                                overallMastery >= 60 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {overallMastery}%
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-sm text-gray-500">
                              {formatDate(topic.last_practiced_at)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Search Results */}
          {!loading && topicsProgress.length > 0 && filteredTopics.length === 0 && (
            <div className="neuro-inset p-8 rounded-lg text-center">
              <div className="text-gray-400 text-lg font-semibold mb-2">
                No topics found
              </div>
              <div className="text-sm text-gray-600">
                Try a different search term
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
