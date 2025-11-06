import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BarChartIcon, BookIcon, TrendingUpIcon, AwardIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

export const dynamic = 'force-dynamic'

export default async function SubjectPerformancePage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject: subjectSlug } = await params

  let subject: any = null
  let chapters: any[] = []
  let user: any = null

  try {
    const supabase = await createClient()
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData

    if (!user) {
      redirect('/login')
    }

    // Get subject details by slug
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name, slug, description')
      .eq('slug', subjectSlug)
      .single()

    if (!subjectData) {
      redirect('/performance')
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
        created_at
      `)
      .eq('subject_id', subject.id)
      .order('created_at', { ascending: true })

    chapters = chaptersData || []

  } catch (error) {
    console.error('Error loading subject performance:', error)
    redirect('/performance')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <div className="neuro-raised px-6 py-3 flex items-center gap-3 min-w-0 flex-shrink">
            <BarChartIcon size={24} className="text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Performance</div>
              <h1 className="text-xl font-bold text-gray-200 truncate">
                {subject.name}
              </h1>
            </div>
          </div>
          <div className="flex-shrink-0">
            <HamburgerMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Chapters List */}
        {chapters.length > 0 ? (
          <div className="neuro-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                <BookIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                Chapters ({chapters.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/performance/${subject.slug}/${chapter.slug}`}
                  className="neuro-raised p-6 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="flex gap-4">
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
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="neuro-card">
            <div className="neuro-inset p-8 rounded-lg text-center">
              <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookIcon size={40} className="text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200 mb-2">
                No Chapters Yet
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                No chapters found for this subject.
              </p>
              <Link
                href="/performance"
                className="neuro-btn text-blue-400 inline-flex items-center gap-2 px-6 py-3"
              >
                <BarChartIcon size={18} />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="mt-6 text-sm text-gray-500">
          <Link href="/performance" className="hover:text-blue-400 transition-colors">
            Performance
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-400">{subject.name}</span>
        </div>
      </main>
    </div>
  )
}
