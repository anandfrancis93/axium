'use client'

import Link from 'next/link'
import { BookIcon, SettingsIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

interface Subject {
  id: string
  name: string
  slug: string
  description: string | null
  chapters: { count: number }[]
}

interface SubjectsContentProps {
  subjects: Subject[]
}

export function SubjectsContent({ subjects }: SubjectsContentProps) {
  return (
    <>
      <div className="page-background">
        {/* Ambient gradient orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="page-container">
        {/* Liquid Glass Header */}
        <header className="glass-header">
          <div className="header-content">
            {/* Logo/Brand */}
            <div className="glass-logo">
              <div className="logo-glow"></div>
              <BookIcon size={24} className="relative z-10 text-white" />
              <h1 className="logo-text">Axium</h1>
            </div>

            {/* Menu */}
            <div className="menu-container">
              <HamburgerMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {subjects.length > 0 ? (
            <>
              {/* Page Title */}
              <div className="page-title-section">
                <div className="glass-title-container">
                  <div className="title-icon-wrapper">
                    <BookIcon size={28} className="text-white" />
                  </div>
                  <h2 className="page-title">Your Subjects</h2>
                </div>
                <p className="page-subtitle">
                  {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} available
                </p>
              </div>

              {/* Subjects Grid */}
              <div className="subjects-grid">
                {subjects.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.slug}`}
                    className="subject-card"
                  >
                    <div className="card-glow"></div>

                    {/* Subject Icon */}
                    <div className="subject-icon-container">
                      <div className="icon-glow"></div>
                      <span className="subject-initial">
                        {subject.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Subject Info */}
                    <div className="subject-info">
                      <h3 className="subject-name">{subject.name}</h3>

                      {subject.description && (
                        <p className="subject-description">
                          {subject.description}
                        </p>
                      )}

                      <div className="subject-meta">
                        <span className="meta-badge">
                          {subject.chapters?.[0]?.count || 0} {subject.chapters?.[0]?.count === 1 ? 'chapter' : 'chapters'}
                        </span>
                      </div>
                    </div>

                    {/* Hover arrow indicator */}
                    <div className="card-arrow">→</div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            // Empty State
            <div className="empty-state">
              <div className="empty-glass-card">
                {/* Icon */}
                <div className="empty-icon-container">
                  <div className="empty-icon-glow"></div>
                  <BookIcon size={64} className="relative z-10 text-white opacity-40" />
                </div>

                {/* Message */}
                <h2 className="empty-title">No Subjects Yet</h2>
                <p className="empty-description">
                  Create your first subject to start your adaptive learning journey
                </p>

                {/* CTA Button */}
                <Link href="/admin" className="empty-cta-button">
                  <div className="button-glow"></div>
                  <SettingsIcon size={20} className="relative z-10" />
                  <span className="relative z-10">Go to Admin Panel</span>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        /* Base Background - strict #0a0a0a */
        .page-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0a0a0a;
          overflow: hidden;
          z-index: 0;
        }

        /* Ambient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          animation: float 25s ease-in-out infinite;
          mix-blend-mode: screen;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
          top: -20%;
          right: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
          bottom: -15%;
          left: -10%;
          animation-delay: 10s;
        }

        .orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 17s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(50px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-40px, 40px) scale(0.9);
          }
        }

        /* Page Container */
        .page-container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Liquid Glass Header */
        .glass-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 1rem;
          background: rgba(12, 12, 12, 0.6);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.5);
        }

        .header-content {
          max-width: 80rem;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        /* Glass Logo */
        .glass-logo {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 4px 16px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        .logo-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
          border-radius: 1rem;
          filter: blur(20px);
          opacity: 0.6;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 15px rgba(59, 130, 246, 0.4));
          margin: 0;
        }

        .menu-container {
          display: flex;
          align-items: center;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          max-width: 80rem;
          margin: 0 auto;
          width: 100%;
          padding: 2rem 1rem;
        }

        @media (min-width: 640px) {
          .main-content {
            padding: 3rem 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .main-content {
            padding: 4rem 2rem;
          }
        }

        /* Page Title Section */
        .page-title-section {
          margin-bottom: 3rem;
        }

        .glass-title-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .title-icon-wrapper {
          display: flex;
          align-items: center;
          justify-center;
          width: 3.5rem;
          height: 3.5rem;
          background: rgba(25, 25, 25, 0.7);
          backdrop-filter: blur(25px) saturate(160%);
          -webkit-backdrop-filter: blur(25px) saturate(160%);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 4px 16px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 50%, #93c5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 3px 20px rgba(59, 130, 246, 0.4));
          margin: 0;
          letter-spacing: -0.02em;
        }

        @media (max-width: 640px) {
          .page-title {
            font-size: 2rem;
          }
        }

        .page-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
          margin-left: 4.5rem;
        }

        /* Subjects Grid */
        .subjects-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .subjects-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .subjects-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Subject Card - Liquid Glass */
        .subject-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          background: rgba(18, 18, 18, 0.65);
          backdrop-filter: blur(40px) saturate(190%);
          -webkit-backdrop-filter: blur(40px) saturate(190%);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-decoration: none;
          overflow: hidden;
        }

        .subject-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1.5rem;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .subject-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow:
            0 12px 48px 0 rgba(59, 130, 246, 0.2),
            0 8px 32px 0 rgba(0, 0, 0, 0.8),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        .card-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.15) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .subject-card:hover .card-glow {
          opacity: 1;
        }

        /* Subject Icon */
        .subject-icon-container {
          position: relative;
          width: 5rem;
          height: 5rem;
          margin-bottom: 1.5rem;
          background: rgba(25, 25, 25, 0.7);
          backdrop-filter: blur(30px) saturate(170%);
          -webkit-backdrop-filter: blur(30px) saturate(170%);
          border-radius: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 6px 20px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        }

        .icon-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
          border-radius: 1.25rem;
          filter: blur(20px);
          opacity: 0.7;
        }

        .subject-initial {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #93c5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 12px rgba(59, 130, 246, 0.5));
          position: relative;
          z-10;
        }

        /* Subject Info */
        .subject-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .subject-name {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
          margin: 0;
          transition: all 0.3s ease;
        }

        .subject-card:hover .subject-name {
          color: rgba(147, 197, 253, 1);
          text-shadow: 0 2px 20px rgba(59, 130, 246, 0.6);
        }

        .subject-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        .subject-meta {
          display: flex;
          align-items: center;
          margin-top: auto;
        }

        .meta-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
          background: rgba(59, 130, 246, 0.12);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 0.5rem;
          border: 1px solid rgba(59, 130, 246, 0.25);
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(147, 197, 253, 1);
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        /* Card Arrow */
        .card-arrow {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          font-size: 1.5rem;
          color: rgba(59, 130, 246, 0.6);
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .subject-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Empty State */
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .empty-glass-card {
          max-width: 32rem;
          width: 100%;
          padding: 4rem 2rem;
          background: rgba(18, 18, 18, 0.7);
          backdrop-filter: blur(50px) saturate(200%);
          -webkit-backdrop-filter: blur(50px) saturate(200%);
          border-radius: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 10px 40px 0 rgba(0, 0, 0, 0.8),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
          text-align: center;
        }

        .empty-icon-container {
          position: relative;
          width: 8rem;
          height: 8rem;
          margin: 0 auto 2rem;
          background: rgba(25, 25, 25, 0.7);
          backdrop-filter: blur(35px) saturate(180%);
          -webkit-backdrop-filter: blur(35px) saturate(180%);
          border-radius: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 6px 24px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        .empty-icon-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
          border-radius: 2rem;
          filter: blur(30px);
          opacity: 0.5;
        }

        .empty-title {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #dbeafe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 3px 20px rgba(59, 130, 246, 0.3));
          margin: 0 0 1rem 0;
        }

        .empty-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin: 0 0 2.5rem 0;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        /* Empty CTA Button */
        .empty-cta-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: rgba(59, 130, 246, 0.18);
          backdrop-filter: blur(25px) saturate(180%);
          -webkit-backdrop-filter: blur(25px) saturate(180%);
          border-radius: 1rem;
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: rgba(255, 255, 255, 0.97);
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 5px 25px 0 rgba(59, 130, 246, 0.25),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .empty-cta-button:hover {
          background: rgba(59, 130, 246, 0.28);
          border-color: rgba(59, 130, 246, 0.55);
          transform: translateY(-2px);
          box-shadow:
            0 8px 35px 0 rgba(59, 130, 246, 0.4),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.18);
        }

        .button-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, transparent 70%);
          filter: blur(35px);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .empty-cta-button:hover .button-glow {
          opacity: 0.9;
        }
      `}</style>
    </>
  )
}
