'use client'

import { useState, useRef, ReactNode, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      let top = triggerRect.top - tooltipRect.height - 8
      let left = triggerRect.left + triggerRect.width / 2

      // If tooltip goes off top, show below
      if (top < 8) {
        top = triggerRect.bottom + 8
      }

      // If tooltip goes off left
      if (left - tooltipRect.width / 2 < 8) {
        left = tooltipRect.width / 2 + 8
      }

      // If tooltip goes off right
      if (left + tooltipRect.width / 2 > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width / 2 - 8
      }

      setPosition({ top, left })
    }
  }

  useEffect(() => {
    if (isVisible) {
      updatePosition()
    }
  }, [isVisible])

  const handleMouseEnter = () => {
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`cursor-help ${className}`}
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, 0)'
          }}
        >
          <div className="neuro-raised px-3 py-2 rounded-lg text-xs text-gray-300 whitespace-pre-line max-w-xs backdrop-blur-sm">
            {content}
          </div>
        </div>
      )}
    </>
  )
}
