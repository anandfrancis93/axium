import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

/**
 * POST /api/ai/explain
 *
 * Generate AI explanation for selected text
 *
 * Body:
 * - selectedText: The text user wants explained
 * - fullContext: (optional) The full explanation text for context
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

    const body = await request.json()
    const { selectedText, fullContext } = body

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

    const prompt = `You are a helpful tutor explaining concepts to a student.

The student selected this text and wants it explained in simpler terms:
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

    const completion = await grok.chat.completions.create({
      model: 'grok-2-1212',
      messages: [
        { role: 'system', content: 'You are a helpful tutor who explains concepts clearly and simply.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const explanation = completion.choices[0]?.message?.content || 'Sorry, I could not generate an explanation.'

    return NextResponse.json({
      explanation: explanation.trim()
    })

  } catch (error) {
    console.error('Error in POST /api/ai/explain:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
