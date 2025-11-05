'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PerformancePage() {
  const router = useRouter()
  const params = useParams()
  const chapterId = params.chapterId as string

  const [loading, setLoading] = useState(true)
  const [chapter, setChapter] = useState<any>(null)
  const [masteryHeatmap, setMasteryHeatmap] = useState<any[]>([])
  const [progressSummary, setProgressSummary] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [resetting, setResetting] = useState(false)

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
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('id, name, subject_id, subjects(name)')
        .eq('id', chapterId)
        .single()

      setChapter(chapterData)

      // Get mastery heatmap
      const { data: heatmapData } = await supabase
        .from('user_mastery_heatmap')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)

      setMasteryHeatmap(heatmapData || [])

      // Get progress summary
      const { data: summaryData } = await supabase
        .from('user_progress_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .single()

      setProgressSummary(summaryData)

      // Get recent responses
      const { data: responsesData } = await supabase
        .from('user_responses')
        .select(`
          *,
          questions(question_text, bloom_level, topic, primary_topic)
        `)
        .eq('user_id', user.id)
        .order('answered_at', { ascending: false })
        .limit(20)

      // Filter to this chapter's questions
      const chapterResponses = responsesData?.filter((r: any) => {
        // We need to check if the question belongs to this chapter
        // For now, we'll show all - ideally we'd join through sessions
        return true
      }) || []

      setRecentActivity(chapterResponses)

      setLoading(false)

    } catch (error) {
      console.error('Error loading performance data:', error)
      setLoading(false)
    }
  }

  const handleResetProgress = async () => {
    if (!confirm('⚠️ Reset all progress for this chapter?\n\nThis will permanently delete:\n• All mastery scores\n• Learning history\n• RL statistics\n• Session data\n\nThis action cannot be undone.')) {
      return
    }

    try {
      setResetting(true)

      const response = await fetch('/api/rl/reset-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter_id: chapterId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset progress')
      }

      alert('✅ Progress reset successfully!')

      // Force full page reload to clear all cached data
      window.location.reload()
    } catch (error: any) {
      console.error('Error resetting progress:', error)
      alert(`❌ Error: ${error.message}`)
      setResetting(false)
    }
  }

  const getMasteryColor = (mastery: number | null) => {
    if (mastery === null || mastery === undefined) return 'bg-gray-800'
    if (mastery >= 80) return 'bg-green-500'
    if (mastery >= 60) return 'bg-blue-500'
    if (mastery >= 40) return 'bg-yellow-500'
    if (mastery >= 20) return 'bg-orange-500'
    return 'bg-red-500'
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
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/subjects/${chapter?.subject_id}`} className="neuro-btn">
              ← Back
            </Link>
            <div>
              <div className="text-sm text-gray-500">{chapter?.subjects?.name}</div>
              <h1 className="text-2xl font-bold text-gray-200">
                {chapter?.name} - Performance
              </h1>
            </div>
          </div>
          <button
            onClick={handleResetProgress}
            disabled={resetting}
            className="neuro-btn text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            {resetting ? 'Resetting...' : '🔄 Reset Progress'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="neuro-stat group">
            <div className="text-sm text-blue-400 font-medium mb-2">
              Topics Started
            </div>
            <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
              {progressSummary?.topics_started || 0}
            </div>
          </div>
          <div className="neuro-stat group">
            <div className="text-sm text-green-400 font-medium mb-2">
              Topics Mastered
            </div>
            <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
              {progressSummary?.topics_mastered || 0}
            </div>
          </div>
          <div className="neuro-stat group">
            <div className="text-sm text-purple-400 font-medium mb-2">
              Questions Answered
            </div>
            <div className="text-4xl font-bold text-gray-200 group-hover:text-purple-400 transition-colors">
              {progressSummary?.total_questions_attempted || 0}
            </div>
          </div>
          <div className="neuro-stat group">
            <div className="text-sm text-yellow-400 font-medium mb-2">
              Overall Accuracy
            </div>
            <div className="text-4xl font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">
              {progressSummary?.overall_accuracy ? Math.round(progressSummary.overall_accuracy) : 0}%
            </div>
          </div>
        </div>

        {/* Mastery Heatmap */}
        <div className="neuro-card mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-200">
              Mastery Heatmap
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Mastery:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-800"></div>
                <span className="text-gray-600">0%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-gray-600">20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-gray-600">40%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-gray-600">60%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-gray-600">80%+</span>
              </div>
            </div>
          </div>

          {masteryHeatmap.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-gray-400 font-medium">Topic</th>
                    {bloomLevels.map(level => (
                      <th key={level.num} className="p-3 text-center text-gray-400 font-medium">
                        <div>L{level.num}</div>
                        <div className="text-xs text-gray-600">{level.name}</div>
                      </th>
                    ))}
                    <th className="p-3 text-center text-gray-400 font-medium">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {masteryHeatmap.map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-800">
                      <td className="p-3 text-gray-300 font-medium max-w-xs truncate">
                        {row.topic}
                      </td>
                      {bloomLevels.map(level => {
                        const masteryKey = `bloom_${level.num}` as keyof typeof row
                        const mastery = row[masteryKey] as number | null
                        return (
                          <td key={level.num} className="p-3">
                            <div
                              className={`w-full h-12 rounded ${getMasteryColor(mastery)} flex items-center justify-center text-white font-medium text-xs transition-all hover:scale-105 cursor-help`}
                              title={`${row.topic} - Level ${level.num}: ${mastery !== null && mastery !== undefined ? Math.round(mastery) : 0}% (${getMasteryLabel(mastery)})`}
                            >
                              {mastery !== null && mastery !== undefined ? Math.round(mastery) : '-'}
                            </div>
                          </td>
                        )
                      })}
                      <td className="p-3 text-center">
                        <div className="text-gray-300 font-medium">
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
              <div className="text-gray-500 mb-2">No mastery data yet</div>
              <div className="text-sm text-gray-600">Start learning to see your progress!</div>
              <Link
                href={`/learn/${chapterId}`}
                className="neuro-btn-primary inline-block mt-4"
              >
                Start Learning
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="neuro-card">
          <h2 className="text-xl font-semibold text-gray-200 mb-6">
            Recent Activity
          </h2>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((response: any) => (
                <div
                  key={response.id}
                  className="neuro-inset p-4 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      response.is_correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {response.is_correct ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-300 mb-1 line-clamp-2">
                        {response.questions?.question_text || 'Question'}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="neuro-raised px-2 py-1 rounded text-purple-400">
                          Bloom L{response.questions?.bloom_level}
                        </span>
                        {response.questions?.primary_topic || response.questions?.topic ? (
                          <span className="neuro-raised px-2 py-1 rounded text-blue-400 truncate max-w-xs">
                            {response.questions.primary_topic || response.questions.topic}
                          </span>
                        ) : null}
                        {response.confidence_level && (
                          <span className="text-gray-500">
                            Confidence: {response.confidence_level}/5
                          </span>
                        )}
                        {response.recognition_method && (
                          <span className="text-gray-500">
                            {response.recognition_method === 'memory' && '🧠 Memory'}
                            {response.recognition_method === 'recognition' && '👀 Recognition'}
                            {response.recognition_method === 'educated_guess' && '🎯 Educated Guess'}
                            {response.recognition_method === 'random' && '🎲 Random'}
                          </span>
                        )}
                        {response.reward_received !== null && (
                          <span className={`font-medium ${
                            response.reward_received >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            Reward: {response.reward_received >= 0 ? '+' : ''}{response.reward_received?.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-600">
                      {new Date(response.answered_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="neuro-inset p-8 rounded-lg text-center">
              <div className="text-gray-500 mb-2">No activity yet</div>
              <div className="text-sm text-gray-600">Answer some questions to see your history!</div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
