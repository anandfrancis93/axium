'use client'

import { X } from 'lucide-react'

interface ExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  explanation: string | null
  loading: boolean
}

/**
 * Modal that displays AI explanation of selected text
 */
export default function ExplanationModal({
  isOpen,
  onClose,
  selectedText,
  explanation,
  loading,
}: ExplanationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="neuro-card max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-200">AI Explanation</h2>
          <button
            onClick={onClose}
            className="neuro-btn p-2 text-gray-400 hover:text-gray-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Text */}
        <div className="neuro-inset p-4 rounded-lg mb-4">
          <div className="text-sm text-gray-500 mb-2">Selected text:</div>
          <div className="text-gray-300 italic">&ldquo;{selectedText}&rdquo;</div>
        </div>

        {/* Explanation */}
        <div className="neuro-raised p-6 rounded-lg">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <div className="text-gray-400">Generating explanation...</div>
            </div>
          ) : explanation ? (
            <div className="text-gray-300 whitespace-pre-line leading-relaxed">
              {explanation}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No explanation available
            </div>
          )}
        </div>

        {/* Close Button */}
        {!loading && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="neuro-btn text-blue-400 px-6 py-3"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
