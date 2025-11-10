'use client'

import Link from 'next/link'
import HamburgerMenu from '@/components/HamburgerMenu'

interface Subject {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  chapters: { count: number }[]
}

interface SubjectsContentProps {
  subjects: Subject[]
}

export function SubjectsContent({ subjects }: SubjectsContentProps) {
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
            <h1 className="logo-text">
              Axium
            </h1>
            <div className="menu-container">
              <HamburgerMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {subjects.length > 0 ? (
            <div className="content-wrapper">
              {/* Page Title Section */}
              <div className="page-title-section">
                <h2 className="page-title">
                  Your Subjects
                </h2>
              </div>

              {/* Subjects Grid */}
              <div className="subjects-grid">
                {subjects.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.slug}`}
                    className="subject-card"
                  >
                    {/* Glass Icon Container */}
                    <div className="subject-icon-container">
                      <div className="subject-icon-glow"></div>
                      <span className="subject-icon-text">
                        {subject.name.charAt(0)}
                      </span>
                    </div>

                    {/* Subject Name */}
                    <h3 className="subject-name">
                      {subject.name}
                    </h3>

                    {/* Description */}
                    {subject.description && (
                      <p className="subject-description">
                        {subject.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="subject-metadata">
                      <span className="metadata-text">
                        {subject.chapters?.[0]?.count || 0}{' '}
                        {subject.chapters?.[0]?.count === 1 ? 'chapter' : 'chapters'}
                      </span>
                      <span className="arrow-indicator">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state-wrapper">
              <div className="empty-state-card">
                <h2 className="empty-title">
                  No Subjects Yet
                </h2>
                <p className="empty-description">
                  Create your first subject to start your adaptive learning journey.
                </p>
                <Link
                  href="/admin"
                  className="empty-action-button"
                >
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
          width: 600px;
          height: 600px;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.35) 0%,
            rgba(59, 130, 246, 0) 70%
          );
          top: -20%;
          left: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 700px;
          height: 700px;
          background: radial-gradient(
            circle,
            rgba(139, 92, 246, 0.28) 0%,
            rgba(139, 92, 246, 0) 70%
          );
          bottom: -25%;
          right: -15%;
          animation-delay: 8s;
        }

        .orb-3 {
          width: 500px;
          height: 500px;
          background: radial-gradient(
            circle,
            rgba(16, 185, 129, 0.22) 0%,
            rgba(16, 185, 129, 0) 70%
          );
          top: 40%;
          left: 60%;
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

        .logo-text {
          font-size: 1.875rem;
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
          white-space: nowrap;
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
          margin-bottom: 2.5rem;
        }

        .page-title {
          font-size: 2.25rem;
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
          filter: drop-shadow(0 3px 20px rgba(59, 130, 246, 0.45));
          letter-spacing: -0.02em;
        }

        @media (max-width: 640px) {
          .page-title {
            font-size: 1.875rem;
          }
        }

        /* Subjects Grid */
        .subjects-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }

        @media (min-width: 768px) {
          .subjects-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .subjects-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
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
            0 2px 8px 0 rgba(0, 0, 0, 0.5),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
        }

        .subject-card::before {
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

        .subject-card:hover {
          transform: translateY(-6px);
          background: rgba(22, 22, 22, 0.75);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow:
            0 16px 48px 0 rgba(0, 0, 0, 0.85),
            0 8px 20px 0 rgba(59, 130, 246, 0.15),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.03);
        }

        .subject-card:hover::before {
          opacity: 1;
        }

        .subject-card:active {
          transform: translateY(-3px);
        }

        /* Subject Icon Container */
        .subject-icon-container {
          position: relative;
          width: 5rem;
          height: 5rem;
          margin-bottom: 1.5rem;
          background: rgba(22, 22, 22, 0.75);
          backdrop-filter: blur(35px) saturate(180%);
          -webkit-backdrop-filter: blur(35px) saturate(180%);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 6px 24px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .subject-card:hover .subject-icon-container {
          background: rgba(28, 28, 28, 0.85);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.8),
            0 2px 12px 0 rgba(59, 130, 246, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
        }

        .subject-icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.35) 0%,
            transparent 70%
          );
          border-radius: 1.5rem;
          filter: blur(25px);
          opacity: 0.6;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .subject-card:hover .subject-icon-glow {
          opacity: 0.9;
        }

        .subject-icon-text {
          position: relative;
          z-index: 10;
          font-size: 2.5rem;
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
          filter: drop-shadow(0 2px 12px rgba(59, 130, 246, 0.4));
        }

        /* Subject Name */
        .subject-name {
          font-size: 1.5rem;
          font-weight: 600;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #e0e7ff 60%,
            #bfdbfe 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 12px rgba(59, 130, 246, 0.3));
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .subject-card:hover .subject-name {
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #bfdbfe 40%,
            #60a5fa 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 18px rgba(59, 130, 246, 0.7));
        }

        /* Subject Description */
        .subject-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.5;
          margin-bottom: 1.25rem;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Subject Metadata */
        .subject-metadata {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .metadata-text {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
        }

        .arrow-indicator {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.3);
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .subject-card:hover .arrow-indicator {
          opacity: 1;
          transform: translateX(0);
          color: rgba(59, 130, 246, 0.8);
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
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
          font-size: 0.875rem;
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

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .glass-header {
            padding: 0.75rem;
          }

          .logo-badge {
            width: 3rem;
            height: 3rem;
          }

          .logo-text {
            font-size: 1.5rem;
          }

          .subject-card {
            padding: 1.5rem;
          }

          .subject-icon-container {
            width: 4rem;
            height: 4rem;
            margin-bottom: 1.25rem;
          }

          .subject-icon-text {
            font-size: 2rem;
          }

          .subject-name {
            font-size: 1.25rem;
          }

          .empty-state-card {
            padding: 2.5rem 1.5rem;
          }

          .empty-icon-container {
            width: 5.5rem;
            height: 5.5rem;
          }

          .empty-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </>
  )
}
