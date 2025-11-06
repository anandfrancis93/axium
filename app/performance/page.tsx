import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BarChartIcon, BookIcon, AwardIcon, TrendingUpIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

export const dynamic = 'force-dynamic'

export default async function PerformanceDashboard() {
  let user: any = null
  let subjects: any[] = []
  let overallStats: any = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (!user) {
      redirect('/login')
    }

    // Fetch all subjects
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        slug,
        description,
        chapters (count)
      `)
      .order('created_at', { ascending: false })

    subjects = subjectsData || []

    // Get overall progress summary across all subjects
    const { data: progressData } = await supabase
      .from('user_progress_summary')
      .select('*')
      .eq('user_id', user.id)

    // Calculate aggregate stats
    if (progressData && progressData.length > 0) {
      overallStats = {
        topics_started: progressData.reduce((sum: number, p: any) => sum + (p.topics_started || 0), 0),
        topics_mastered: progressData.reduce((sum: number, p: any) => sum + (p.topics_mastered || 0), 0),
        questions_attempted: progressData.reduce((sum: number, p: any) => sum + (p.total_questions_attempted || 0), 0),
        overall_accuracy: progressData.length > 0
          ? progressData.reduce((sum: number, p: any) => sum + (p.overall_accuracy || 0), 0) / progressData.length
          : 0
      }
    } else {
      overallStats = {
        topics_started: 0,
        topics_mastered: 0,
        questions_attempted: 0,
        overall_accuracy: 0
      }
    }

  } catch (error) {
    console.error('Error loading performance dashboard:', error)
    redirect('/login')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <div className="neuro-raised px-6 py-3 flex items-center gap-3 min-w-0 flex-shrink">
            <BarChartIcon size={24} className="text-blue-400 flex-shrink-0" />
            <h1 className="text-2xl font-bold text-blue-400 truncate">
              Performance Dashboard
            </h1>
          </div>
          <div className="flex-shrink-0">
            <HamburgerMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Overall Stats */}
        <div className="neuro-card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
              <TrendingUpIcon size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-200">
              Overall Progress
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="neuro-stat cursor-help" title="Topics you've started learning">
              <div className="text-sm text-blue-400 mb-1">Topics Started</div>
              <div className="text-3xl font-bold text-gray-200">{overallStats.topics_started}</div>
            </div>
            <div className="neuro-stat cursor-help" title="Topics with 80%+ mastery">
              <div className="text-sm text-green-400 mb-1">Topics Mastered</div>
              <div className="text-3xl font-bold text-gray-200">{overallStats.topics_mastered}</div>
            </div>
            <div className="neuro-stat cursor-help" title="Total questions answered">
              <div className="text-sm text-cyan-400 mb-1">Questions Answered</div>
              <div className="text-3xl font-bold text-gray-200">{overallStats.questions_attempted}</div>
            </div>
            <div className="neuro-stat cursor-help" title="Percentage of correct answers">
              <div className="text-sm text-purple-400 mb-1">Overall Accuracy</div>
              <div className="text-3xl font-bold text-gray-200">{Math.round(overallStats.overall_accuracy)}%</div>
            </div>
          </div>
        </div>

        {/* Subjects Performance */}
        {subjects.length > 0 ? (
          <div className="neuro-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                <BookIcon size={20} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200">
                Performance by Subject
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/performance/${subject.slug}`}
                  className="neuro-raised p-6 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="neuro-inset w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-blue-400">
                      {subject.name.charAt(0)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-200 mb-2 group-hover:text-blue-400 transition-colors">
                    {subject.name}
                  </h3>

                  {subject.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {subject.description}
                    </p>
                  )}

                  <div className="text-sm text-gray-600">
                    {subject.chapters?.[0]?.count || 0} {subject.chapters?.[0]?.count === 1 ? 'chapter' : 'chapters'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="neuro-card">
            <div className="neuro-inset p-8 rounded-lg text-center">
              <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChartIcon size={40} className="text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-200 mb-2">
                No Performance Data Yet
              </h2>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                Start learning to see your performance analytics.
              </p>
              <Link
                href="/subjects"
                className="neuro-btn text-blue-400 inline-flex items-center gap-2 px-6 py-3"
              >
                <BookIcon size={18} />
                <span>Browse Subjects</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
