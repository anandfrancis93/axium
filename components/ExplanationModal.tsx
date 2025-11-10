'use client'

import { XIcon, MicrophoneIcon } from '@/components/icons'
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

  // Resizable state
  const [size, setSize] = useState({ width: 768, height: 600 }) // Default size
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 })
  const [resizeDirection, setResizeDirection] = useState<'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 's' | 'n' | null>(null)

  // Gemini Live voice state
  const [isRecording, setIsRecording] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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
      setSize({ width: 768, height: 600 })
    }
  }, [isOpen])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't drag if resizing
    if (isResizing) return

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

  // Resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent, direction: typeof resizeDirection) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    })
  }

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizeDirection || !modalRef.current) return

      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      const rect = modalRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = resizeStart.posX
      let newY = resizeStart.posY

      // Calculate new dimensions based on resize direction
      if (resizeDirection.includes('e')) {
        // Resize from right edge - constrain to viewport
        const maxWidth = viewportWidth - rect.left - 50
        newWidth = Math.max(400, Math.min(maxWidth, resizeStart.width + deltaX))
      }
      if (resizeDirection.includes('w')) {
        // Resize from left edge - constrain position and size
        const proposedWidth = resizeStart.width - deltaX
        const maxWidth = rect.right - 50
        newWidth = Math.max(400, Math.min(maxWidth, proposedWidth))
        const widthDiff = resizeStart.width - newWidth
        newX = resizeStart.posX + widthDiff
      }
      if (resizeDirection.includes('s')) {
        // Resize from bottom edge - constrain to viewport
        const maxHeight = viewportHeight - rect.top - 50
        newHeight = Math.max(400, Math.min(maxHeight, resizeStart.height + deltaY))
      }
      if (resizeDirection.includes('n')) {
        // Resize from top edge - constrain position and size
        const proposedHeight = resizeStart.height - deltaY
        const maxHeight = rect.bottom - 50
        newHeight = Math.max(400, Math.min(maxHeight, proposedHeight))
        const heightDiff = resizeStart.height - newHeight
        newY = resizeStart.posY + heightDiff
      }

      setSize({ width: newWidth, height: newHeight })
      if (newX !== resizeStart.posX || newY !== resizeStart.posY) {
        setPosition({ x: newX, y: newY })
      }
    }

    const handleResizeUp = () => {
      setIsResizing(false)
      setResizeDirection(null)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeUp)
    }
  }, [isResizing, resizeDirection, resizeStart, position, size])

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

  const handleVoiceToggle = async () => {
    console.log('Voice toggle clicked, isRecording:', isRecording)

    if (isRecording) {
      // Stop recording and signal turn completion to Gemini
      console.log('Stopping recording...')
      setIsRecording(false)
      setVoiceState('thinking')

      // Send turn completion signal to Gemini
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('📤 Sending turn completion signal to Gemini...')
        wsRef.current.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: []
          },
          turnComplete: true
        }))
      }

      // Cleanup audio processing
      if (mediaRecorderRef.current) {
        const { stream, audioContext, processor, source } = mediaRecorderRef.current as any
        if (processor) processor.disconnect()
        if (source) source.disconnect()
        if (audioContext) audioContext.close()
        if (stream) stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
        mediaRecorderRef.current = null
      }

      // Don't close WebSocket yet - wait for Gemini's response
    } else {
      // Start continuous conversation with Gemini Live API
      console.log('Starting Gemini Live...')
      try {
        setIsConnecting(true)
        setShowVoiceOverlay(true)

        // Connect to Gemini Live API WebSocket
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
        console.log('API Key available:', !!apiKey)
        console.log('API Key prefix:', apiKey?.substring(0, 10))

        if (!apiKey) {
          console.error('GEMINI_API_KEY not configured')
          alert('Gemini API Key not configured. Please restart your dev server after setting NEXT_PUBLIC_GEMINI_API_KEY in .env.local')
          setIsConnecting(false)
          setShowVoiceOverlay(false)
          return
        }

        const ws = new WebSocket(
          `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`
        )

        wsRef.current = ws
        console.log('WebSocket created, connecting...')

        ws.onopen = async () => {
          console.log('✓ WebSocket connected successfully')

          // Send setup message
          const systemPrompt = `You are an AI tutor helping a student understand educational content.

Selected text the student is asking about:
"${selectedText}"

${fullContext ? `Full context:\n${fullContext}\n` : ''}

${messages.length > 0 ? `Previous conversation:\n${messages.map(m => `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`).join('\n')}\n` : ''}

Provide clear, educational explanations. Keep responses concise and conversational for voice interaction.`

          console.log('Sending setup message...')
          ws.send(JSON.stringify({
            setup: {
              model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
              generationConfig: {
                responseModalities: 'audio',
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: 'Aoede'
                    }
                  }
                }
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              }
            }
          }))
          console.log('✓ Setup message sent')
        }

        ws.onmessage = async (event) => {
          // Handle both string and Blob data
          let data = event.data
          if (data instanceof Blob) {
            data = await data.text()
          }

          const response = JSON.parse(data)
          console.log('📨 WebSocket message:', JSON.stringify(response, null, 2))

          // Setup complete
          if (response.setupComplete) {
            console.log('✓ Setup complete, starting audio stream')
            setVoiceState('listening')
            setIsConnecting(false)
            setIsRecording(true)

            // Start capturing and streaming audio
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                channelCount: 1,
                sampleRate: 16000,
              }
            })

            // Use AudioContext to convert to 16kHz PCM
            const audioContext = new AudioContext({ sampleRate: 16000 })
            const source = audioContext.createMediaStreamSource(stream)
            const processor = audioContext.createScriptProcessor(4096, 1, 1)

            source.connect(processor)
            processor.connect(audioContext.destination)

            let chunkCount = 0
            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN) return

              const inputData = e.inputBuffer.getChannelData(0)

              // Convert Float32 to Int16 PCM
              const pcmData = new Int16Array(inputData.length)
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]))
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
              }

              // Convert to base64
              const base64Audio = btoa(
                String.fromCharCode(...new Uint8Array(pcmData.buffer))
              )

              // Send to Gemini
              chunkCount++
              if (chunkCount % 50 === 0) {
                console.log(`🎤 Sent ${chunkCount} audio chunks (${inputData.length} samples each)`)
              }

              ws.send(JSON.stringify({
                realtimeInput: {
                  mediaChunks: [{
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Audio
                  }]
                }
              }))
            }

            // Store for cleanup
            mediaRecorderRef.current = { stream, audioContext, processor, source } as any
          }

          // Handle server audio/text response
          if (response.serverContent?.modelTurn?.parts) {
            console.log('🤖 Gemini is responding!')
            setVoiceState('speaking')

            for (const part of response.serverContent.modelTurn.parts) {
              // Handle text response
              if (part.text) {
                console.log('💬 Text response:', part.text)
                setMessages(prev => {
                  // Append to last assistant message or create new one
                  const last = prev[prev.length - 1]
                  if (last && last.role === 'assistant') {
                    return [...prev.slice(0, -1), { ...last, content: last.content + part.text }]
                  }
                  return [...prev, { role: 'assistant', content: part.text }]
                })
              }

              // Handle audio response
              if (part.inlineData?.mimeType?.includes('audio') && part.inlineData.data) {
                console.log('🔊 Audio response received, playing...')
                // Play audio response
                playAudioResponse(part.inlineData.data)
              }
            }

            // Hide overlay and close connection after response
            setTimeout(() => {
              console.log('✅ Response complete, closing overlay')
              setShowVoiceOverlay(false)
              setVoiceState('idle')
              if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
              }
            }, 1500)
          } else if (response.serverContent) {
            console.log('⚠️ Received serverContent but no modelTurn:', response.serverContent)
          }
        }

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          setIsRecording(false)
          setVoiceState('idle')
          setShowVoiceOverlay(false)
          setIsConnecting(false)
          // Show error message after overlay closes
          setTimeout(() => {
            alert('Voice connection failed. Please check:\n1. Your internet connection\n2. That NEXT_PUBLIC_GEMINI_API_KEY is set in Vercel\n3. Browser console for details')
          }, 100)
        }

        ws.onclose = (event) => {
          console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason)
          if (event.code !== 1000) {
            // Abnormal closure
            console.error('Abnormal WebSocket closure:', event.code, event.reason)
          }
          setIsRecording(false)
          setVoiceState('idle')
          setShowVoiceOverlay(false)
          setIsConnecting(false)
        }

      } catch (error) {
        console.error('❌ Error starting Gemini Live:', error)
        setIsConnecting(false)
        setShowVoiceOverlay(false)
        setVoiceState('idle')
        alert('Failed to start voice: ' + (error as Error).message)
      }
    }
  }

  // Play audio response from Gemini
  const playAudioResponse = (base64Audio: string) => {
    try {
      // Decode base64 to PCM
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Convert PCM to playable audio
      const audioContext = new AudioContext({ sampleRate: 24000 })
      const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, 24000)
      const channelData = audioBuffer.getChannelData(0)

      const pcmData = new Int16Array(bytes.buffer)
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7FFF)
      }

      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.start()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="neuro-card flex flex-col animate-in zoom-in-95 duration-200 relative"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : isResizing ? 'grabbing' : 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resize Handles */}
        {/* Corner handles - visible indicators */}
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-400/30 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-400/30 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-400/30 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-400/30 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          style={{ zIndex: 10 }}
        />
        {/* Edge handles - invisible but functional */}
        <div
          className="absolute top-0 left-3 right-3 h-1 cursor-n-resize hover:bg-blue-400/20 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize hover:bg-blue-400/20 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute top-3 bottom-3 left-0 w-1 cursor-w-resize hover:bg-blue-400/20 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute top-3 bottom-3 right-0 w-1 cursor-e-resize hover:bg-blue-400/20 transition-colors"
          onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          style={{ zIndex: 10 }}
        />
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
                    remarkPlugins={[
                      remarkGfm,
                      remarkMath
                    ]}
                    rehypePlugins={[
                      [rehypeKatex, {
                        strict: false,
                        trust: true,
                        output: 'htmlAndMathml'
                      }]
                    ]}
                  >
                    {
                      (() => {
                        let content = message.content

                        // Convert \[ \] and \( \) delimiters to $$ $$
                        content = content
                          .replace(/\\\[/g, '\n$$\n')
                          .replace(/\\\]/g, '\n$$\n')
                          .replace(/\\\(/g, '$')
                          .replace(/\\\)/g, '$')

                        // Escape dollar amounts so they're not treated as math
                        // Match $NUMBER patterns (dollar amounts like $1000, $1,000.99, etc.)
                        // Add backslash to escape them from being interpreted as math
                        content = content.replace(/\$(\d{1,3}(,\d{3})*(\.\d{2})?|\d+(\.\d{2})?)/g, '\\$$$1')

                        return content
                      })()
                    }
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
                disabled={isSending || isRecording}
                className="neuro-input flex-1 px-4 py-3 disabled:opacity-50"
              />
              <button
                onClick={handleVoiceToggle}
                disabled={isSending || isConnecting}
                className={`neuro-btn px-4 py-3 disabled:opacity-50 transition-colors ${
                  isRecording ? 'text-red-400 animate-pulse' : 'text-gray-400'
                }`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                <MicrophoneIcon size={20} />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isSending || isRecording}
                className="neuro-btn text-blue-400 px-6 py-3 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Voice Interaction Overlay */}
        {showVoiceOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 rounded-lg">
            {/* Close button - always visible */}
            <button
              onClick={() => {
                // Send turn completion if recording
                if (isRecording && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  console.log('📤 Sending turn completion signal (close button)...')
                  wsRef.current.send(JSON.stringify({
                    realtimeInput: {
                      mediaChunks: []
                    },
                    turnComplete: true
                  }))
                }

                setShowVoiceOverlay(false)
                setVoiceState('idle')
                setIsRecording(false)
                setIsConnecting(false)

                // Cleanup audio processing
                if (mediaRecorderRef.current) {
                  const { stream, audioContext, processor, source } = mediaRecorderRef.current as any
                  if (processor) processor.disconnect()
                  if (source) source.disconnect()
                  if (audioContext) audioContext.close()
                  if (stream) stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
                  mediaRecorderRef.current = null
                }

                // Close WebSocket after a short delay to allow response
                setTimeout(() => {
                  if (wsRef.current) {
                    wsRef.current.close()
                    wsRef.current = null
                  }
                }, 5000)
              }}
              className="absolute top-4 right-4 neuro-btn p-2 text-gray-400 hover:text-red-400 z-10"
              aria-label="Close voice interaction"
            >
              <XIcon size={24} />
            </button>

            <div className="flex flex-col items-center gap-6">
              {/* Animated Microphone Visual */}
              <div className="relative">
                {/* Pulsing rings for listening state */}
                {voiceState === 'listening' && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                  </>
                )}

                {/* Thinking spinner */}
                {voiceState === 'thinking' && (
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 border-t-blue-400 animate-spin" />
                )}

                {/* Speaking pulse */}
                {voiceState === 'speaking' && (
                  <div className="absolute inset-0 rounded-full bg-green-400/30 animate-pulse" />
                )}

                {/* Microphone Icon */}
                <div className={`neuro-raised w-24 h-24 rounded-full flex items-center justify-center ${
                  voiceState === 'listening' ? 'bg-blue-500/20' :
                  voiceState === 'thinking' ? 'bg-yellow-500/20' :
                  voiceState === 'speaking' ? 'bg-green-500/20' :
                  'bg-gray-500/20'
                }`}>
                  <MicrophoneIcon
                    size={48}
                    className={
                      voiceState === 'listening' ? 'text-blue-400' :
                      voiceState === 'thinking' ? 'text-yellow-400' :
                      voiceState === 'speaking' ? 'text-green-400' :
                      'text-gray-400'
                    }
                  />
                </div>
              </div>

              {/* State Text */}
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-200 mb-2">
                  {voiceState === 'listening' && 'Listening...'}
                  {voiceState === 'thinking' && 'Thinking...'}
                  {voiceState === 'speaking' && 'Response Ready'}
                </div>
                <div className="text-sm text-gray-400">
                  {voiceState === 'listening' && 'Speak your question'}
                  {voiceState === 'thinking' && 'Processing your question'}
                  {voiceState === 'speaking' && 'Check the chat below'}
                </div>
              </div>

              {/* Action Button */}
              {voiceState === 'listening' && (
                <button
                  onClick={handleVoiceToggle}
                  className="neuro-btn text-red-400 px-8 py-3 text-lg"
                >
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
