import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * POST /api/ai/gemini-live
 *
 * Processes audio input using Gemini API for voice-based AI explanations
 *
 * Body (FormData):
 * - audio: Audio blob (webm format)
 * - selectedText: Text that was selected for explanation
 * - fullContext: Full context of the question/content
 * - conversationHistory: JSON string of previous messages
 *
 * Returns:
 * - transcription: Transcribed text from audio
 * - response: AI generated response
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as Blob
    const selectedText = formData.get('selectedText') as string
    const fullContext = formData.get('fullContext') as string
    const conversationHistoryStr = formData.get('conversationHistory') as string

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const conversationHistory = conversationHistoryStr
      ? JSON.parse(conversationHistoryStr)
      : []

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey)

    // Step 1: Convert audio to base64 for API
    const audioBuffer = await audioBlob.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    // Step 2: Use Gemini to transcribe and understand the audio
    // Using Gemini 1.5 Flash with audio support
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // First, transcribe the audio
    const transcriptionPrompt = 'Transcribe this audio exactly as spoken. Only provide the transcription, nothing else.'
    const transcriptionResult = await model.generateContent([
      transcriptionPrompt,
      {
        inlineData: {
          mimeType: 'audio/webm',
          data: audioBase64,
        },
      },
    ])

    const transcription = transcriptionResult.response.text().trim()

    if (!transcription) {
      return NextResponse.json(
        { error: 'Could not transcribe audio' },
        { status: 400 }
      )
    }

    // Step 3: Generate context-aware response
    // Build conversation context
    let contextPrompt = `You are an AI tutor helping a student understand educational content.

Selected text the student is asking about:
"${selectedText}"
`

    if (fullContext) {
      contextPrompt += `\nFull context:\n${fullContext}\n`
    }

    if (conversationHistory.length > 0) {
      contextPrompt += '\nPrevious conversation:\n'
      conversationHistory.forEach((msg: any) => {
        contextPrompt += `${msg.role === 'user' ? 'Student' : 'AI Tutor'}: ${msg.content}\n`
      })
    }

    contextPrompt += `\nStudent's question (from voice): ${transcription}\n\nProvide a clear, educational explanation. Use markdown formatting and LaTeX for math equations when appropriate. For inline math use $...$ and for display math use $$...$$`

    const responseResult = await model.generateContent(contextPrompt)
    const response = responseResult.response.text()

    return NextResponse.json({
      transcription,
      response,
    })
  } catch (error) {
    console.error('Error in Gemini Live API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
