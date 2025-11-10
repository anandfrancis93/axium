'use client'

import Link from 'next/link'
import { PlayIcon, BarChartIcon, BookIcon, SettingsIcon, ArrowLeftIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

interface Chapter {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  questions: { count: number }[]
}

interface Subject {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

interface SubjectContentProps {
  subject: Subject
  chapters: Chapter[]
}

export function SubjectContent({ subject, chapters }: SubjectContentProps) {
  return (
    <>
      <div className="page-background">
        {/* Animated gradient orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="page-container">
        {/* Sticky Glass Header */}
        <header className="glass-header">
          <div className="header-content">
            <div className="header-left">
              {/* Back Button */}
              <Link
                href="/subjects"
                className="back-button"
              >
                <ArrowLeftIcon size={20} weight="regular" className="relative z-10" />
              </Link>

              {/* Subject Title */}
              <div className="subject-info">
                <h1 className="subject-title">
                  {subject.name}
                </h1>
                {subject.description && (
                  <p className="subject-description">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>

            <div className="menu-container">
              <HamburgerMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {chapters.length > 0 ? (
            <div className="content-wrapper">
              {/* Page Title Section */}
              <div className="page-title-section">
                <div className="title-icon-container">
                  <div className="title-icon-glow"></div>
                  <BookIcon size={28} weight="regular" className="relative z-10 text-blue-400" />
                </div>
                <h2 className="page-title">
                  Chapters ({chapters.length})
                </h2>
              </div>

              {/* Chapters List */}
              <div className="chapters-list">
                {chapters.map((chapter, index) => (
                  <div key={chapter.id} className="chapter-card">
                    {/* Chapter Number Badge */}
                    <div className="chapter-number-badge">
                      <div className="chapter-number-glow"></div>
                      <span className="chapter-number-text">
                        {index + 1}
                      </span>
                    </div>

                    {/* Chapter Content */}
                    <div className="chapter-content">
                      <h3 className="chapter-title">
                        {chapter.name}
                      </h3>
                      {chapter.description && (
                        <p className="chapter-description">
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    {/* Chapter Actions */}
                    <div className="chapter-actions">
                      <Link
                        href={`/subjects/${subject.slug}/${chapter.slug}/quiz`}
                        className="action-button action-button-primary"
                      >
                        <PlayIcon size={18} weight="regular" className="relative z-10" />
                        <span className="relative z-10">Start Learning</span>
                      </Link>
                      <Link
                        href={`/performance/${subject.slug}/${chapter.slug}`}
                        className="action-button action-button-secondary"
                      >
                        <BarChartIcon size={18} weight="regular" className="relative z-10" />
                        <span className="relative z-10">Performance</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="empty-state-wrapper">
              <div className="empty-state-card">
                <div className="empty-icon-container">
                  <div className="empty-icon-glow"></div>
                  <BookIcon size={56} weight="light" className="relative z-10 text-gray-600" />
                </div>
                <h2 className="empty-title">
                  No Chapters Yet
                </h2>
                <p className="empty-description">
                  Create chapters for this subject to start your adaptive learning journey.
                </p>
                <Link
                  href="/admin"
                  className="empty-action-button"
                >
                  <SettingsIcon size={20} weight="regular" className="relative z-10" />
                  <span className="relative z-10">Go to Admin Panel</span>
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        /* Base Background */
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

        /* Floating Gradient Orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          animation: float 25s ease-in-out infinite;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .orb-1 {
          width: 650px;
          height: 650px;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.35) 0%,
            rgba(59, 130, 246, 0) 70%
          );
          top: -25%;
          left: -15%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 750px;
          height: 750px;
          background: radial-gradient(
            circle,
            rgba(139, 92, 246, 0.28) 0%,
            rgba(139, 92, 246, 0) 70%
          );
          bottom: -30%;
          right: -20%;
          animation-delay: 8s;
        }

        .orb-3 {
          width: 550px;
          height: 550px;
          background: radial-gradient(
            circle,
            rgba(16, 185, 129, 0.22) 0%,
            rgba(16, 185, 129, 0) 70%
          );
          top: 45%;
          left: 55%;
          animation-delay: 16s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(50px, -50px) scale(1.08);
          }
          50% {
            transform: translate(-40px, 40px) scale(0.92);
          }
          75% {
            transform: translate(40px, 50px) scale(1.05);
          }
        }

        /* Page Container */
        .page-container {
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        /* Glass Header - Sticky */
        .glass-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 1rem;
          background: rgba(12, 12, 12, 0.6);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow:
            0 4px 20px 0 rgba(0, 0, 0, 0.6),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.03);
        }

        .header-content {
          max-width: 80rem;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
          flex: 1;
        }

        /* Back Button */
        .back-button {
          position: relative;
          width: 2.75rem;
          height: 2.75rem;
          flex-shrink: 0;
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(25px) saturate(180%);
          -webkit-backdrop-filter: blur(25px) saturate(180%);
          border-radius: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 4px 16px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255, 255, 255, 0.7);
        }

        .back-button:hover {
          background: rgba(25, 25, 25, 0.8);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(59, 130, 246, 0.9);
          transform: translateX(-4px);
          box-shadow:
            0 6px 24px 0 rgba(0, 0, 0, 0.7),
            0 2px 8px 0 rgba(59, 130, 246, 0.15),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
        }

        /* Subject Info */
        .subject-info {
          min-width: 0;
          flex: 1;
        }

        .subject-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #dbeafe 50%,
            #93c5fd 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 15px rgba(59, 130, 246, 0.4));
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .subject-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .menu-container {
          flex-shrink: 0;
        }

        /* Main Content */
        .main-content {
          max-width: 80rem;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        @media (min-width: 640px) {
          .main-content {
            padding: 2rem 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .main-content {
            padding: 3rem 2rem;
          }
        }

        .content-wrapper {
          width: 100%;
        }

        /* Page Title Section */
        .page-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .title-icon-container {
          position: relative;
          width: 4rem;
          height: 4rem;
          background: rgba(18, 18, 18, 0.7);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 6px 20px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        .title-icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.35) 0%,
            transparent 70%
          );
          border-radius: 1.25rem;
          filter: blur(22px);
          opacity: 0.75;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #e0e7ff 50%,
            #a5b4fc 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 3px 18px rgba(59, 130, 246, 0.45));
          letter-spacing: -0.02em;
        }

        @media (max-width: 640px) {
          .page-title {
            font-size: 1.75rem;
          }
        }

        /* Chapters List */
        .chapters-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Chapter Card - Liquid Glass */
        .chapter-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 2rem;
          background: rgba(18, 18, 18, 0.65);
          backdrop-filter: blur(40px) saturate(190%);
          -webkit-backdrop-filter: blur(40px) saturate(190%);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.7),
            0 2px 8px 0 rgba(0, 0, 0, 0.5),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.02);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 768px) {
          .chapter-card {
            flex-direction: row;
            align-items: center;
          }
        }

        .chapter-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 1.5rem;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(0, 0, 0, 0.1) 100%
          );
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .chapter-card:hover {
          transform: translateY(-4px);
          background: rgba(22, 22, 22, 0.75);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow:
            0 16px 48px 0 rgba(0, 0, 0, 0.85),
            0 8px 20px 0 rgba(59, 130, 246, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.03);
        }

        .chapter-card:hover::before {
          opacity: 1;
        }

        /* Chapter Number Badge */
        .chapter-number-badge {
          position: relative;
          width: 4rem;
          height: 4rem;
          flex-shrink: 0;
          background: rgba(22, 22, 22, 0.75);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 6px 24px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chapter-card:hover .chapter-number-badge {
          background: rgba(28, 28, 28, 0.85);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.8),
            0 2px 12px 0 rgba(59, 130, 246, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
        }

        .chapter-number-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.35) 0%,
            transparent 70%
          );
          border-radius: 1.25rem;
          filter: blur(22px);
          opacity: 0.6;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chapter-card:hover .chapter-number-glow {
          opacity: 0.9;
        }

        .chapter-number-text {
          position: relative;
          z-index: 10;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #dbeafe 50%,
            #93c5fd 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 10px rgba(59, 130, 246, 0.4));
        }

        /* Chapter Content */
        .chapter-content {
          flex: 1;
          min-width: 0;
        }

        .chapter-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
          letter-spacing: -0.01em;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chapter-card:hover .chapter-title {
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #dbeafe 50%,
            #93c5fd 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 15px rgba(59, 130, 246, 0.5));
        }

        .chapter-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.6;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
        }

        /* Chapter Actions */
        .chapter-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        @media (min-width: 640px) {
          .chapter-actions {
            flex-direction: row;
          }
        }

        /* Action Button - Liquid Glass */
        .action-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(25px) saturate(180%);
          -webkit-backdrop-filter: blur(25px) saturate(180%);
          border-radius: 0.875rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 4px 16px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        .action-button-primary {
          color: rgba(147, 197, 253, 0.95);
        }

        .action-button-secondary {
          color: rgba(255, 255, 255, 0.7);
        }

        .action-button:hover {
          background: rgba(25, 25, 25, 0.8);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow:
            0 6px 24px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
        }

        .action-button-primary:hover {
          color: rgba(191, 219, 254, 1);
          box-shadow:
            0 6px 24px 0 rgba(0, 0, 0, 0.7),
            0 2px 8px 0 rgba(59, 130, 246, 0.3),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
        }

        .action-button:active {
          transform: translateY(0);
        }

        /* Empty State */
        .empty-state-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .empty-state-card {
          max-width: 32rem;
          width: 100%;
          padding: 3rem 2rem;
          background: rgba(18, 18, 18, 0.65);
          backdrop-filter: blur(40px) saturate(190%);
          -webkit-backdrop-filter: blur(40px) saturate(190%);
          border-radius: 1.75rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 10px 40px 0 rgba(0, 0, 0, 0.8),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
          text-align: center;
        }

        .empty-icon-container {
          position: relative;
          width: 7rem;
          height: 7rem;
          margin: 0 auto 1.75rem;
          background: rgba(22, 22, 22, 0.75);
          backdrop-filter: blur(35px) saturate(180%);
          -webkit-backdrop-filter: blur(35px) saturate(180%);
          border-radius: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow:
            0 6px 24px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
        }

        .empty-icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            rgba(107, 114, 128, 0.25) 0%,
            transparent 70%
          );
          border-radius: 1.75rem;
          filter: blur(28px);
          opacity: 0.5;
        }

        .empty-title {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #e5e7eb 50%,
            #9ca3af 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 15px rgba(107, 114, 128, 0.3));
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .empty-description {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 24rem;
          margin-left: auto;
          margin-right: auto;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
        }

        .empty-action-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1.75rem;
          background: rgba(59, 130, 246, 0.18);
          backdrop-filter: blur(25px) saturate(180%);
          -webkit-backdrop-filter: blur(25px) saturate(180%);
          border-radius: 1rem;
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: rgba(255, 255, 255, 0.97);
          font-weight: 500;
          font-size: 0.9375rem;
          cursor: pointer;
          text-decoration: none;
          box-shadow:
            0 5px 25px 0 rgba(59, 130, 246, 0.25),
            0 2px 10px 0 rgba(0, 0, 0, 0.5),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .empty-action-button:hover {
          background: rgba(59, 130, 246, 0.28);
          border-color: rgba(59, 130, 246, 0.55);
          transform: translateY(-2px);
          box-shadow:
            0 8px 35px 0 rgba(59, 130, 246, 0.4),
            0 4px 15px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.18);
        }

        .empty-action-button:active {
          transform: translateY(0);
        }

        /* Responsive Adjustments */
        @media (max-width: 640px) {
          .glass-header {
            padding: 0.75rem;
          }

          .back-button {
            width: 2.5rem;
            height: 2.5rem;
          }

          .subject-title {
            font-size: 1.25rem;
          }

          .chapter-card {
            padding: 1.5rem;
          }

          .chapter-number-badge {
            width: 3.5rem;
            height: 3.5rem;
          }

          .chapter-number-text {
            font-size: 1.25rem;
          }

          .chapter-title {
            font-size: 1.125rem;
          }

          .empty-state-card {
            padding: 2.5rem 1.5rem;
          }

          .empty-icon-container {
            width: 6rem;
            height: 6rem;
          }

          .empty-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </>
  )
}
