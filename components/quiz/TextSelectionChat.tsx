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

  // Use refs for smooth dragging/resizing (no re-renders during movement)
  const positionRef = useRef({ x: 0, y: 0 })
  const sizeRef = useRef({ width: 500, height: 600 })
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef<string | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const initialPosRef = useRef({ x: 0, y: 0 })
  const initialSizeRef = useRef({ width: 0, height: 0 })

  // Center modal on open
  useEffect(() => {
    if (showModal && modalRef.current) {
      const x = (window.innerWidth - sizeRef.current.width) / 2
      const y = (window.innerHeight - sizeRef.current.height) / 2
      positionRef.current = { x: Math.max(0, x), y: Math.max(0, y) }
      modalRef.current.style.left = `${positionRef.current.x}px`
      modalRef.current.style.top = `${positionRef.current.y}px`
      modalRef.current.style.width = `${sizeRef.current.width}px`
      modalRef.current.style.height = `${sizeRef.current.height}px`
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

  // Handle drag and resize with direct DOM manipulation for smoothness
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!modalRef.current) return

      if (isDraggingRef.current) {
        const newX = e.clientX - dragStartRef.current.x
        const newY = e.clientY - dragStartRef.current.y

        // Keep modal within viewport
        const maxX = window.innerWidth - sizeRef.current.width
        const maxY = window.innerHeight - sizeRef.current.height

        positionRef.current = {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        }

        // Direct DOM update - no React re-render
        modalRef.current.style.left = `${positionRef.current.x}px`
        modalRef.current.style.top = `${positionRef.current.y}px`
      } else if (isResizingRef.current) {
        const minWidth = 350
        const minHeight = 400
        const direction = isResizingRef.current

        let newWidth = sizeRef.current.width
        let newHeight = sizeRef.current.height
        let newX = positionRef.current.x
        let newY = positionRef.current.y

        if (direction.includes('e')) {
          newWidth = Math.max(minWidth, e.clientX - initialPosRef.current.x)
        }
        if (direction.includes('w')) {
          const deltaX = e.clientX - dragStartRef.current.x
          const potentialWidth = initialSizeRef.current.width - deltaX
          if (potentialWidth >= minWidth) {
            newWidth = potentialWidth
            newX = initialPosRef.current.x + deltaX
          }
        }
        if (direction.includes('s')) {
          newHeight = Math.max(minHeight, e.clientY - initialPosRef.current.y)
        }
        if (direction.includes('n')) {
          const deltaY = e.clientY - dragStartRef.current.y
          const potentialHeight = initialSizeRef.current.height - deltaY
          if (potentialHeight >= minHeight) {
            newHeight = potentialHeight
            newY = initialPosRef.current.y + deltaY
          }
        }

        // Clamp to viewport
        newWidth = Math.min(newWidth, window.innerWidth - newX)
        newHeight = Math.min(newHeight, window.innerHeight - newY)

        sizeRef.current = { width: newWidth, height: newHeight }
        positionRef.current = { x: newX, y: newY }

        // Direct DOM update - no React re-render
        modalRef.current.style.width = `${newWidth}px`
        modalRef.current.style.height = `${newHeight}px`
        modalRef.current.style.left = `${newX}px`
        modalRef.current.style.top = `${newY}px`
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      isResizingRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

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
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y
    }
    document.body.style.cursor = 'move'
    document.body.style.userSelect = 'none'
  }

  // Start resizing
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    isResizingRef.current = direction
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    initialPosRef.current = { ...positionRef.current }
    initialSizeRef.current = { ...sizeRef.current }

    // Set cursor based on direction
    const cursorMap: Record<string, string> = {
      'n': 'n-resize', 's': 's-resize', 'e': 'e-resize', 'w': 'w-resize',
      'ne': 'ne-resize', 'nw': 'nw-resize', 'se': 'se-resize', 'sw': 'sw-resize'
    }
    document.body.style.cursor = cursorMap[direction] || 'default'
    document.body.style.userSelect = 'none'
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
              willChange: 'left, top, width, height',
            }}
          >
            {/* Resize handles */}
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            <div
              className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
              className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-10"
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
