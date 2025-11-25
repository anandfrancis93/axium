'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'
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

  // Handle text selection
  const handleSelection = useCallback(() => {
    if (!enabled) return

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
  }, [enabled])

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

    // Initial message asking for explanation
    const initialMessage = `Please explain this text in simple terms: "${selectedText}"${systemContext}`

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
        <div className="selection-chat-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 neuro-card flex flex-col max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="neuro-inset w-10 h-10 rounded-xl flex items-center justify-center">
                  <Sparkles size={18} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-200">AI Explanation</h3>
              </div>
              <button
                onClick={handleClose}
                className="neuro-btn p-2 text-gray-400 hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected Text */}
            <div className="mx-4 mt-4">
              <div className="neuro-inset p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Selected text:</p>
                <p className="text-sm text-gray-300 italic line-clamp-2">"{selectedText}"</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
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
            <div className="p-4 border-t border-gray-800">
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
