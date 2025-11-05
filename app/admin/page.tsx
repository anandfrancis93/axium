import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubjectManager } from './SubjectManager'
import { ChapterManager } from './ChapterManager'
import { QuestionGenerator } from './QuestionGenerator'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  let user = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (!user) {
      redirect('/login')
    }
  } catch (error) {
    console.error('Error checking user auth on admin page:', error)
    redirect('/login')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <a href="/home" className="neuro-raised px-6 py-3 hover:shadow-lg transition-all">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Axium
              </h1>
            </a>
            <div>
              <p className="text-sm text-gray-500">Admin - Content Management</p>
              <p className="text-gray-300 font-medium">{user.email?.split('@')[0]}</p>
            </div>
          </div>
          <a href="/home" className="neuro-btn text-sm">
            ← Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subjects */}
          <div className="neuro-card">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">
              Subjects
            </h2>
            <SubjectManager />
          </div>

          {/* Chapters */}
          <div className="neuro-card">
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">
              Chapters
            </h2>
            <ChapterManager />
          </div>
        </div>

        {/* Question Generator */}
        <div className="mt-6">
          <QuestionGenerator />
        </div>

        <div className="neuro-card mt-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Content Hierarchy
          </h3>
          <div className="neuro-inset p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">
              <span className="text-blue-400 font-medium">Subject</span> →
              <span className="text-purple-400 font-medium ml-2">Chapter</span> →
              <span className="text-green-400 font-medium ml-2">Topic</span> →
              <span className="text-yellow-400 font-medium ml-2">Bloom Level (1-6)</span>
            </p>
            <p className="text-xs text-gray-500 mt-3">
              1. Create subjects (e.g., "Computer Science", "Mathematics")<br />
              2. Add chapters to subjects (e.g., "Data Structures", "Algorithms")<br />
              3. Upload documents to chapters for RAG-powered learning<br />
              4. Topics and Bloom levels will be managed through the learning interface
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
