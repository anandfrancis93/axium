'use client'

import { SparklesIcon } from '@/components/icons'

interface SelectionToolbarProps {
  x: number
  y: number
  onExplain: () => void
}

/**
 * Floating toolbar that appears when text is selected
 */
export default function SelectionToolbar({ x, y, onExplain }: SelectionToolbarProps) {
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Adjust position to stay within viewport bounds
  const adjustedY = isMobile ? y : Math.max(60, y) // On mobile, use original Y (below selection)
  const adjustedX = Math.max(80, Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 80 : x))

  return (
    <div
      className="fixed z-50 animate-in fade-in duration-200"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        // On mobile: translate horizontally centered, no vertical offset (already positioned below)
        // On desktop: translate horizontally centered, position above selection
        transform: isMobile ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      <button
        onClick={onExplain}
        className="neuro-btn text-blue-400 px-3 py-2 flex items-center gap-2 text-sm whitespace-nowrap shadow-lg touch-manipulation"
      >
        <SparklesIcon size={16} />
        Explain with AI
      </button>
    </div>
  )
}
