'use client'

import { createClient } from '@/lib/supabase/client'

export function GoogleSignInButton() {
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
    <>
      <button
        onClick={handleSignIn}
        className="glass-button"
      >
        <div className="button-glow"></div>
        <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-medium relative z-10">
          Sign in with Google
        </span>
      </button>

      <style jsx>{`
        .glass-button {
          position: relative;
          width: 100%;
          padding: 1rem 1.5rem;
          background: rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border-radius: 1rem;
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 4px 20px 0 rgba(59, 130, 246, 0.2),
            0 2px 8px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .glass-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(0, 0, 0, 0.1) 100%
          );
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .glass-button:hover {
          background: rgba(59, 130, 246, 0.25);
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-2px);
          box-shadow:
            0 6px 30px 0 rgba(59, 130, 246, 0.35),
            0 4px 12px 0 rgba(0, 0, 0, 0.4),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.2);
        }

        .glass-button:hover::before {
          opacity: 1;
        }

        .glass-button:active {
          transform: translateY(0);
          box-shadow:
            0 2px 12px 0 rgba(59, 130, 246, 0.3),
            0 1px 4px 0 rgba(0, 0, 0, 0.3),
            inset 0 2px 4px 0 rgba(0, 0, 0, 0.2);
        }

        .button-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
          filter: blur(30px);
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .glass-button:hover .button-glow {
          opacity: 0.8;
        }
      `}</style>
    </>
  )
}
