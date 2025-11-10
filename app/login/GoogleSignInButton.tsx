'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function GoogleSignInButton() {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleSignIn = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error signing in:', error.message)
      alert('Error signing in. Please try again.')
    }
  }

  return (
    <button
      onClick={handleSignIn}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsPressed(false)
        setIsHovered(false)
      }}
      className="w-full group relative overflow-hidden"
      style={{
        height: '56px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isPressed ? 'scale(0.97) translateY(1px)' : isHovered ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
        // Liquid Glass: Frosted glass effect
        backdropFilter: 'blur(30px) saturate(150%)',
        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        backgroundColor: isPressed
          ? 'rgba(255, 255, 255, 0.25)'
          : isHovered
            ? 'rgba(255, 255, 255, 0.22)'
            : 'rgba(255, 255, 255, 0.18)',
        boxShadow: isPressed
          ? '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
          : isHovered
            ? '0 12px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Liquid Glass: Vibrant gradient overlay on hover */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.08 : 0,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '16px',
          pointerEvents: 'none'
        }}
      />

      {/* Liquid Glass: Shimmer effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          animation: isHovered ? 'shimmer 2s infinite' : 'none',
          pointerEvents: 'none',
          borderRadius: '16px',
        }}
      />

      {/* Button content */}
      <div className="relative flex items-center justify-center gap-3 h-full px-6">
        {/* Google Icon with glass container */}
        <div className="relative" style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          padding: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>

        {/* Text with enhanced contrast */}
        <span style={{
          fontSize: '17px',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}>
          Continue with Google
        </span>
      </div>

      {/* Shimmer animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  )
}
