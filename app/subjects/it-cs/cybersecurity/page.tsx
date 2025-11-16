import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShieldIcon, ArrowLeftIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function CybersecurityPage() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      redirect('/login')
    }

  } catch (error) {
    console.error('Error loading Cybersecurity page:', error)
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
              <ShieldIcon size={24} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-red-400 truncate">
              Cybersecurity
            </h1>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Back Button */}
        <Link
          href="/subjects/it-cs"
          className="neuro-btn text-gray-300 inline-flex items-center gap-2 px-4 py-2"
        >
          <ArrowLeftIcon size={18} />
          <span>Back to IT/CS</span>
        </Link>

        {/* Quick Action - Start Practice */}
        <div className="neuro-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-1">Ready to Practice?</h2>
              <p className="text-sm text-gray-500">AI will select the best topic for you based on your learning progress</p>
            </div>
            <Link
              href="/learn"
              className="neuro-btn text-blue-400 px-6 py-3 font-semibold"
            >
              Start Quiz →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
