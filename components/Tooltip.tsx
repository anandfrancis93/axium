'use client'

import { useState, useRef, ReactNode, useEffect } from 'react'

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mouseX, setMouseX] = useState(0)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = (clientX?: number) => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      // Use mouse X position if available, otherwise use element center
      const centerX = clientX || triggerRect.left + triggerRect.width / 2

      let top = triggerRect.top - tooltipRect.height - 8
      let left = centerX

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
      updatePosition(mouseX)
    }
  }, [isVisible, mouseX])

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMouseX(e.clientX)
    setIsVisible(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isVisible) {
      setMouseX(e.clientX)
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`cursor-help inline-block ${className}`}
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
          <div className={`neuro-raised px-3 py-2 rounded-lg text-xs text-gray-300 max-w-xs backdrop-blur-sm text-left ${typeof content === 'string' ? 'whitespace-pre-line' : ''}`}>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
