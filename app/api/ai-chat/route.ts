
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize xAI client
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
})

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

    // Fetch previous messages for context (limit to last 10 for now)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(10) // Simple context window

    // Prepare messages for xAI
    const messages = (history || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    // Call xAI
    const completion = await xai.chat.completions.create({
      model: 'grok-beta', // Using grok-beta as it's generally available on xAI API
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for the Axium learning platform. You help students with their questions about various subjects.'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Save AI response
    const { error: aiMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant',
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

  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
