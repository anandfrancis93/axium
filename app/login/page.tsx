import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoogleSignInButton } from './GoogleSignInButton'
import { BookIcon } from '@/components/icons'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Check if user is already logged in
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/subjects')
    }
  } catch (error) {
    // If auth check fails, continue showing login page
    console.error('Error checking user auth on login page:', error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ background: '#0a0a0a' }}>
      <div className="max-w-md w-full">
        <div className="neuro-container">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="neuro-inset w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookIcon size={40} className="text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-blue-400 mb-3">
              Axium
            </h1>
            <p className="text-sm text-gray-500">
              Adaptive Learning Platform
            </p>
          </div>

          {/* Sign In Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-200 mb-2">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500">
                Sign in to continue learning
              </p>
            </div>

            <GoogleSignInButton />

            <p className="text-xs text-gray-600 text-center">
              By signing in, you agree to use this platform responsibly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
