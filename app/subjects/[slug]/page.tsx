import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

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

    // Get subject details by slug
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', slug)
      .single()

    if (subjectError || !subjectData) {
      redirect('/home')
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
      .eq('subject_id', subject.id)
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
    redirect('/home')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/home" className="neuro-btn">
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
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-200 mb-2">
                {subject.name}
              </h2>
              {subject.description && (
                <p className="text-gray-400">
                  {subject.description}
                </p>
              )}
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
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <span className="text-gray-500">
                              AI generates questions on-demand
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
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
      </main>
    </div>
  )
}
