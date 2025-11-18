import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CodeIcon, ShieldIcon, NetworkIcon, DatabaseIcon, TerminalIcon, LockIcon } from '@/components/icons'
import Image from 'next/image'
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-[#0a0a0a]">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="neuro-inset w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Image src="/icon.svg" width={64} height={64} alt="Axium Logo" className="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-bold text-blue-400 truncate">
              IT/CS
            </h1>
          </div>
          <HamburgerMenu />
        </div>
      </header>

      {/* Main Content */}
      < main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8" >

        {/* Topics */}
        < div className="animate-slide-up" >
          <h3 className="text-xl font-semibold text-gray-200 mb-6 px-1">Select a Topic</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cybersecurity - Active */}
            <Link
              href="/subjects/it-cs/cybersecurity"
              className="group relative neuro-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--elevation-3)] active:translate-y-0 active:shadow-[var(--inset)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              <div className="relative flex flex-col items-center text-center space-y-4">
                <div className="neuro-raised w-20 h-20 rounded-2xl flex items-center justify-center group-hover:text-blue-400 transition-colors duration-300">
                  <ShieldIcon size={40} className="text-red-400 group-hover:scale-110 transition-transform duration-300" withShadow />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors">Cybersecurity</h3>
                  <p className="text-sm text-gray-500 mt-1">Network defense & security</p>
                </div>
              </div>
            </Link>

            {/* Networking - Locked */}
            <div className="neuro-inset p-6 opacity-70 relative overflow-hidden group">
              <div className="absolute top-3 right-3 text-gray-600">
                <LockIcon size={16} />
              </div>
              <div className="flex flex-col items-center text-center space-y-4 opacity-50 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-70">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-gray-800 bg-gray-900/50">
                  <NetworkIcon size={32} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-400">Networking</h3>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-600 border border-gray-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Database - Locked */}
            <div className="neuro-inset p-6 opacity-70 relative overflow-hidden group">
              <div className="absolute top-3 right-3 text-gray-600">
                <LockIcon size={16} />
              </div>
              <div className="flex flex-col items-center text-center space-y-4 opacity-50 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-70">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-gray-800 bg-gray-900/50">
                  <DatabaseIcon size={32} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-400">Database</h3>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-600 border border-gray-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Programming - Locked */}
            <div className="neuro-inset p-6 opacity-70 relative overflow-hidden group">
              <div className="absolute top-3 right-3 text-gray-600">
                <LockIcon size={16} />
              </div>
              <div className="flex flex-col items-center text-center space-y-4 opacity-50 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-70">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-gray-800 bg-gray-900/50">
                  <TerminalIcon size={32} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-400">Programming</h3>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-600 border border-gray-800 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div >
      </main >
    </div >
  )
}
