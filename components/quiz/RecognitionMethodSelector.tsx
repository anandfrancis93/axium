/**
 * RecognitionMethodSelector Component
 *
 * Captures HOW the user arrived at their answer (metacognition)
 */

'use client'

import { Brain, Eye, Lightbulb, Shuffle } from 'lucide-react'

export type RecognitionMethod = 'memory' | 'recognition' | 'educated_guess' | 'random_guess'

interface RecognitionMethodSelectorProps {
  value: RecognitionMethod
  onChange: (value: RecognitionMethod) => void
  disabled?: boolean
}

const recognitionMethods = [
  {
    value: 'memory' as RecognitionMethod,
    label: 'Recalled from Memory',
    description: 'I remembered this from studying',
    icon: Brain,
    color: 'text-purple-400'
  },
  {
    value: 'recognition' as RecognitionMethod,
    label: 'Recognized from Options',
    description: 'I recognized the correct answer when I saw it',
    icon: Eye,
    color: 'text-blue-400'
  },
  {
    value: 'educated_guess' as RecognitionMethod,
    label: 'Made an Educated Guess',
    description: 'I used logic/reasoning to narrow it down',
    icon: Lightbulb,
    color: 'text-yellow-400'
  },
  {
    value: 'random_guess' as RecognitionMethod,
    label: 'Made a Random Guess',
    description: 'I had no idea and guessed randomly',
    icon: Shuffle,
    color: 'text-red-400'
  }
]

export function RecognitionMethodSelector({
  value,
  onChange,
  disabled = false
}: RecognitionMethodSelectorProps) {
  return (
    <div className="neuro-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">
        How did you arrive at your answer?
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recognitionMethods.map((method) => {
          const Icon = method.icon
          const isSelected = value === method.value

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => !disabled && onChange(method.value)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg transition-all text-left
                ${isSelected
                  ? 'neuro-raised border-2 border-blue-400'
                  : 'neuro-inset hover:border-blue-400/30 border-2 border-transparent'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`neuro-inset w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? method.color : 'text-gray-500'}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className={`font-medium mb-1 ${isSelected ? method.color : 'text-gray-300'}`}>
                    {method.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {method.description}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="neuro-inset rounded-lg p-3 text-xs text-gray-500">
        <strong>💡 Why we ask:</strong> This helps us understand your learning process and provide better recommendations. Your honest answer improves the system!
      </div>
    </div>
  )
}
