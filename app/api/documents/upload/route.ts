import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Dynamic import for pdf-parse (CommonJS module)
async function parsePDF(buffer: Buffer) {
  const pdf = (await import('pdf-parse')).default
  return await pdf(buffer)
}

// Chunk text into smaller pieces for embeddings
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)

  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk) {
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
    const file = formData.get('file') as File
    const chapterId = formData.get('chapter_id') as string

    if (!file || !chapterId) {
      return NextResponse.json(
        { error: 'File and chapter_id are required' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse PDF
    console.log('Parsing PDF...')
    const pdfData = await parsePDF(buffer)
    const text = pdfData.text

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from PDF' },
        { status: 400 }
      )
    }

    console.log(`Extracted ${text.length} characters from PDF`)

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
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunks[i],
        })

        const embedding = embeddingResponse.data[0].embedding

        // Store in database
        const { error: insertError } = await supabase
          .from('knowledge_chunks')
          .insert({
            chapter_id: chapterId,
            content: chunks[i],
            embedding: JSON.stringify(embedding), // pgvector will handle the conversion
            source_file_name: file.name,
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
      file_name: file.name,
    })
  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
