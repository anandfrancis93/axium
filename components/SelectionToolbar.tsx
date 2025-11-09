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
  return (
    <div
      className="fixed z-50 animate-in fade-in duration-200"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <button
        onClick={onExplain}
        className="neuro-btn text-blue-400 px-3 py-2 flex items-center gap-2 text-sm whitespace-nowrap shadow-lg"
      >
        <SparklesIcon size={16} />
        Explain with AI
      </button>
    </div>
  )
}
