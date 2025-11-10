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
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif'
    }}>
      <div className="max-w-sm w-full">
        {/* Apple HIG: Centered content with generous spacing */}
        <div className="text-center">
          {/* Icon - Apple HIG: Large, recognizable app icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 rounded-[20px] bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50">
            <BookIcon size={48} className="text-white" />
          </div>

          {/* Typography - Apple HIG: Clear hierarchy with SF Pro weights */}
          <h1 className="text-5xl font-semibold tracking-tight text-white mb-3" style={{
            fontWeight: 600,
            letterSpacing: '-0.02em'
          }}>
            Axium
          </h1>

          {/* Apple HIG: Secondary text with reduced opacity */}
          <p className="text-[17px] font-normal text-white/60 mb-12 leading-snug">
            Adaptive Learning Platform
          </p>

          {/* Apple HIG: Single primary action, prominent placement */}
          <div className="mb-8">
            <GoogleSignInButton />
          </div>

          {/* Apple HIG: Legal text, smallest size, lowest hierarchy */}
          <p className="text-[13px] font-normal text-white/40 leading-relaxed px-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
