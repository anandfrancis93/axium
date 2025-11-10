import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/ai/explain
 *
 * Generate AI explanation for selected text with chat support
 *
 * Body:
 * - selectedText: The text user wants explained
 * - fullContext: (optional) The full explanation text for context
 * - conversationHistory: (optional) Array of previous messages
 * - userQuestion: (optional) Follow-up question from user
 *
 * Returns:
 * - explanation: AI-generated explanation in simple terms
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Anthropic client with API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('API Key check:', {
      exists: !!apiKey,
      length: apiKey?.length,
      firstChars: apiKey?.substring(0, 10)
    })

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    const body = await request.json()
    const { selectedText, fullContext, conversationHistory, userQuestion } = body

    if (!selectedText || selectedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'selectedText is required' },
        { status: 400 }
      )
    }

    // Limit selected text length to prevent abuse
    if (selectedText.length > 500) {
      return NextResponse.json(
        { error: 'Selected text is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Build messages array for conversation (Claude format)
    const systemPrompt = `Provide clear, well-structured responses.
Use bullet points and numbered lists when explaining steps, options, or technical details.
Do not add labels, headers, or prefixes like "Explanation:" or "Simple Explanation:". Start directly with the explanation.`

    const messages: Array<{ role: 'user' | 'assistant', content: string }> = []

    // If this is a follow-up question, include conversation history
    if (userQuestion && conversationHistory && conversationHistory.length > 0) {
      // Add initial context
      messages.push({
        role: 'user',
        content: `The student selected this text: "${selectedText}"${fullContext ? `\n\nFull context:\n${fullContext.substring(0, 1000)}` : ''}`
      })

      // Add conversation history
      conversationHistory.forEach((msg: { role: 'user' | 'assistant', content: string }) => {
        messages.push(msg)
      })

      // Add new question
      messages.push({
        role: 'user',
        content: userQuestion
      })
    } else {
      // Initial explanation request
      const prompt = `The student selected this text and wants it explained in simpler terms:
"${selectedText}"

${fullContext ? `\nFull context:\n${fullContext.substring(0, 1000)}` : ''}

TASK: Explain the selected text in a clear, concise way that a beginner can understand.

GUIDELINES:
1. Start with a simple definition or core concept
2. Use analogies or examples if helpful
3. Break down technical terms
4. Keep it concise (3-5 sentences max)
5. Be encouraging and educational
6. Don't repeat the selected text verbatim

Provide the explanation now:`

      messages.push({ role: 'user', content: prompt })
    }

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    })

    const explanation = completion.content[0]?.type === 'text'
      ? completion.content[0].text
      : 'Sorry, I could not generate an explanation.'

    return NextResponse.json({
      explanation: explanation.trim()
    })

  } catch (error) {
    console.error('Error in POST /api/ai/explain:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
