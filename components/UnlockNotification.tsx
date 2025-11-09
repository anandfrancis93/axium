'use client'

import { useEffect, useState } from 'react'

export interface UnlockInfo {
  topic_name: string
  topic_full_name: string
  unlocked_level: number
}

interface UnlockNotificationProps {
  unlocks: UnlockInfo[]
  onClose: () => void
}

const BLOOM_LEVEL_NAMES: Record<number, string> = {
  2: 'Understand',
  3: 'Apply',
  4: 'Analyze',
  5: 'Evaluate',
  6: 'Create'
}

const BLOOM_LEVEL_COLORS: Record<number, string> = {
  2: 'from-blue-500 to-cyan-500',
  3: 'from-cyan-500 to-green-500',
  4: 'from-green-500 to-yellow-500',
  5: 'from-yellow-500 to-orange-500',
  6: 'from-orange-500 to-purple-500'
}

export default function UnlockNotification({ unlocks, onClose }: UnlockNotificationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // Wait for fade-out animation
    }, 10000)

    return () => clearTimeout(timer)
  }, [onClose])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (unlocks.length === 0) return null

  return (
    <div
      className={`fixed top-20 right-6 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="neuro-card max-w-md">
        {unlocks.map((unlock, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-4 pt-4 border-t border-gray-800' : ''}>
            <div className="flex items-start gap-4">
              {/* Trophy Icon with Gradient */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                  BLOOM_LEVEL_COLORS[unlock.unlocked_level]
                } shadow-lg`}
              >
                <span className="text-2xl">🏆</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-green-400 mb-1">
                  🎉 Level Unlocked!
                </div>
                <div className="text-gray-200 font-medium mb-1">
                  {unlock.topic_name}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {unlock.topic_full_name}
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r ${
                    BLOOM_LEVEL_COLORS[unlock.unlocked_level]
                  } text-white text-sm font-semibold`}
                >
                  <span>Bloom Level {unlock.unlocked_level}:</span>
                  <span>{BLOOM_LEVEL_NAMES[unlock.unlocked_level]}</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Achievement Message */}
            <div className="mt-3 text-xs text-gray-400 bg-gray-900/50 p-3 rounded-lg">
              You achieved 80%+ mastery with 3+ correct answers at Level{' '}
              {unlock.unlocked_level - 1}. Keep going!
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
