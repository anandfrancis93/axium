import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoogleSignInButton } from './GoogleSignInButton'

export default async function LoginPage() {
  // Check if user is already logged in
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  } catch (error) {
    // If auth check fails, continue showing login page
    console.error('Error checking user auth on login page:', error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="max-w-md w-full space-y-8 p-8 neuro-container mx-4">
        <div className="text-center space-y-4">
          <div className="neuro-raised inline-block px-8 py-4 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Axium
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Intelligent Self-Learning Platform
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-200">
              Welcome
            </h2>
            <p className="text-sm text-gray-500">
              Sign in to continue your learning journey
            </p>
          </div>

          <GoogleSignInButton />

          <div className="text-center text-xs text-gray-600 mt-6 space-y-2">
            <p>By signing in, you agree to use this platform responsibly.</p>
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              <span className="neuro-inset px-3 py-1 text-xs rounded-full">Claude AI</span>
              <span className="neuro-inset px-3 py-1 text-xs rounded-full">Supabase</span>
              <span className="neuro-inset px-3 py-1 text-xs rounded-full">Adaptive Learning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
