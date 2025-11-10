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
        /* Liquid Glass Button - tuned for #0a0a0a background */
        .glass-button {
          position: relative;
          width: 100%;
          padding: 1rem 1.5rem;

          /* Liquid Glass material */
          background: rgba(59, 130, 246, 0.18);
          backdrop-filter: blur(25px) saturate(180%);
          -webkit-backdrop-filter: blur(25px) saturate(180%);

          border-radius: 1rem;
          border: 1px solid rgba(59, 130, 246, 0.35);

          color: rgba(255, 255, 255, 0.97);
          font-weight: 500;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;

          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          /* Multi-layer shadows for depth on dark bg */
          box-shadow:
            0 5px 25px 0 rgba(59, 130, 246, 0.25),
            0 2px 10px 0 rgba(0, 0, 0, 0.5),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.3);

          overflow: hidden;
        }

        /* Shimmer gradient overlay */
        .glass-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(0, 0, 0, 0.1) 100%
          );
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        /* Hover state - enhanced for dark background */
        .glass-button:hover {
          background: rgba(59, 130, 246, 0.28);
          border-color: rgba(59, 130, 246, 0.55);
          transform: translateY(-2px);

          box-shadow:
            0 8px 35px 0 rgba(59, 130, 246, 0.4),
            0 4px 15px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.3);
        }

        .glass-button:hover::before {
          opacity: 1;
        }

        /* Active/pressed state */
        .glass-button:active {
          transform: translateY(0);

          box-shadow:
            0 3px 15px 0 rgba(59, 130, 246, 0.35),
            0 1px 5px 0 rgba(0, 0, 0, 0.5),
            inset 0 2px 5px 0 rgba(0, 0, 0, 0.3);
        }

        /* Radial glow effect */
        .button-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, transparent 70%);
          filter: blur(35px);
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .glass-button:hover .button-glow {
          opacity: 0.9;
        }
      `}</style>
    </>
  )
}
