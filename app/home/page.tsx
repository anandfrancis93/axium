import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookIcon, SettingsIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let user: any = null
  let subjects: any[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (!user) {
      redirect('/login')
    }

    // Fetch all subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        slug,
        description,
        created_at,
        chapters (count)
      `)
      .order('created_at', { ascending: false })

    if (!subjectsError) {
      subjects = subjectsData || []
    }

  } catch (error) {
    console.error('Error loading dashboard:', error)
    redirect('/login')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="neuro-raised px-6 py-3 flex items-center gap-3">
            <BookIcon size={24} className="text-blue-400" />
            <h1 className="text-2xl font-bold text-blue-400">
              Axium
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="neuro-btn text-sm flex items-center gap-2"
            >
              <SettingsIcon size={16} />
              <span>Admin</span>
            </Link>
            <HamburgerMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Subjects Grid */}
        {subjects.length > 0 ? (
          <div className="neuro-card mb-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                <BookIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-200">
                Your Subjects
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.slug}`}
                  className="neuro-raised p-6 hover:shadow-lg transition-all group cursor-pointer"
                >
                  {/* Subject Icon */}
                  <div className="neuro-inset w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-blue-400">
                      {subject.name.charAt(0)}
                    </span>
                  </div>

                  {/* Subject Name */}
                  <h3 className="text-xl font-semibold text-gray-200 mb-2 group-hover:text-blue-400 transition-colors">
                    {subject.name}
                  </h3>

                  {/* Description */}
                  {subject.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {subject.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="text-sm text-gray-600">
                    {subject.chapters?.[0]?.count || 0} {subject.chapters?.[0]?.count === 1 ? 'chapter' : 'chapters'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          // Empty state
          <div className="neuro-card mb-6">
            <div className="neuro-inset p-8 rounded-lg text-center">
              <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookIcon size={40} className="text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-200 mb-2">
                No Subjects Yet
              </h2>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                Create your first subject to start your adaptive learning journey.
              </p>
              <Link
                href="/admin"
                className="neuro-btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
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
