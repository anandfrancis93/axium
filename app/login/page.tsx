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
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-[#0a0a0a]">
      <div className="max-w-md w-full animate-slide-up">
        <div className="neuro-card">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="neuro-raised rounded-full p-3 flex items-center justify-center">
                <img
                  src="/icon.svg"
                  alt="Axium Logo"
                  className="w-24 h-24 drop-shadow-lg"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-blue-400 mb-2 tracking-tight">
              Axium
            </h1>
            <p className="text-sm text-gray-400 font-medium">
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
                Sign in to continue your learning journey
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
