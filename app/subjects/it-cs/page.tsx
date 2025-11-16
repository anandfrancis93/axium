import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CodeIcon, ArrowLeftIcon, BookIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function ITCSPage() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      redirect('/login')
    }

  } catch (error) {
    console.error('Error loading IT/CS page:', error)
    redirect('/login')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <CodeIcon size={24} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-blue-400 truncate">
              IT/CS
            </h1>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Back Button */}
        <Link
          href="/subjects"
          className="neuro-btn text-gray-300 inline-flex items-center gap-2 px-4 py-2"
        >
          <ArrowLeftIcon size={18} />
          <span>Back to Subjects</span>
        </Link>

        {/* Subject Info */}
        <div className="neuro-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
              <CodeIcon size={32} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-200">Information Technology & Computer Science</h2>
              <p className="text-sm text-gray-500 mt-1">Explore cybersecurity, programming, and computing fundamentals</p>
            </div>
          </div>
        </div>

        {/* Placeholder: Chapters */}
        <div>
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Chapters</h3>
          <div className="neuro-inset p-8 rounded-lg text-center">
            <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookIcon size={40} className="text-gray-600" />
            </div>
            <div className="text-gray-400 text-lg font-semibold mb-2">
              No chapters yet
            </div>
            <div className="text-sm text-gray-600 mb-6">
              Chapters and topics will be displayed here once content is added
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
