'use client'

import Link from 'next/link'
import { PlayIcon, BarChartIcon, BookIcon, ArrowLeftIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

interface ChapterContentProps {
  subject: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  chapter: {
    id: string
    name: string
    slug: string
    description: string | null
    created_at: string
  }
}

export function ChapterContent({ subject, chapter }: ChapterContentProps) {
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
                href={`/subjects/${subject.slug}`}
                className="back-button"
              >
                <ArrowLeftIcon size={20} weight="regular" className="relative z-10" />
              </Link>

              {/* Chapter Info */}
              <div className="chapter-info">
                <div className="subject-label">{subject.name}</div>
                <h1 className="chapter-title">
                  {chapter.name}
                </h1>
              </div>
            </div>

            <div className="menu-container">
              <HamburgerMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-wrapper">
            {/* Hero Section */}
            <div className="hero-section">
              <div className="hero-icon-container">
                <div className="hero-icon-glow"></div>
                <BookIcon size={64} weight="light" className="relative z-10 text-white" />
              </div>

              <h2 className="hero-title">
                {chapter.name}
              </h2>

              {chapter.description && (
                <p className="hero-description">
                  {chapter.description}
                </p>
              )}
            </div>

            {/* Action Cards Grid */}
            <div className="actions-grid">
              {/* Start Learning Card */}
              <Link
                href={`/subjects/${subject.slug}/${chapter.slug}/quiz`}
                className="action-card"
              >
                <div className="action-icon-container">
                  <div className="action-icon-glow action-icon-glow-blue"></div>
                  <PlayIcon size={48} weight="regular" className="relative z-10 text-white" />
                </div>

                <h3 className="action-title action-title-blue">
                  Start Learning
                </h3>

                <p className="action-description">
                  Begin an adaptive learning session with AI-generated questions tailored to your level
                </p>

                <div className="action-footer">
                  <span className="action-badge action-badge-blue">Interactive</span>
                  <span className="action-arrow">→</span>
                </div>
              </Link>

              {/* View Performance Card */}
              <Link
                href={`/performance/${subject.slug}/${chapter.slug}`}
                className="action-card"
              >
                <div className="action-icon-container">
                  <div className="action-icon-glow action-icon-glow-green"></div>
                  <BarChartIcon size={48} weight="regular" className="relative z-10 text-white" />
                </div>

                <h3 className="action-title action-title-green">
                  View Performance
                </h3>

                <p className="action-description">
                  Track your mastery, progress, and learning analytics across all Bloom levels
                </p>

                <div className="action-footer">
                  <span className="action-badge action-badge-green">Analytics</span>
                  <span className="action-arrow">→</span>
                </div>
              </Link>
            </div>

            {/* Breadcrumb Glass Card */}
            <div className="breadcrumb-card">
              <div className="breadcrumb-content">
                <Link href="/subjects" className="breadcrumb-link">
                  Subjects
                </Link>
                <span className="breadcrumb-separator">›</span>
                <Link href={`/subjects/${subject.slug}`} className="breadcrumb-link">
                  {subject.name}
                </Link>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{chapter.name}</span>
              </div>
            </div>
          </div>
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
          right: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 700px;
          height: 700px;
          background: radial-gradient(
            circle,
            rgba(16, 185, 129, 0.28) 0%,
            rgba(16, 185, 129, 0) 70%
          );
          bottom: -25%;
          left: -15%;
          animation-delay: 8s;
        }

        .orb-3 {
          width: 500px;
          height: 500px;
          background: radial-gradient(
            circle,
            rgba(139, 92, 246, 0.22) 0%,
            rgba(139, 92, 246, 0) 70%
          );
          top: 40%;
          left: 50%;
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
          max-width: 64rem;
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

        /* Chapter Info */
        .chapter-info {
          min-width: 0;
          flex: 1;
        }

        .subject-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chapter-title {
          font-size: 1.25rem;
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
          filter: drop-shadow(0 2px 12px rgba(59, 130, 246, 0.35));
          letter-spacing: -0.015em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .menu-container {
          flex-shrink: 0;
        }

        /* Main Content */
        .main-content {
          max-width: 64rem;
          margin: 0 auto;
          padding: 3rem 1rem;
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

        .content-wrapper {
          width: 100%;
        }

        /* Hero Section */
        .hero-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .hero-icon-container {
          position: relative;
          width: 8rem;
          height: 8rem;
          margin: 0 auto 2rem;
          background: rgba(18, 18, 18, 0.7);
          backdrop-filter: blur(35px) saturate(190%);
          -webkit-backdrop-filter: blur(35px) saturate(190%);
          border-radius: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 10px 40px 0 rgba(0, 0, 0, 0.8),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        .hero-icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.4) 0%,
            transparent 70%
          );
          border-radius: 2rem;
          filter: blur(30px);
          opacity: 0.8;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #e0e7ff 40%,
            #c7d2fe 70%,
            #a5b4fc 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 4px 28px rgba(59, 130, 246, 0.5));
          letter-spacing: -0.025em;
          margin-bottom: 1.25rem;
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: 2.25rem;
          }
        }

        .hero-description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.7;
          max-width: 42rem;
          margin: 0 auto;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
        }

        @media (max-width: 640px) {
          .hero-description {
            font-size: 1rem;
          }
        }

        /* Actions Grid */
        .actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        @media (min-width: 768px) {
          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem;
          }
        }

        /* Action Card - Liquid Glass */
        .action-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 2.5rem 2rem;
          background: rgba(18, 18, 18, 0.65);
          backdrop-filter: blur(40px) saturate(190%);
          -webkit-backdrop-filter: blur(40px) saturate(190%);
          border-radius: 1.75rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow:
            0 10px 40px 0 rgba(0, 0, 0, 0.75),
            0 4px 12px 0 rgba(0, 0, 0, 0.5),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          text-align: center;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 1.75rem;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.12) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(0, 0, 0, 0.1) 100%
          );
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .action-card:hover {
          transform: translateY(-8px);
          background: rgba(22, 22, 22, 0.8);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow:
            0 20px 60px 0 rgba(0, 0, 0, 0.9),
            0 8px 24px 0 rgba(59, 130, 246, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.03);
        }

        .action-card:hover::before {
          opacity: 1;
        }

        .action-card:active {
          transform: translateY(-4px);
        }

        /* Action Icon Container */
        .action-icon-container {
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
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.7),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-card:hover .action-icon-container {
          background: rgba(28, 28, 28, 0.85);
          border-color: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
          box-shadow:
            0 12px 48px 0 rgba(0, 0, 0, 0.8),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
        }

        .action-icon-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 1.75rem;
          filter: blur(30px);
          opacity: 0.6;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-icon-glow-blue {
          background: radial-gradient(
            circle,
            rgba(59, 130, 246, 0.4) 0%,
            transparent 70%
          );
        }

        .action-icon-glow-green {
          background: radial-gradient(
            circle,
            rgba(16, 185, 129, 0.4) 0%,
            transparent 70%
          );
        }

        .action-card:hover .action-icon-glow {
          opacity: 1;
        }

        /* Action Title */
        .action-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.015em;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-title-blue {
          color: rgba(255, 255, 255, 0.95);
        }

        .action-title-green {
          color: rgba(255, 255, 255, 0.95);
        }

        .action-card:hover .action-title-blue {
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #dbeafe 50%,
            #93c5fd 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 20px rgba(59, 130, 246, 0.6));
        }

        .action-card:hover .action-title-green {
          background: linear-gradient(
            135deg,
            #ffffff 0%,
            #d1fae5 50%,
            #6ee7b7 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 20px rgba(16, 185, 129, 0.6));
        }

        @media (max-width: 640px) {
          .action-title {
            font-size: 1.5rem;
          }
        }

        /* Action Description */
        .action-description {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.65;
          margin-bottom: 1.5rem;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
        }

        /* Action Footer */
        .action-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Action Badge */
        .action-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.375rem 0.875rem;
          border-radius: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-badge-blue {
          background: rgba(59, 130, 246, 0.15);
          color: rgba(147, 197, 253, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        .action-badge-green {
          background: rgba(16, 185, 129, 0.15);
          color: rgba(110, 231, 183, 0.9);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .action-card:hover .action-badge-blue {
          background: rgba(59, 130, 246, 0.25);
          color: rgba(191, 219, 254, 1);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
        }

        .action-card:hover .action-badge-green {
          background: rgba(16, 185, 129, 0.25);
          color: rgba(167, 243, 208, 1);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
        }

        /* Action Arrow */
        .action-arrow {
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.3);
          opacity: 0;
          transform: translateX(-12px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-card:hover .action-arrow {
          opacity: 1;
          transform: translateX(0);
          color: rgba(59, 130, 246, 0.9);
          filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.7));
        }

        /* Breadcrumb Glass Card */
        .breadcrumb-card {
          background: rgba(18, 18, 18, 0.5);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow:
            0 4px 16px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.03);
          padding: 1rem 1.5rem;
        }

        .breadcrumb-content {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 0.875rem;
          flex-wrap: wrap;
        }

        .breadcrumb-link {
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
        }

        .breadcrumb-link:hover {
          color: rgba(59, 130, 246, 0.9);
        }

        .breadcrumb-separator {
          color: rgba(255, 255, 255, 0.25);
          font-size: 1rem;
        }

        .breadcrumb-current {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
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

          .chapter-title {
            font-size: 1.125rem;
          }

          .hero-icon-container {
            width: 6.5rem;
            height: 6.5rem;
          }

          .action-card {
            padding: 2rem 1.5rem;
          }

          .action-icon-container {
            width: 6rem;
            height: 6rem;
          }

          .breadcrumb-card {
            padding: 0.875rem 1.25rem;
          }
        }
      `}</style>
    </>
  )
}
