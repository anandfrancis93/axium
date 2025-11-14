/**
 * GraphRAG Test Indexing API (Small Sample)
 *
 * POST /api/graphrag/index-test
 * Indexes only the FIRST 10 chunks from a chapter for quick testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { features } from '@/lib/config/features'
import {
  batchExtractEntities,
  mergeExtractionResults
} from '@/lib/graphrag/entity-extraction'
import { storeGraphData } from '@/lib/graphrag/graph-storage'
import { initializeNeo4jSchema } from '@/lib/neo4j/client'

export async function POST(request: NextRequest) {
  try {
    if (!features.graphRAG.enabled) {
      return NextResponse.json(
        { error: 'GraphRAG feature is not enabled' },
        { status: 403 }
      )
    }

    const { chapterId } = await request.json()

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting TEST indexing for chapter:', chapterId)

    // Initialize Neo4j schema
    await initializeNeo4jSchema()

    // Fetch ONLY FIRST 10 chunks for testing
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('id, content, topic_id')
      .eq('chapter_id', chapterId)
      .order('chunk_index')
      .limit(10) // ← LIMIT TO 10 CHUNKS FOR TESTING

    if (chunksError) throw chunksError

    if (!chunks || chunks.length === 0) {
      throw new Error('No knowledge chunks found for this chapter')
    }

    console.log(`Found ${chunks.length} chunks for TEST indexing`)

    // Get chapter context
    const { data: chapter } = await supabase
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single()

    const topicContext = chapter?.name || ''

    // Extract entities and relationships
    console.log('Extracting entities and relationships from TEST chunks...')

    const extractionResults = await batchExtractEntities(
      chunks.map(c => ({ id: c.id, content: c.content })),
      chapterId,
      topicContext,
      5 // Batch size
    )

    // Merge results
    const mergedResults = mergeExtractionResults(
      Array.from(extractionResults.values())
    )

    console.log(
      `Extracted ${mergedResults.entities.length} entities, ${mergedResults.relationships.length} relationships (TEST)`
    )

    // Store in Neo4j + Supabase
    console.log('Storing TEST graph data...')

    const stored = await storeGraphData(
      chapterId,
      mergedResults.entities,
      mergedResults.relationships,
      chunks.map(c => c.id)
    )

    console.log(`TEST indexing completed for chapter ${chapterId}`)

    return NextResponse.json({
      success: true,
      message: 'Test indexing completed successfully',
      stats: {
        chunks_processed: chunks.length,
        entities_extracted: mergedResults.entities.length,
        relationships_extracted: mergedResults.relationships.length,
        entities_stored: stored.entities.length,
        relationships_stored: stored.relationships.length
      }
    })
  } catch (error: any) {
    console.error('Test indexing error:', error)
    return NextResponse.json(
      { error: 'Test indexing failed', details: error.message },
      { status: 500 }
    )
  }
}
