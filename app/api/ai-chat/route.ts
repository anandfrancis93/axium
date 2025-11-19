
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message, sessionId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let currentSessionId = sessionId

    // Create new session if not provided
    if (!currentSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single()

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`)
      }
      currentSessionId = session.id
    }

    // Save user message
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: message
      })

    if (userMsgError) {
      throw new Error(`Failed to save user message: ${userMsgError.message}`)
    }

    // Fetch previous messages for context (limit to last 20 for reasonable context)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Prepare history for Gemini
    // Exclude the very last message we just inserted (it will be sent as the new message)
    // Filter out the current message from history if it was returned (depends on timing/consistency, safer to just filter by content or take all except last if it matches)
    // Actually, simpler: We just inserted it. We should send it as the `sendMessage` argument.
    // So history should be everything *before* this new message.
    // Since we just inserted it, we can fetch everything and pop the last one, or just exclude it.
    
    // Let's format the history correctly
    const geminiHistory = (history || [])
      .filter((msg: any) => msg.content !== message) // Simple dedup for the current message
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' })
    
    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
      systemInstruction: 'You are a helpful AI assistant for the Axium learning platform. You help students with their questions about various subjects.'
    })

    const result = await chat.sendMessage(message)
    const aiResponse = result.response.text() || 'Sorry, I could not generate a response.'

    // Save AI response
    const { error: aiMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant', // Store as 'assistant' for internal consistency
        content: aiResponse
      })

    if (aiMsgError) {
      throw new Error(`Failed to save AI response: ${aiMsgError.message}`)
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: currentSessionId
    })

  } catch (error: any) {
    console.error('Error in AI chat:', error)
    // Log deep details if available
    if (error.code) console.error('Error Code:', error.code)
    if (error.details) console.error('Error Details:', error.details)
    if (error.hint) console.error('Error Hint:', error.hint)

    return NextResponse.json(
      { 
        error: 'Failed to process chat', 
        details: error.message || 'Unknown error',
        code: error.code,
        dbDetails: error.details,
        hint: error.hint
      },
      { status: 500 }
    )
  }
}
