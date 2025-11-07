'use client'

import { ReactNode } from 'react'
import { XIcon, AlertTriangleIcon, CheckIcon } from './icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  type?: 'warning' | 'success' | 'info'
  actions?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'danger' | 'secondary'
  }[]
}

export default function Modal({ isOpen, onClose, title, children, type = 'info', actions }: ModalProps) {
  if (!isOpen) return null

  const iconColors = {
    warning: 'text-red-400',
    success: 'text-green-400',
    info: 'text-blue-400'
  }

  const icons = {
    warning: <AlertTriangleIcon size={32} className={iconColors.warning} />,
    success: <CheckIcon size={32} className={iconColors.success} />,
    info: <CheckIcon size={32} className={iconColors.info} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="neuro-card max-w-lg w-full relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 neuro-btn p-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <XIcon size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="neuro-inset w-16 h-16 rounded-2xl flex items-center justify-center">
            {icons[type]}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-200 text-center mb-6">
          {title}
        </h2>

        {/* Content */}
        <div className="text-gray-300 mb-8">
          {children}
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex gap-3 justify-end">
            {actions.map((action, idx) => {
              const variantClasses = {
                primary: 'text-blue-400 hover:text-blue-300',
                danger: 'text-red-400 hover:text-red-300',
                secondary: 'text-gray-400 hover:text-gray-300'
              }

              return (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`neuro-btn px-6 py-3 font-medium transition-colors ${variantClasses[action.variant || 'secondary']}`}
                >
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
