import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: subjectId } = await params

  let subject: any = null
  let chapters: any[] = []
  let subjectMastery: any = null
  let user: any = null

  try {
    const supabase = await createClient()
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData

    if (!user) {
      redirect('/login')
    }

    // Get subject details
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single()

    if (subjectError || !subjectData) {
      redirect('/dashboard')
    }

    subject = subjectData

    // Get chapters for this subject
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select(`
        id,
        name,
        description,
        created_at,
        questions (count)
      `)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: true })

    chapters = chaptersData || []

    // Get user's progress summary for this subject
    const { data: masteryData } = await supabase
      .from('user_progress_summary')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    subjectMastery = masteryData

  } catch (error) {
    console.error('Error loading subject:', error)
    redirect('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="neuro-btn">
              ← Back
            </Link>
            <div className="neuro-raised px-6 py-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {subject.name}
              </h1>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {user.email?.split('@')[0]}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Subject Overview Card */}
        <div className="neuro-card mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-200 mb-2">
                {subject.name}
              </h2>
              {subject.description && (
                <p className="text-gray-400 mb-4">
                  {subject.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <div className="neuro-inset px-4 py-2 rounded-lg">
                  <span className="text-blue-400 font-medium">{chapters.length}</span>
                  <span className="text-gray-500 ml-2">Chapters</span>
                </div>
                <div className="neuro-inset px-4 py-2 rounded-lg">
                  <span className="text-green-400 font-medium">
                    {chapters.reduce((sum, ch) => sum + (ch.questions?.[0]?.count || 0), 0)}
                  </span>
                  <span className="text-gray-500 ml-2">Questions</span>
                </div>
                {subjectMastery && (
                  <div className="neuro-inset px-4 py-2 rounded-lg">
                    <span className="text-purple-400 font-medium">
                      {Math.round(subjectMastery.overall_mastery || 0)}%
                    </span>
                    <span className="text-gray-500 ml-2">Mastery</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        {chapters.length > 0 ? (
          <div className="neuro-card mb-6">
            <h3 className="text-xl font-semibold text-gray-200 mb-6">
              Chapters
            </h3>

            <div className="space-y-4">
              {chapters.map((chapter) => {
                const questionCount = chapter.questions?.[0]?.count || 0
                const hasQuestions = questionCount > 0

                return (
                  <div
                    key={chapter.id}
                    className="neuro-raised p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-200 mb-2">
                          {chapter.name}
                        </h4>
                        {chapter.description && (
                          <p className="text-sm text-gray-500 mb-3">
                            {chapter.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${hasQuestions ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                            <span className="text-gray-500">
                              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {hasQuestions ? (
                          <>
                            <Link
                              href={`/learn/${chapter.id}`}
                              className="neuro-btn-primary px-6 py-3 text-center whitespace-nowrap"
                            >
                              🎯 Start Learning
                            </Link>
                            <Link
                              href={`/performance/${chapter.id}`}
                              className="neuro-btn px-6 py-3 text-center whitespace-nowrap"
                            >
                              📊 Performance
                            </Link>
                          </>
                        ) : (
                          <Link
                            href="/admin"
                            className="neuro-btn px-6 py-3 text-center whitespace-nowrap"
                          >
                            + Add Questions
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Empty state
          <div className="neuro-card">
            <h3 className="text-xl font-semibold text-gray-200 mb-4">
              No Chapters Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create chapters for this subject to start learning.
            </p>
            <Link href="/admin" className="neuro-btn-primary inline-block">
              Go to Admin Panel
            </Link>
          </div>
        )}

        {/* How it Works */}
        <div className="neuro-card">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            How Adaptive Learning Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="neuro-inset p-4 rounded-lg">
              <div className="text-blue-400 font-medium mb-2">1. RL Selects Optimal Topic</div>
              <p className="text-sm text-gray-500">
                Thompson Sampling chooses the best (topic, Bloom level) based on your mastery and spacing
              </p>
            </div>
            <div className="neuro-inset p-4 rounded-lg">
              <div className="text-purple-400 font-medium mb-2">2. 4-Step Question Flow</div>
              <p className="text-sm text-gray-500">
                Question → Confidence → Options → Recognition Method → Feedback
              </p>
            </div>
            <div className="neuro-inset p-4 rounded-lg">
              <div className="text-green-400 font-medium mb-2">3. Mastery Updates</div>
              <p className="text-sm text-gray-500">
                Your mastery scores update based on correctness, confidence, and retrieval strength
              </p>
            </div>
            <div className="neuro-inset p-4 rounded-lg">
              <div className="text-yellow-400 font-medium mb-2">4. Progressive Unlocking</div>
              <p className="text-sm text-gray-500">
                Reach 80% mastery + 3 correct answers to unlock the next Bloom level
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
