import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CodeIcon, ArrowLeftIcon, ShieldIcon, NetworkIcon, DatabaseIcon, TerminalIcon } from '@/components/icons'
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

        {/* Topics */}
        <div>
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Topics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cybersecurity */}
            <div className="neuro-card p-6 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <ShieldIcon size={32} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Cybersecurity</h3>
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Networking */}
            <div className="neuro-card p-6 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <NetworkIcon size={32} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Networking</h3>
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Database */}
            <div className="neuro-card p-6 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <DatabaseIcon size={32} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Database</h3>
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Programming */}
            <div className="neuro-card p-6 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <TerminalIcon size={32} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Programming</h3>
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
