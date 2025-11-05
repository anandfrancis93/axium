import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocumentUpload } from './DocumentUpload'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
  let user = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (!user) {
      redirect('/login')
    }
  } catch (error) {
    console.error('Error checking user auth on documents page:', error)
    redirect('/login')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="neuro-raised px-6 py-3 hover:shadow-lg transition-all">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Axium
              </h1>
            </a>
            <div>
              <p className="text-sm text-gray-500">Document Management</p>
              <p className="text-gray-300 font-medium">{user.email?.split('@')[0]}</p>
            </div>
          </div>
          <a href="/dashboard" className="neuro-btn text-sm">
            ← Back to Dashboard
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="neuro-card mb-6">
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">
            Upload Learning Materials
          </h2>
          <p className="text-gray-500 mb-6">
            Upload PDFs, books, and other documents. They will be processed and used for RAG-powered question generation.
          </p>

          <DocumentUpload />
        </div>

        <div className="neuro-card">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            How It Works
          </h3>
          <div className="space-y-3 text-sm">
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-blue-400 font-medium">1. Upload:</span>
              <span className="text-gray-400 ml-2">Select a chapter and upload your PDF documents</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-purple-400 font-medium">2. Processing:</span>
              <span className="text-gray-400 ml-2">Text is extracted and split into semantic chunks</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-green-400 font-medium">3. Embeddings:</span>
              <span className="text-gray-400 ml-2">OpenAI generates vector embeddings for semantic search</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-yellow-400 font-medium">4. Storage:</span>
              <span className="text-gray-400 ml-2">Chunks are stored in the vector database with pgvector</span>
            </div>
            <div className="neuro-inset p-3 rounded-lg">
              <span className="text-pink-400 font-medium">5. RAG:</span>
              <span className="text-gray-400 ml-2">Claude uses relevant chunks to generate personalized questions</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
