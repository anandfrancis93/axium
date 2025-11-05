import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './SignOutButton'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let user: any = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (!user) {
      redirect('/login')
    }
  } catch (error) {
    console.error('Error checking user auth on dashboard:', error)
    redirect('/login')
    return null // TypeScript requires a return after redirect in catch
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
          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="neuro-card mb-6">
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">
            Your Learning Dashboard
          </h2>
          <p className="text-gray-500 mb-6">
            Track your progress across subjects, chapters, and topics using Bloom's Taxonomy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="neuro-stat group">
              <div className="text-sm text-blue-400 font-medium mb-2">
                Total Questions
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                0
              </div>
            </div>
            <div className="neuro-stat group">
              <div className="text-sm text-green-400 font-medium mb-2">
                Accuracy
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-green-400 transition-colors">
                0%
              </div>
            </div>
            <div className="neuro-stat group">
              <div className="text-sm text-purple-400 font-medium mb-2">
                Topics Mastered
              </div>
              <div className="text-4xl font-bold text-gray-200 group-hover:text-purple-400 transition-colors">
                0
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
              Setup Required
            </h3>
            <div className="space-y-3">
              <div className="neuro-raised p-4 flex items-start gap-3 hover:shadow-lg transition-all">
                <div className="flex-shrink-0 neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Configure Supabase
                  </div>
                  <p className="text-sm text-gray-500">Follow the guide in <code className="neuro-inset px-2 py-1 text-xs rounded text-gray-400">supabase/README.md</code></p>
                </div>
              </div>
              <a href="/admin" className="neuro-raised p-4 flex items-start gap-3 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex-shrink-0 neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-purple-400 font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Add Your First Subject →
                  </div>
                  <p className="text-sm text-gray-500">Create subjects, chapters, and topics to start learning</p>
                </div>
              </a>
              <a href="/documents" className="neuro-raised p-4 flex items-start gap-3 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex-shrink-0 neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-green-400 font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Upload Learning Materials →
                  </div>
                  <p className="text-sm text-gray-500">Upload PDFs and documents for RAG-powered question generation</p>
                </div>
              </a>
              <div className="neuro-raised p-4 flex items-start gap-3 hover:shadow-lg transition-all">
                <div className="flex-shrink-0 neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 font-bold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 mb-1">
                    Start Learning
                  </div>
                  <p className="text-sm text-gray-500">Begin your adaptive learning journey through Bloom's levels</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="neuro-card">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Architecture Overview
          </h3>
          <div className="space-y-3 text-sm">
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-blue-400 font-medium">Hierarchy:</span>
              <span className="text-gray-400 ml-2">Subject → Chapter → Topic → Bloom Level (1-6)</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-purple-400 font-medium">Learning Engine:</span>
              <span className="text-gray-400 ml-2">RL-based adaptive progression</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-green-400 font-medium">Question Generation:</span>
              <span className="text-gray-400 ml-2">Claude AI + RAG with your materials</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-yellow-400 font-medium">Intelligence Types:</span>
              <span className="text-gray-400 ml-2">Tracks fluid (reasoning) & crystallized (knowledge)</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-pink-400 font-medium">Mastery Tracking:</span>
              <span className="text-gray-400 ml-2">Per topic × Bloom level with confidence calibration</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
