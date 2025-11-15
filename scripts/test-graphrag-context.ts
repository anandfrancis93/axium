/**
 * Test Script: Verify GraphRAG Context Usage in Question Generation
 *
 * This script tests that questions are generated with proper GraphRAG context
 * after fixing the summary -> context_summary bug.
 *
 * Usage: npx tsx scripts/test-graphrag-context.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface TestResult {
  step: string
  status: 'PASS' | 'FAIL' | 'INFO'
  message: string
  data?: any
}

const results: TestResult[] = []

function log(step: string, status: 'PASS' | 'FAIL' | 'INFO', message: string, data?: any) {
  results.push({ step, status, message, data })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️'
  console.log(`${icon} ${step}: ${message}`)
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2))
  }
}

async function testGraphRAGContext() {
  console.log('\n=== GraphRAG Context Test ===\n')

  // Step 1: Check if GraphRAG entity exists for "Resource reuse"
  console.log('Step 1: Checking GraphRAG entity...')
  const { data: entity, error: entityError } = await supabase
    .from('graphrag_entities')
    .select('id, name, type, context_summary, full_path')
    .eq('name', 'Resource reuse')
    .limit(1)
    .single()

  if (entityError || !entity) {
    log('GraphRAG Entity', 'FAIL', 'Resource reuse entity not found in graphrag_entities', entityError)
    return
  }

  log('GraphRAG Entity', 'PASS', `Found entity: ${entity.name}`, {
    id: entity.id,
    type: entity.type,
    path: entity.full_path,
    context_length: entity.context_summary?.length || 0,
    context_preview: entity.context_summary?.substring(0, 100) + '...'
  })

  // Step 2: Get the topic_id from topics table
  console.log('\nStep 2: Finding topic ID...')
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id, name')
    .eq('name', 'Resource reuse')
    .limit(1)
    .single()

  if (topicError || !topic) {
    log('Topic Lookup', 'FAIL', 'Resource reuse topic not found in topics table', topicError)
    return
  }

  log('Topic Lookup', 'PASS', `Found topic: ${topic.name} (${topic.id})`)

  // Step 3: Check if any questions exist with RAG context
  console.log('\nStep 3: Checking for questions with RAG context...')
  const { data: questionsWithContext, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_text, rag_context, created_at')
    .eq('topic_id', topic.id)
    .eq('source_type', 'ai_generated_realtime')
    .not('rag_context', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (questionsError) {
    log('Questions Check', 'FAIL', 'Error querying questions', questionsError)
    return
  }

  if (!questionsWithContext || questionsWithContext.length === 0) {
    log('Questions Check', 'INFO', 'No questions with RAG context found yet (expected if fresh deployment)')
  } else {
    log('Questions Check', 'PASS', `Found ${questionsWithContext.length} questions with RAG context`, {
      sample: questionsWithContext[0] ? {
        id: questionsWithContext[0].id,
        question_preview: questionsWithContext[0].question_text.substring(0, 80) + '...',
        context_length: questionsWithContext[0].rag_context?.length || 0,
        context_preview: questionsWithContext[0].rag_context?.substring(0, 100) + '...',
        created_at: questionsWithContext[0].created_at
      } : null
    })
  }

  // Step 4: Test the getGraphRAGContext flow manually
  console.log('\nStep 4: Simulating getGraphRAGContext() function...')

  // Simulate what the API does
  const { data: contextTest, error: contextError } = await supabase
    .from('graphrag_entities')
    .select('name, type, description, context_summary, full_path')
    .eq('name', 'Resource reuse')
    .limit(1)
    .single()

  if (contextError || !contextTest) {
    log('Context Retrieval', 'FAIL', 'Failed to retrieve context as API would', contextError)
    return
  }

  if (contextTest.context_summary) {
    log('Context Retrieval', 'PASS', 'Successfully retrieved context_summary', {
      context_length: contextTest.context_summary.length,
      context: contextTest.context_summary
    })
  } else {
    log('Context Retrieval', 'FAIL', 'context_summary is null or empty')
  }

  // Step 5: Check prerequisite paths (fallback option)
  console.log('\nStep 5: Checking prerequisite paths...')
  const { data: prerequisites, error: prereqError } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('path_names, path_summaries')
    .eq('target_entity_id', entity.id)
    .limit(3)

  if (!prereqError && prerequisites && prerequisites.length > 0) {
    log('Prerequisite Paths', 'PASS', `Found ${prerequisites.length} prerequisite paths`, {
      sample: prerequisites[0]
    })
  } else {
    log('Prerequisite Paths', 'INFO', 'No prerequisite paths found (not critical)')
  }

  // Step 6: Summary
  console.log('\n=== Test Summary ===\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const info = results.filter(r => r.status === 'INFO').length

  console.log(`Total Steps: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`ℹ️  Info: ${info}`)

  if (failed === 0) {
    console.log('\n🎉 All critical tests passed! GraphRAG context is properly configured.')
    console.log('\nNext step: Generate a new question for "Resource reuse" and verify rag_context is populated.')
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.')
  }

  // Return exit code based on failures
  process.exit(failed > 0 ? 1 : 0)
}

// Run the test
testGraphRAGContext().catch(error => {
  console.error('\n❌ Test script crashed:', error)
  process.exit(1)
})
