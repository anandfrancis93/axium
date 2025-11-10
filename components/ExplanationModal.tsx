'use client'

import { XIcon } from '@/components/icons'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  explanation: string | null
  loading: boolean
  fullContext?: string
}

/**
 * Modal that displays AI explanation of selected text with chat interface
 * Draggable so users can move it to see content behind it
 */
export default function ExplanationModal({
  isOpen,
  onClose,
  selectedText,
  explanation,
  loading,
  fullContext,
}: ExplanationModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  // Initialize messages when explanation is loaded
  useEffect(() => {
    if (explanation && messages.length === 0) {
      setMessages([{ role: 'assistant', content: explanation }])
    }
  }, [explanation])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setInput('')
      setIsSending(false)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header, not from buttons or input fields
    if (
      e.target instanceof HTMLElement &&
      (e.target.tagName === 'INPUT' ||
       e.target.tagName === 'BUTTON' ||
       e.target.closest('button'))
    ) {
      return
    }

    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep modal within viewport bounds
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect()
        const maxX = window.innerWidth - rect.width
        const maxY = window.innerHeight - rect.height

        setPosition({
          x: Math.max(-rect.width / 2, Math.min(maxX / 2, newX)),
          y: Math.max(-rect.height / 2, Math.min(maxY / 2, newY)),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return

    const userMessage = input.trim()
    setInput('')
    setIsSending(true)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          fullContext,
          conversationHistory: messages,
          userQuestion: userMessage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.explanation }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="neuro-card max-w-3xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Draggable area */}
        <div
          className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700 flex-shrink-0 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-xl font-semibold text-gray-200 select-none">AI Explanation</h2>
          <button
            onClick={onClose}
            className="neuro-btn p-2 text-gray-400 hover:text-gray-200"
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Selected Text */}
        <div className="neuro-inset p-4 rounded-lg mb-4 flex-shrink-0">
          <div className="text-sm text-gray-500 mb-2">Selected text:</div>
          <div className="text-gray-300 italic">&ldquo;{selectedText}&rdquo;</div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <div className="text-gray-400">Generating explanation...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No explanation available
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={idx}
                className={`${
                  message.role === 'user'
                    ? 'neuro-raised bg-blue-500/10 ml-8'
                    : 'neuro-inset mr-8'
                } p-4 rounded-lg`}
              >
                <div className="text-xs text-gray-500 mb-2">
                  {message.role === 'user' ? 'You' : 'AI Tutor'}
                </div>
                <div className="text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none [&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded-lg [&_a]:text-blue-400 [&_a]:no-underline hover:[&_a]:underline [&_.katex]:text-gray-200">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="neuro-inset mr-8 p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-2">AI Tutor</div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        {!loading && (
          <div className="flex-shrink-0 pt-4 border-t border-gray-700">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a follow-up question..."
                disabled={isSending}
                className="neuro-input flex-1 px-4 py-3 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isSending}
                className="neuro-btn text-blue-400 px-6 py-3 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
