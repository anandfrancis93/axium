'use client'

import { GoogleSignInButton } from './GoogleSignInButton'
import { BookIcon } from '@/components/icons'

export function LoginContent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif'
    }}>
      {/* Liquid Glass: Rich, vibrant gradient background with animation */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 30% 20%, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
        animation: 'gradientShift 15s ease infinite'
      }} />

      {/* Liquid Glass: Animated gradient orbs for depth */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse" style={{
        background: 'radial-gradient(circle, #667eea, transparent)',
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30" style={{
        background: 'radial-gradient(circle, #f093fb, transparent)',
        animation: 'float 25s ease-in-out infinite reverse'
      }} />

      {/* Liquid Glass: Main frosted glass container */}
      <div className="max-w-md w-full relative z-10">
        <div className="relative" style={{
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          padding: '48px 40px',
        }}>
          {/* Content */}
          <div className="text-center">
            {/* Liquid Glass: Floating glass icon container */}
            <div className="inline-flex items-center justify-center w-28 h-28 mb-8 relative" style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}>
              {/* Vibrant glow behind icon */}
              <div className="absolute inset-0 rounded-[24px] blur-xl opacity-50" style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
              }} />
              <div className="relative z-10" style={{
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
              }}>
                <BookIcon size={56} className="text-white" />
              </div>
            </div>

            {/* Typography with vibrancy */}
            <h1 className="text-5xl font-bold tracking-tight mb-3" style={{
              fontWeight: 700,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
            }}>
              Axium
            </h1>

            <p className="text-[17px] font-medium mb-12 leading-snug" style={{
              color: 'rgba(255, 255, 255, 0.85)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
              Adaptive Learning Platform
            </p>

            {/* Button */}
            <div className="mb-8">
              <GoogleSignInButton />
            </div>

            {/* Legal text with glass effect */}
            <p className="text-[13px] font-normal leading-relaxed px-8" style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}</style>
    </div>
  )
}
