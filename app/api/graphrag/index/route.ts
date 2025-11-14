/**
 * GraphRAG Indexing API
 *
 * POST /api/graphrag/index
 * Indexes a chapter to build the knowledge graph
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
    // Check if GraphRAG is enabled
    if (!features.graphRAG.enabled) {
      return NextResponse.json(
        { error: 'GraphRAG feature is not enabled' },
        { status: 403 }
      )
    }

    const { chapterId, mode = 'full' } = await request.json()

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

    // Note: Admin check removed for testing - any authenticated user can index
    // In production, you may want to add role-based access control

    // Initialize Neo4j schema (idempotent)
    await initializeNeo4jSchema()

    // Create indexing job
    const { data: job, error: jobError } = await supabase
      .from('graphrag_indexing_jobs')
      .insert({
        chapter_id: chapterId,
        status: 'pending',
        mode
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json(
        { error: 'Failed to create indexing job', details: jobError },
        { status: 500 }
      )
    }

    // Start indexing asynchronously (don't await)
    indexChapter(job.id, chapterId, mode).catch(error => {
      console.error('Indexing failed:', error)
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Indexing started. Check job status for progress.'
    })
  } catch (error: any) {
    console.error('GraphRAG indexing error:', error)
    return NextResponse.json(
      { error: 'Indexing failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Index a chapter (runs asynchronously)
 */
async function indexChapter(jobId: string, chapterId: string, mode: string) {
  const supabase = await createClient()

  try {
    // Update job status
    await supabase
      .from('graphrag_indexing_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Step 1: Fetch knowledge chunks for this chapter
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('id, content, topic_id')
      .eq('chapter_id', chapterId)

    if (chunksError) throw chunksError

    if (!chunks || chunks.length === 0) {
      throw new Error('No knowledge chunks found for this chapter')
    }

    console.log(`Found ${chunks.length} chunks for chapter ${chapterId}`)

    // Update total chunks
    await supabase
      .from('graphrag_indexing_jobs')
      .update({ total_chunks: chunks.length })
      .eq('id', jobId)

    // Step 2: Get chapter context
    const { data: chapter } = await supabase
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single()

    const topicContext = chapter?.name || ''

    // Step 3: Extract entities and relationships from chunks
    console.log('Extracting entities and relationships...')

    const extractionResults = await batchExtractEntities(
      chunks.map(c => ({ id: c.id, content: c.content })),
      chapterId,
      topicContext,
      5 // Batch size: 5 chunks at a time
    )

    // Merge results
    const mergedResults = mergeExtractionResults(
      Array.from(extractionResults.values())
    )

    console.log(
      `Extracted ${mergedResults.entities.length} entities, ${mergedResults.relationships.length} relationships`
    )

    await supabase
      .from('graphrag_indexing_jobs')
      .update({
        processed_chunks: chunks.length,
        entities_extracted: mergedResults.entities.length,
        relationships_extracted: mergedResults.relationships.length
      })
      .eq('id', jobId)

    // Step 4: Store in Neo4j + Supabase
    console.log('Storing graph data...')

    await storeGraphData(
      chapterId,
      mergedResults.entities,
      mergedResults.relationships,
      chunks.map(c => c.id)
    )

    // Step 5: Mark job as completed
    await supabase
      .from('graphrag_indexing_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)

    console.log(`GraphRAG indexing completed for chapter ${chapterId}`)
  } catch (error: any) {
    console.error('Indexing error:', error)

    // Mark job as failed
    await supabase
      .from('graphrag_indexing_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
}

/**
 * GET /api/graphrag/index?jobId=xxx
 * Get indexing job status
 */
export async function GET(request: NextRequest) {
  try {
    if (!features.graphRAG.enabled) {
      return NextResponse.json(
        { error: 'GraphRAG feature is not enabled' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const chapterId = searchParams.get('chapterId')

    const supabase = await createClient()

    if (jobId) {
      // Get specific job
      const { data, error } = await supabase
        .from('graphrag_indexing_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      return NextResponse.json({ job: data })
    }

    if (chapterId) {
      // Get latest job for chapter
      const { data, error } = await supabase
        .from('graphrag_indexing_jobs')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'No jobs found for this chapter' },
          { status: 404 }
        )
      }

      return NextResponse.json({ job: data })
    }

    // Get all jobs
    const { data, error } = await supabase
      .from('graphrag_indexing_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ jobs: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get job status', details: error.message },
      { status: 500 }
    )
  }
}
