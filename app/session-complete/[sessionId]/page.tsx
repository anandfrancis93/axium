import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, BarChart3, Home } from 'lucide-react'

export default async function SessionCompletePage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get session details
  const { data: session, error: sessionError } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      chapters (
        name,
        subject_id,
        subjects (
          name
        )
      )
    `)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    redirect('/dashboard')
  }

  const percentage = session.total_questions > 0
    ? Math.round((session.score / session.total_questions) * 100)
    : 0

  const chapterName = session.chapters?.name || 'Unknown Chapter'
  const subjectName = session.chapters?.subjects?.name || 'Unknown Subject'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Card */}
        <div className="neuro-card text-center mb-8">
          <div className="neuro-inset w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-400" />
          </div>

          <h1 className="text-4xl font-bold text-gray-200 mb-3">
            Session Complete!
          </h1>

          <p className="text-gray-400 text-lg mb-8">
            {subjectName} • {chapterName}
          </p>

          {/* Score Display */}
          <div className="neuro-raised rounded-2xl p-8 mb-8 max-w-md mx-auto">
            <div className="text-6xl font-bold text-blue-400 mb-2">
              {percentage}%
            </div>
            <div className="text-gray-400 text-sm mb-4">
              {session.score} out of {session.total_questions} correct
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Performance Message */}
          <div className="mb-8">
            {percentage >= 80 && (
              <div className="text-green-400 text-lg font-semibold">
                Excellent work! You're mastering this material.
              </div>
            )}
            {percentage >= 60 && percentage < 80 && (
              <div className="text-blue-400 text-lg font-semibold">
                Good progress! Keep practicing to strengthen your understanding.
              </div>
            )}
            {percentage >= 40 && percentage < 60 && (
              <div className="text-yellow-400 text-lg font-semibold">
                You're developing your skills. Review the material and try again.
              </div>
            )}
            {percentage < 40 && (
              <div className="text-orange-400 text-lg font-semibold">
                Keep learning! Review the concepts and practice more.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/performance/${encodeURIComponent(subjectName)}/${encodeURIComponent(chapterName)}`}
              className="neuro-btn text-blue-400 inline-flex items-center justify-center gap-2 px-6 py-3"
            >
              <BarChart3 size={20} />
              <span>View Performance</span>
            </Link>

            <Link
              href={`/subjects/${encodeURIComponent(subjectName)}/${encodeURIComponent(chapterName)}/quiz`}
              className="neuro-btn text-green-400 inline-flex items-center justify-center gap-2 px-6 py-3"
            >
              <ArrowRight size={20} />
              <span>Practice More</span>
            </Link>

            <Link
              href="/dashboard"
              className="neuro-btn text-gray-300 inline-flex items-center justify-center gap-2 px-6 py-3"
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="neuro-stat">
            <div className="text-sm text-blue-400 font-medium mb-2">
              Questions Answered
            </div>
            <div className="text-3xl font-bold text-gray-200">
              {session.questions_answered}
            </div>
          </div>

          <div className="neuro-stat">
            <div className="text-sm text-green-400 font-medium mb-2">
              Correct Answers
            </div>
            <div className="text-3xl font-bold text-gray-200">
              {session.score}
            </div>
          </div>

          <div className="neuro-stat">
            <div className="text-sm text-purple-400 font-medium mb-2">
              Accuracy
            </div>
            <div className="text-3xl font-bold text-gray-200">
              {percentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
