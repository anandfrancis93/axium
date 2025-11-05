import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './SignOutButton'
import Link from 'next/link'

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
          <div className="flex items-center gap-4">
            <div className="neuro-raised px-6 py-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Axium
              </h1>
            </div>
            <div>
              <p className="text-sm text-gray-500">Welcome back</p>
              <p className="text-gray-300 font-medium">{user.email?.split('@')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="neuro-btn text-sm"
            >
              Admin Panel
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Subjects Grid */}
        {subjects.length > 0 ? (
          <div className="neuro-card mb-6">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">
              Your Subjects
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.id}`}
                  className="neuro-raised p-6 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                >
                  {/* Subject Icon/Badge */}
                  <div className="neuro-inset w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:shadow-inner transition-all">
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
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
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span>{subject.chapters?.[0]?.count || 0} chapters</span>
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className="mt-4 text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Start learning →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          // Empty state
          <div className="neuro-card mb-6">
            <h2 className="text-2xl font-semibold text-gray-200 mb-2">
              Get Started with Axium
            </h2>
            <p className="text-gray-500 mb-6">
              Create your first subject and start your adaptive learning journey!
            </p>

            <div className="space-y-3">
              <Link
                href="/admin"
                className="neuro-raised p-4 flex items-start gap-3 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex-shrink-0 neuro-inset w-10 h-10 rounded-full flex items-center justify-center text-purple-400 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Create Subject & Chapters →
                  </div>
                  <p className="text-sm text-gray-500">
                    Go to admin panel to create subjects and chapters
                  </p>
                </div>
              </Link>

              <div className="neuro-raised p-4 flex items-start gap-3">
                <div className="flex-shrink-0 neuro-inset w-10 h-10 rounded-full flex items-center justify-center text-blue-400 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Upload Learning Materials
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload PDFs or paste text to build your knowledge base
                  </p>
                </div>
              </div>

              <div className="neuro-raised p-4 flex items-start gap-3">
                <div className="flex-shrink-0 neuro-inset w-10 h-10 rounded-full flex items-center justify-center text-green-400 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Generate AI Questions
                  </div>
                  <p className="text-sm text-gray-500">
                    Use AI to generate questions at all Bloom levels
                  </p>
                </div>
              </div>

              <div className="neuro-raised p-4 flex items-start gap-3">
                <div className="flex-shrink-0 neuro-inset w-10 h-10 rounded-full flex items-center justify-center text-yellow-400 font-bold">
                  4
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Start Learning with RL
                  </div>
                  <p className="text-sm text-gray-500">
                    Begin your adaptive learning journey - AI selects optimal questions for you
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
