import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlayIcon, BarChartIcon, BookIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

export const dynamic = 'force-dynamic'

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ subject: string, chapter: string }>
}) {
  const { subject: subjectSlug, chapter: chapterSlug } = await params

  let subject: any = null
  let chapter: any = null
  let user: any = null

  try {
    const supabase = await createClient()
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData

    if (!user) {
      // redirect('/login')
    }

    // Get subject details by slug
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name, slug, description')
      .eq('slug', subjectSlug)
      .single()

    if (!subjectData) {
      redirect('/subjects')
    }

    subject = subjectData

    // Get chapter details by slug and subject_id
    const { data: chapterData } = await supabase
      .from('chapters')
      .select('id, name, slug, description, created_at')
      .eq('slug', chapterSlug)
      .eq('subject_id', subject.id)
      .single()

    if (!chapterData) {
      redirect(`/subjects/${subjectSlug}`)
    }

    chapter = chapterData

  } catch (error) {
    console.error('Error loading chapter:', error)
    redirect('/subjects')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <div className="neuro-raised px-6 py-3 flex items-center gap-3 min-w-0 flex-shrink">
            <BookIcon size={24} className="text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500 truncate">{subject.name}</div>
              <h1 className="text-xl font-bold text-gray-200 truncate">
                {chapter.name}
              </h1>
            </div>
          </div>
          <div className="flex-shrink-0">
            <HamburgerMenu />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="neuro-card">
          {/* Chapter Info */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-200 mb-4">
              {chapter.name}
            </h2>
            {chapter.description && (
              <p className="text-lg text-gray-400">
                {chapter.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Learning */}
            <Link
              href={`/subjects/${subject.slug}/${chapter.slug}/quiz`}
              className="neuro-raised p-8 hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PlayIcon size={40} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2 group-hover:text-blue-400 transition-colors">
                  Start Learning
                </h3>
                <p className="text-sm text-gray-500">
                  Begin an adaptive learning session with AI-generated questions
                </p>
              </div>
            </Link>

            {/* View Performance */}
            <Link
              href={`/performance/${subject.slug}/${chapter.slug}`}
              className="neuro-raised p-8 hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChartIcon size={40} className="text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2 group-hover:text-green-400 transition-colors">
                  View Performance
                </h3>
                <p className="text-sm text-gray-500">
                  Track your mastery, progress, and learning analytics
                </p>
              </div>
            </Link>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/subjects" className="hover:text-blue-400 transition-colors">
                Subjects
              </Link>
              <span>›</span>
              <Link href={`/subjects/${subject.slug}`} className="hover:text-blue-400 transition-colors">
                {subject.name}
              </Link>
              <span>›</span>
              <span className="text-gray-400">{chapter.name}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
