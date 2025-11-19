'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  MessageSquareIcon, 
  TrashIcon, 
  PlusIcon, 
  ArrowRightIcon, 
  UserIcon, 
  SparklesIcon,
  MicrophoneIcon
} from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Session {
  id: string
  title: string
  updated_at: string
}

export default function AIChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai-chat/history')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const selectSession = async (id: string) => {
    try {
      setLoading(true)
      setCurrentSessionId(id)
      const res = await fetch(`/api/ai-chat/session/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this chat?')) return

    try {
      const res = await fetch(`/api/ai-chat/session/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id))
        if (currentSessionId === id) {
          startNewChat()
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const startNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    setInput('')
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          sessionId: currentSessionId
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        
        // Update session ID if it was a new chat
        if (!currentSessionId) {
          setCurrentSessionId(data.sessionId)
          fetchHistory() // Refresh list to show new title
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not connect to server.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col h-screen">
      {/* Header */}
      <header className="neuro-card rounded-none border-b border-white/5 py-4 px-6 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="neuro-inset w-10 h-10 rounded-xl flex items-center justify-center text-blue-400">
            <SparklesIcon size={20} />
          </div>
          <h1 className="text-xl font-bold text-blue-400">AI Tutor</h1>
        </div>
        <HamburgerMenu />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (History) - Hidden on small screens, visible on md+ */}
        <aside className="hidden md:flex flex-col w-80 border-r border-white/5 bg-[#0a0a0a] shrink-0">
          <div className="p-4">
            <button 
              onClick={startNewChat}
              className="neuro-btn w-full flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition-all"
            >
              <PlusIcon size={18} />
              <span>New Chat</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-custom">
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`neuro-card p-3 cursor-pointer group flex justify-between items-center transition-all ${
                  currentSessionId === session.id 
                    ? 'border-l-2 border-blue-400 bg-white/5' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquareIcon size={16} className="text-gray-500 shrink-0" />
                  <span className="text-sm truncate">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete chat"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-[#0a0a0a] relative">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-custom">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4 opacity-50">
                <div className="neuro-inset w-20 h-20 rounded-full flex items-center justify-center">
                  <SparklesIcon size={40} className="text-blue-400" />
                </div>
                <p className="text-lg">How can I help you learn today?</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="neuro-inset w-8 h-8 rounded-full flex items-center justify-center shrink-0 h-fit mt-1">
                      <SparklesIcon size={16} className="text-blue-400" />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed prose prose-invert prose-sm max-w-none break-words [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>li]:marker:text-gray-400 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600/10 text-blue-100 rounded-tr-none border border-blue-500/20' 
                        : 'neuro-raised rounded-tl-none'
                    }`}
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" />,
                        p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                        ul: ({node, ...props}) => <ul {...props} className="mb-2 last:mb-0 list-disc list-outside ml-4" />,
                        ol: ({node, ...props}) => <ol {...props} className="mb-2 last:mb-0 list-decimal list-outside ml-4" />,
                        li: ({node, ...props}) => <li {...props} className="mb-1" />,
                        strong: ({node, ...props}) => <strong {...props} className="font-bold text-white" />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {msg.role === 'user' && (
                    <div className="neuro-inset w-8 h-8 rounded-full flex items-center justify-center shrink-0 h-fit mt-1">
                      <UserIcon size={16} className="text-gray-400" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="neuro-inset w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  <SparklesIcon size={16} className="text-blue-400 animate-pulse" />
                </div>
                <div className="neuro-raised px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5 bg-[#0a0a0a] shrink-0 relative">
            {isLiveMode && (
              <div className="absolute bottom-full left-0 w-full bg-red-500/10 backdrop-blur-md border-t border-red-500/20 p-2 flex items-center justify-center gap-2 text-red-400 text-sm animate-slide-up">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Gemini Live Active (Listening...)
              </div>
            )}
            
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLiveMode(!isLiveMode)}
                className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isLiveMode 
                    ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                    : 'neuro-btn text-gray-400 hover:text-gray-200'
                }`}
                title={isLiveMode ? "Stop Live Mode" : "Start Gemini Live"}
              >
                <MicrophoneIcon size={20} />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLiveMode ? "Listening..." : "Type a message..."}
                className="neuro-input w-full pr-12 py-4 pl-6 rounded-full focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || isLiveMode}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || isLiveMode}
                className="absolute right-2 p-2 neuro-btn rounded-full text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightIcon size={20} />
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  )
}
