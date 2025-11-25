'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, Sparkles, Loader2, GripHorizontal } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TextSelectionChatProps {
  enabled: boolean
  context?: {
    topicName?: string
    bloomLevel?: number
    questionText?: string
    explanation?: string
  }
}

export function TextSelectionChat({ enabled, context }: TextSelectionChatProps) {
  const [selectedText, setSelectedText] = useState('')
  const [showButton, setShowButton] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const [showModal, setShowModal] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Modal position and size state
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [modalSize, setModalSize] = useState({ width: 500, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Center modal on open
  useEffect(() => {
    if (showModal) {
      const x = (window.innerWidth - modalSize.width) / 2
      const y = (window.innerHeight - modalSize.height) / 2
      setModalPosition({ x: Math.max(0, x), y: Math.max(0, y) })
    }
  }, [showModal])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showModal])

  // Handle drag and resize
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        // Keep modal within viewport
        const maxX = window.innerWidth - modalSize.width
        const maxY = window.innerHeight - modalSize.height
        setModalPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        })
      } else if (isResizing) {
        const minWidth = 350
        const minHeight = 400
        const maxWidth = window.innerWidth - modalPosition.x
        const maxHeight = window.innerHeight - modalPosition.y

        if (isResizing.includes('e')) {
          const newWidth = Math.max(minWidth, Math.min(e.clientX - modalPosition.x, maxWidth))
          setModalSize(prev => ({ ...prev, width: newWidth }))
        }
        if (isResizing.includes('w')) {
          const deltaX = modalPosition.x - e.clientX
          const newWidth = Math.max(minWidth, modalSize.width + deltaX)
          if (newWidth > minWidth) {
            setModalPosition(prev => ({ ...prev, x: e.clientX }))
            setModalSize(prev => ({ ...prev, width: newWidth }))
          }
        }
        if (isResizing.includes('s')) {
          const newHeight = Math.max(minHeight, Math.min(e.clientY - modalPosition.y, maxHeight))
          setModalSize(prev => ({ ...prev, height: newHeight }))
        }
        if (isResizing.includes('n')) {
          const deltaY = modalPosition.y - e.clientY
          const newHeight = Math.max(minHeight, modalSize.height + deltaY)
          if (newHeight > minHeight) {
            setModalPosition(prev => ({ ...prev, y: e.clientY }))
            setModalSize(prev => ({ ...prev, height: newHeight }))
          }
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, modalPosition, modalSize])

  // Handle text selection
  const handleSelection = useCallback(() => {
    if (!enabled || showModal) return

    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 0 && text.length < 500) {
      const range = selection?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      if (rect) {
        setSelectedText(text)
        setButtonPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
        setShowButton(true)
      }
    } else {
      setShowButton(false)
    }
  }, [enabled, showModal])

  // Add selection listener
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('keyup', handleSelection)
    }
  }, [enabled, handleSelection])

  // Hide button when clicking elsewhere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.selection-chat-button') && !target.closest('.selection-chat-modal')) {
        setShowButton(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Start dragging
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y
    })
  }

  // Start resizing
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(direction)
  }

  // Open modal and start conversation
  const handleExplain = async () => {
    setShowButton(false)
    setShowModal(true)
    setMessages([])

    // Build context for the AI
    const contextParts = []
    if (context?.topicName) contextParts.push(`Topic: ${context.topicName}`)
    if (context?.bloomLevel) contextParts.push(`Bloom Level: ${context.bloomLevel}`)
    if (context?.questionText) contextParts.push(`Question: ${context.questionText}`)
    if (context?.explanation) contextParts.push(`Explanation provided: ${context.explanation}`)

    const systemContext = contextParts.length > 0
      ? `\n\nContext from the learning session:\n${contextParts.join('\n')}`
      : ''

    // Initial message asking for explanation using first principles
    const initialMessage = `Using first principles, explain this text: "${selectedText}"

Break it down to the fundamental concepts and build understanding from the ground up. Explain WHY it works, not just WHAT it is.${systemContext}`

    setMessages([{ role: 'user', content: `Explain: "${selectedText}"` }])
    setLoading(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: initialMessage,
          ephemeral: true // Signal this is not to be saved
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error getting explanation:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t get an explanation right now. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  // Send follow-up message
  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n')

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Previous conversation:\n${conversationHistory}\n\nUser's follow-up question: ${userMessage}`,
          ephemeral: true
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your message. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  // Close modal and clear chat
  const handleClose = () => {
    setShowModal(false)
    setMessages([])
    setSelectedText('')
    setInput('')
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!enabled) return null

  return (
    <>
      {/* Floating "Explain" button */}
      {showButton && (
        <button
          className="selection-chat-button neuro-btn fixed z-50 flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-400"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
          onClick={handleExplain}
        >
          <Sparkles size={14} />
          <span>Explain</span>
        </button>
      )}

      {/* Chat Modal */}
      {showModal && (
        <div className="selection-chat-modal fixed inset-0 z-50 pointer-events-none">
          {/* Backdrop - click to close */}
          <div
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onClick={handleClose}
          />

          {/* Modal */}
          <div
            ref={modalRef}
            className="neuro-card absolute flex flex-col overflow-hidden pointer-events-auto"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              width: `${modalSize.width}px`,
              height: `${modalSize.height}px`,
            }}
          >
            {/* Resize handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            <div
              className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
              className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />

            {/* Header - draggable */}
            <div
              className="flex items-center justify-between p-4 border-b border-gray-800 cursor-move select-none"
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-3">
                <div className="neuro-inset w-10 h-10 rounded-xl flex items-center justify-center">
                  <Sparkles size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-200">AI Explanation</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <GripHorizontal size={12} />
                    Drag to move, edges to resize
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                onMouseDown={(e) => e.stopPropagation()}
                className="neuro-btn p-2 text-gray-400 hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected Text */}
            <div className="mx-4 mt-4 flex-shrink-0">
              <div className="neuro-inset p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Selected text:</p>
                <p className="text-sm text-gray-300 italic line-clamp-2">"{selectedText}"</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-xl ${
                      message.role === 'user'
                        ? 'neuro-raised text-blue-400'
                        : 'neuro-inset text-gray-200'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="text-sm prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="neuro-inset text-gray-400 px-4 py-3 rounded-xl">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-800 flex-shrink-0">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up question..."
                  rows={1}
                  className="neuro-input flex-1 resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="neuro-btn px-4 text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Chat will not be saved when closed
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
