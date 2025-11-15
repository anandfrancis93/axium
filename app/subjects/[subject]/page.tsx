import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlayIcon, BarChartIcon, BookIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

export const dynamic = 'force-dynamic'

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject: subjectSlug } = await params

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
      .eq('slug', subjectSlug)
      .single()

    if (subjectError || !subjectData) {
      redirect('/subjects')
    }

    subject = subjectData

    // Get chapters for this subject
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select(`
        id,
        name,
        slug,
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
    redirect('/subjects')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookIcon size={24} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-blue-400 truncate">
              {subject.name}
            </h1>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Chapters List */}
        {chapters.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-200">
                Chapters ({chapters.length})
              </h2>
              {subject.description && (
                <div className="text-sm text-gray-500 max-w-md text-right">
                  {subject.description}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {chapters.map((chapter, index) => {
                const questionCount = chapter.questions?.[0]?.count || 0
                const hasQuestions = questionCount > 0

                return (
                  <div
                    key={chapter.id}
                    className="neuro-raised p-6 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 flex gap-4">
                        <div className="neuro-inset w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-400">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-200 mb-2 group-hover:text-blue-400 transition-colors">
                            {chapter.name}
                          </h4>
                        {chapter.description && (
                          <p className="text-sm text-gray-500">
                            {chapter.description}
                          </p>
                        )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 md:ml-16">
                        <Link
                          href={`/subjects/${subject.slug}/${chapter.slug}/quiz`}
                          className="neuro-btn px-6 py-3 text-center whitespace-nowrap flex items-center justify-center gap-2 text-blue-400"
                        >
                          <PlayIcon size={18} />
                          Start Learning
                        </Link>
                        <Link
                          href={`/performance/${subject.slug}/${chapter.slug}`}
                          className="neuro-btn px-6 py-3 text-center whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <BarChartIcon size={18} />
                          Performance
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          // Empty state
          <div className="text-center py-16">
            <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookIcon size={40} className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-200 mb-2">
              No Chapters Yet
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Chapters need to be added for this subject.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
