'use client'

import { BookIcon } from '@/components/icons'
import { GoogleSignInButton } from './GoogleSignInButton'

export function LoginContent() {
  return (
    <>
      <div className="login-background">
        {/* Animated gradient orbs for depth - reduced opacity for #0a0a0a */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="login-container">
        {/* Liquid Glass Card */}
        <div className="glass-card">
          {/* Branding */}
          <div className="text-center mb-8">
            {/* Glass Icon Container */}
            <div className="glass-icon-container">
              <div className="icon-glow"></div>
              <BookIcon size={56} className="relative z-10 text-white" />
            </div>

            {/* Title with Glass Text Effect */}
            <h1 className="glass-title">
              Axium
            </h1>
            <p className="glass-subtitle">
              Adaptive Learning Platform
            </p>
          </div>

          {/* Sign In Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="glass-heading">
                Welcome Back
              </h2>
              <p className="glass-text">
                Sign in to continue learning
              </p>
            </div>

            <GoogleSignInButton />

            <p className="glass-legal">
              By signing in, you agree to use this platform responsibly.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Base background - strict #0a0a0a */
        .login-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0a0a0a;
          overflow: hidden;
          z-index: 0;
        }

        /* Ambient light orbs - more visible on dark background */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.35;
          animation: float 20s ease-in-out infinite;
          mix-blend-mode: screen;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%);
          top: -15%;
          left: -15%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0) 70%);
          bottom: -20%;
          right: -20%;
          animation-delay: 7s;
        }

        .orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 14s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(40px, -40px) scale(1.1);
          }
          50% {
            transform: translate(-30px, 30px) scale(0.9);
          }
          75% {
            transform: translate(30px, 40px) scale(1.05);
          }
        }

        .login-container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        @media (min-width: 640px) {
          .login-container {
            padding: 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .login-container {
            padding: 2rem;
          }
        }

        /* Main Glass Card - Liquid Glass Material */
        .glass-card {
          position: relative;
          max-width: 28rem;
          width: 100%;

          /* Liquid Glass core properties */
          background: rgba(18, 18, 18, 0.7);
          backdrop-filter: blur(50px) saturate(200%);
          -webkit-backdrop-filter: blur(50px) saturate(200%);

          border-radius: 2rem;
          padding: 3rem 2rem;

          /* Subtle glass border */
          border: 1px solid rgba(255, 255, 255, 0.07);

          /* Multi-layer depth shadows */
          box-shadow:
            0 10px 40px 0 rgba(0, 0, 0, 0.8),
            0 4px 12px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.02);

          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 640px) {
          .glass-card {
            padding: 3rem;
          }
        }

        /* Glass border gradient overlay */
        .glass-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 2rem;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.12) 0%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* Glass Icon Container */
        .glass-icon-container {
          position: relative;
          width: 6rem;
          height: 6rem;
          margin: 0 auto 1.5rem;

          /* Liquid Glass material */
          background: rgba(25, 25, 25, 0.7);
          backdrop-filter: blur(35px) saturate(180%);
          -webkit-backdrop-filter: blur(35px) saturate(180%);

          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255, 255, 255, 0.1);

          box-shadow:
            0 6px 20px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.4);

          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%);
          border-radius: 1.5rem;
          filter: blur(25px);
          opacity: 0.7;
        }

        /* Glass Title with Gradient */
        .glass-title {
          font-size: 3rem;
          font-weight: 700;

          /* Vibrant gradient for dark background */
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 50%, #93c5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;

          margin-bottom: 0.75rem;
          filter: drop-shadow(0 3px 25px rgba(59, 130, 246, 0.5));
          letter-spacing: -0.02em;
        }

        @media (max-width: 640px) {
          .glass-title {
            font-size: 2.5rem;
          }
        }

        /* Glass Text Elements */
        .glass-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
        }

        .glass-heading {
          font-size: 1.75rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 15px rgba(0, 0, 0, 0.6);
          letter-spacing: -0.01em;
        }

        @media (max-width: 640px) {
          .glass-heading {
            font-size: 1.5rem;
          }
        }

        .glass-text {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 400;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
        }

        .glass-legal {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          line-height: 1.4;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.6);
        }

        :global(.space-y-6 > * + *) {
          margin-top: 1.5rem;
        }
      `}</style>
    </>
  )
}
