import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAPICall } from '@/lib/utils/api-logger'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Extract text from PDF using pdfjs-dist (serverless-friendly)
async function parsePDF(buffer: Buffer): Promise<{ text: string }> {
  // Dynamic import to avoid build issues
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const data = new Uint8Array(buffer)
  const pdf = await pdfjsLib.getDocument({ data }).promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n\n'
  }

  return { text: fullText }
}

// Chunk text into smaller pieces for embeddings
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = []

  // Split on double newlines first (paragraphs)
  let paragraphs = text.split(/\n\n+/)

  // If we only got 1 paragraph, try splitting on single newlines
  if (paragraphs.length === 1) {
    paragraphs = text.split(/\n+/)
  }

  let currentChunk = ''

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim()
    if (!trimmedParagraph) continue // Skip empty lines

    if ((currentChunk + trimmedParagraph).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = trimmedParagraph
    } else {
      currentChunk += (currentChunk ? '\n' : '') + trimmedParagraph
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter(chunk => chunk.length > 50) // Filter out very small chunks
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const textInput = formData.get('text') as string | null
    const chapterId = formData.get('chapter_id') as string

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapter_id is required' },
        { status: 400 }
      )
    }

    if (!file && !textInput) {
      return NextResponse.json(
        { error: 'Either file or text is required' },
        { status: 400 }
      )
    }

    let text: string

    // Process based on input type
    if (textInput) {
      console.log('Using text input...')
      text = textInput
    } else if (file) {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer())

      // Parse PDF
      console.log('Parsing PDF...')
      const pdfData = await parsePDF(buffer)
      text = pdfData.text
    } else {
      return NextResponse.json(
        { error: 'No content provided' },
        { status: 400 }
      )
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content provided' },
        { status: 400 }
      )
    }

    console.log(`Processing ${text.length} characters`)

    // Chunk the text
    console.log('Chunking text...')
    const chunks = chunkText(text, 1000)
    console.log(`Created ${chunks.length} chunks`)

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No valid chunks could be created from the text' },
        { status: 400 }
      )
    }

    // Generate embeddings and store chunks
    console.log('Generating embeddings and storing chunks...')
    let successCount = 0

    for (let i = 0; i < chunks.length; i++) {
      try {
        // Generate embedding
        const embeddingStartTime = Date.now()
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunks[i],
        })

        const embedding = embeddingResponse.data[0].embedding

        // Log embedding API call
        await logAPICall({
          userId: user.id,
          provider: 'openai',
          model: 'text-embedding-3-small',
          endpoint: '/api/documents/upload',
          inputTokens: embeddingResponse.usage?.prompt_tokens || 0,
          outputTokens: 0,
          latencyMs: Date.now() - embeddingStartTime,
          purpose: 'document_embedding',
          metadata: {
            chapter_id: chapterId,
            chunk_index: i,
            total_chunks: chunks.length,
            file_name: file?.name || 'text_input'
          }
        })

        // Store in database
        const { error: insertError } = await supabase
          .from('knowledge_chunks')
          .insert({
            chapter_id: chapterId,
            content: chunks[i],
            embedding: embedding, // pgvector expects array directly
            source_file_name: file?.name || 'text_input',
            page_number: null,
            chunk_index: i,
          })

        if (insertError) {
          console.error(`Error inserting chunk ${i}:`, insertError)
        } else {
          successCount++
        }

        // Log progress every 10 chunks
        if ((i + 1) % 10 === 0) {
          console.log(`Processed ${i + 1}/${chunks.length} chunks`)
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error)
      }
    }

    console.log(`Successfully stored ${successCount}/${chunks.length} chunks`)

    return NextResponse.json({
      success: true,
      chunks_created: successCount,
      total_chunks: chunks.length,
      source: file?.name || 'text_input',
    })
  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
