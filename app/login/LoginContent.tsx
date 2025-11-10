'use client'

import { BookIcon } from '@/components/icons'
import { GoogleSignInButton } from './GoogleSignInButton'

export function LoginContent() {
  return (
    <>
      <div className="login-background">
        {/* Animated gradient orbs for depth */}
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
        .login-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #0a0a14 0%, #0f0f1e 25%, #14142d 50%, #0f0f1e 75%, #0a0a14 100%);
          overflow: hidden;
          z-index: 0;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%);
          top: -10%;
          left: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%);
          bottom: -15%;
          right: -15%;
          animation-delay: 7s;
        }

        .orb-3 {
          width: 350px;
          height: 350px;
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
            transform: translate(30px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 30px) scale(1.05);
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

        .glass-card {
          position: relative;
          max-width: 28rem;
          width: 100%;
          background: rgba(20, 20, 35, 0.4);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-radius: 2rem;
          padding: 3rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.5),
            0 2px 8px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.02);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 640px) {
          .glass-card {
            padding: 3rem;
          }
        }

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
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .glass-icon-container {
          position: relative;
          width: 6rem;
          height: 6rem;
          margin: 0 auto 1.5rem;
          background: rgba(30, 30, 50, 0.5);
          backdrop-filter: blur(30px) saturate(150%);
          -webkit-backdrop-filter: blur(30px) saturate(150%);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 4px 16px 0 rgba(0, 0, 0, 0.4),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
          border-radius: 1.5rem;
          filter: blur(20px);
          opacity: 0.6;
        }

        .glass-title {
          font-size: 3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c7d2fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
          text-shadow: 0 2px 20px rgba(59, 130, 246, 0.3);
          letter-spacing: -0.02em;
        }

        @media (max-width: 640px) {
          .glass-title {
            font-size: 2.5rem;
          }
        }

        .glass-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .glass-heading {
          font-size: 1.75rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
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
        }

        .glass-legal {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          line-height: 1.4;
        }

        :global(.space-y-6 > * + *) {
          margin-top: 1.5rem;
        }
      `}</style>
    </>
  )
}
