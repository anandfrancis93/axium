import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlayIcon, BarChartIcon, ArrowLeftIcon, BookIcon, TargetIcon, UserIcon, SettingsIcon } from '@/components/icons'

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
    redirect('/home')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/home" className="neuro-btn flex items-center gap-2">
              <ArrowLeftIcon size={18} />
              <span>Back</span>
            </Link>
            <div className="neuro-raised px-6 py-3 flex items-center gap-3">
              <BookIcon size={24} className="text-blue-400" />
              <h1 className="text-2xl font-bold text-blue-400">
                {subject.name}
              </h1>
            </div>
          </div>
          <div className="neuro-inset px-4 py-2 rounded-lg flex items-center gap-2">
            <UserIcon size={16} className="text-gray-500" />
            <span className="text-sm text-gray-400 font-medium">
              {user.email?.split('@')[0]}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Subject Overview Card */}
        <div className="neuro-card mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="neuro-inset w-16 h-16 rounded-2xl flex items-center justify-center">
                  <BookIcon size={32} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-200">
                    {subject.name}
                  </h2>
                  <div className="text-sm text-gray-500 mt-1">
                    {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'} Available
                  </div>
                </div>
              </div>
              {subject.description && (
                <p className="text-gray-400 leading-relaxed">
                  {subject.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chapters List */}
        {chapters.length > 0 ? (
          <div className="neuro-card mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                <BookIcon size={20} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-200">
                Chapters ({chapters.length})
              </h3>
            </div>

            <div className="space-y-4">
              {chapters.map((chapter, index) => {
                const questionCount = chapter.questions?.[0]?.count || 0
                const hasQuestions = questionCount > 0

                return (
                  <div
                    key={chapter.id}
                    className="neuro-raised p-6 hover:shadow-lg transition-all group"
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
                          <p className="text-sm text-gray-500 mb-3">
                            {chapter.description}
                          </p>
                        )}
                          <div className="neuro-badge neuro-badge-info flex items-center gap-1.5 inline-flex">
                            <TargetIcon size={12} />
                            <span>AI-Powered Questions</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 md:ml-16">
                        <Link
                          href={`/learn/${chapter.slug}`}
                          className="neuro-btn-primary px-6 py-3 text-center whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          <PlayIcon size={18} />
                          Start Learning
                        </Link>
                        <Link
                          href={`/performance/${chapter.slug}`}
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
          </div>
        ) : (
          // Empty state
          <div className="neuro-card">
            <div className="neuro-inset p-8 rounded-lg text-center">
              <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookIcon size={40} className="text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200 mb-2">
                No Chapters Yet
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                Create chapters for this subject to start your learning journey.
              </p>
              <Link href="/admin" className="neuro-btn-primary inline-flex items-center gap-2 px-6 py-3">
                <SettingsIcon size={18} />
                <span>Go to Admin Panel</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
