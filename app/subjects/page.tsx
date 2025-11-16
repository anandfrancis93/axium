import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookIcon, CodeIcon, CalculatorIcon, AtomIcon, PenToolIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      redirect('/login')
    }

  } catch (error) {
    console.error('Error loading dashboard:', error)
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
              <BookIcon size={24} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-blue-400 truncate">
              Axium
            </h1>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">

        {/* Subjects Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Subjects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* IT/CS */}
            <Link
              href="/subjects/it-cs"
              className="neuro-card p-6 transition-all hover:translate-y-[-2px] active:translate-y-0"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <CodeIcon size={32} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">IT/CS</h3>
                </div>
              </div>
            </Link>

            {/* Math */}
            <div className="neuro-card p-6 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <CalculatorIcon size={32} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Math</h3>
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Physics */}
            <div className="neuro-card p-6 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <AtomIcon size={32} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">Physics</h3>
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* English */}
            <div className="neuro-card p-6 opacity-50 cursor-not-allowed">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="neuro-inset w-16 h-16 rounded-xl flex items-center justify-center">
                  <PenToolIcon size={32} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">English</h3>
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
