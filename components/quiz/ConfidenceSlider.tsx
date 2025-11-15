/**
 * ConfidenceSlider Component
 *
 * Allows users to rate their confidence in their answer (1-5 scale)
 */

'use client'

import { useState } from 'react'

interface ConfidenceSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const confidenceLevels = [
  { value: 1, label: 'Guessing', color: 'text-red-400', description: 'Complete guess' },
  { value: 2, label: 'Unsure', color: 'text-orange-400', description: 'Not confident' },
  { value: 3, label: 'Moderate', color: 'text-yellow-400', description: 'Somewhat confident' },
  { value: 4, label: 'Confident', color: 'text-blue-400', description: 'Pretty sure' },
  { value: 5, label: 'Certain', color: 'text-green-400', description: 'Absolutely sure' }
]

export function ConfidenceSlider({
  value,
  onChange,
  disabled = false
}: ConfidenceSliderProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)

  const currentLevel = confidenceLevels.find(l => l.value === (hoveredValue || value))

  return (
    <div className="neuro-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">
          How confident are you in your answer?
        </h3>
        {currentLevel && (
          <span className={`text-sm font-medium ${currentLevel.color}`}>
            {currentLevel.label}
          </span>
        )}
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseMove={(e) => {
            if (!disabled) {
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = (e.clientX - rect.left) / rect.width
              const hovered = Math.max(1, Math.min(5, Math.round(percent * 5)))
              setHoveredValue(hovered)
            }
          }}
          onMouseLeave={() => setHoveredValue(null)}
          disabled={disabled}
          className="w-full h-3 neuro-inset rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-gradient-to-br
                     [&::-webkit-slider-thumb]:from-blue-400
                     [&::-webkit-slider-thumb]:to-blue-500
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-all
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-gradient-to-br
                     [&::-moz-range-thumb]:from-blue-400
                     [&::-moz-range-thumb]:to-blue-500
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:shadow-lg
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:transition-all
                     [&::-moz-range-thumb]:hover:scale-110
                     disabled:opacity-50
                     disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right,
              ${getGradientColor(value)} 0%,
              ${getGradientColor(value)} ${(value - 1) * 25}%,
              rgba(55, 65, 81, 0.3) ${(value - 1) * 25}%,
              rgba(55, 65, 81, 0.3) 100%)`
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between px-1">
        {confidenceLevels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => !disabled && onChange(level.value)}
            onMouseEnter={() => !disabled && setHoveredValue(level.value)}
            onMouseLeave={() => setHoveredValue(null)}
            disabled={disabled}
            className={`
              text-xs transition-all
              ${value === level.value ? `${level.color} font-semibold` : 'text-gray-600'}
              ${hoveredValue === level.value ? 'scale-110' : ''}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
            `}
          >
            {level.value}
          </button>
        ))}
      </div>

      {/* Description */}
      {currentLevel && (
        <p className="text-center text-sm text-gray-500">
          {currentLevel.description}
        </p>
      )}

      {/* Calibration Tip */}
      <div className="neuro-inset p-3 rounded-lg">
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="text-blue-400 font-semibold">Tip:</span> Being honest about your confidence helps
          the system personalize your learning. If you're guessing, select 1 or 2!
        </p>
      </div>
    </div>
  )
}

function getGradientColor(value: number): string {
  const colors = [
    'rgba(239, 68, 68, 0.5)',   // red - 1
    'rgba(251, 146, 60, 0.5)',  // orange - 2
    'rgba(234, 179, 8, 0.5)',   // yellow - 3
    'rgba(59, 130, 246, 0.5)',  // blue - 4
    'rgba(34, 197, 94, 0.5)'    // green - 5
  ]
  return colors[value - 1] || colors[2]
}
