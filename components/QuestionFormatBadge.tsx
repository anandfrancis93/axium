'use client'

import { getQuestionFormatInfo, type QuestionFormat } from '@/lib/utils/question-format'

interface QuestionFormatBadgeProps {
  format: QuestionFormat | string | null | undefined
  showIcon?: boolean
  showDescription?: boolean
  className?: string
}

export function QuestionFormatBadge({
  format,
  showIcon = true,
  showDescription = false,
  className = ''
}: QuestionFormatBadgeProps) {
  const formatInfo = getQuestionFormatInfo(format as QuestionFormat)

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && (
        <span className={`text-lg ${formatInfo.color}`}>
          {formatInfo.icon}
        </span>
      )}
      <div>
        <div className={`font-medium text-sm ${formatInfo.color}`}>
          {formatInfo.name}
        </div>
        {showDescription && (
          <div className="text-xs text-gray-500 mt-1">
            {formatInfo.description}
          </div>
        )}
      </div>
    </div>
  )
}

interface QuestionFormatIndicatorProps {
  format: QuestionFormat | string | null | undefined
  bloomLevel?: number
}

export function QuestionFormatIndicator({ format, bloomLevel }: QuestionFormatIndicatorProps) {
  const formatInfo = getQuestionFormatInfo(format as QuestionFormat)
  const isIdeal = bloomLevel ? formatInfo.idealBloomLevels.includes(bloomLevel) : false

  return (
    <div
      className="neuro-inset px-3 py-2 rounded-lg cursor-help inline-block"
      title={formatInfo.description}
    >
      <div className="flex items-center gap-2">
        <span className={`text-base ${formatInfo.color}`}>
          {formatInfo.icon}
        </span>
        <div>
          <div className="text-xs text-gray-500">Format</div>
          <div className={`text-sm font-medium ${formatInfo.color}`}>
            {formatInfo.name}
          </div>
          {isIdeal && (
            <div className="text-xs text-green-400 mt-1">
              Ideal for this level
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FormatComplexityBadgeProps {
  complexity: 'low' | 'medium' | 'high'
}

export function FormatComplexityBadge({ complexity }: FormatComplexityBadgeProps) {
  const colors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400'
  }

  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  }

  return (
    <span className={`text-xs ${colors[complexity]} font-medium`}>
      {labels[complexity]}
    </span>
  )
}
