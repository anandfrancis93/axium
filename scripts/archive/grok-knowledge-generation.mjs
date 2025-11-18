#!/usr/bin/env node

/**
 * Generate comprehensive knowledge chunks using Grok AI
 * Creates detailed educational content for each Security+ topic
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const CHAPTER_ID = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Grok API (OpenAI-compatible)
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

async function generateDetailedContent(topicFullName, topicName) {
  console.log(`  Generating content for: ${topicFullName}`)

  const prompt = `You are a Security+ (SY0-701) certification expert instructor. Generate comprehensive study content for this topic:

Topic: ${topicFullName}

Create detailed educational content that includes:

1. **Clear Definition**: Explain what ${topicName} is in the context of cybersecurity
2. **Key Concepts**: List and explain the main concepts students must understand
3. **Real-World Applications**: Provide concrete examples of how this is used in practice
4. **Security Implications**: Explain why this matters for security professionals
5. **Common Exam Points**: What specific aspects are frequently tested on Security+ exam
6. **Best Practices**: What are the recommended approaches or standards

Write 300-500 words in clear, educational language. Focus on practical understanding, not just definitions. Make it exam-focused and actionable.

Do NOT mention the syllabus structure. Write as if teaching the actual concept.`

  try {
    const completion = await grok.chat.completions.create({
      model: 'grok-4-fast-reasoning',
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error(`    ❌ Error with Grok: ${error.message}`)
    // Fallback content
    return `${topicName}: A critical Security+ certification topic that covers important cybersecurity concepts and practices. Understanding this topic is essential for implementing effective security measures and passing the SY0-701 exam.`
  }
}

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

async function storeKnowledgeChunk(topicId, topicFullName, content, embedding) {
  // First, try to find existing chunk
  const { data: existing } = await supabase
    .from('knowledge_chunks')
    .select('id')
    .eq('chapter_id', CHAPTER_ID)
    .eq('topic_id', topicId)
    .eq('chunk_index', 0)
    .single()

  if (existing) {
    // Update existing chunk
    const { error } = await supabase
      .from('knowledge_chunks')
      .update({
        content: content,
        embedding: embedding,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)

    if (error) {
      console.error(`    ❌ Error updating chunk: ${error.message}`)
      return false
    }
  } else {
    // Insert new chunk
    const { error } = await supabase
      .from('knowledge_chunks')
      .insert({
        chapter_id: CHAPTER_ID,
        topic_id: topicId,
        content: content,
        embedding: embedding,
        chunk_index: 0
      })

    if (error) {
      console.error(`    ❌ Error inserting chunk: ${error.message}`)
      return false
    }
  }

  return true
}

async function main() {
  console.log('📚 Generating Detailed Knowledge Chunks with Grok')
  console.log('='.repeat(60))
  console.log()

  // Get all topics from database (only depth >= 2, skip domains and objectives)
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name, full_name, depth')
    .eq('chapter_id', CHAPTER_ID)
    .gte('depth', 2)  // Only ###, ####, #####, ###### (skip # and ##)
    .order('full_name')

  if (topicsError) {
    console.error('Error loading topics:', topicsError)
    process.exit(1)
  }

  console.log(`📊 Found ${topics.length} leaf topics to process (depth >= 2)`)
  console.log(`   Skipping domains (depth 0) and objectives (depth 1) - they provide context only`)
  console.log()

  // Check which topics already have chunks
  const { data: existingChunks } = await supabase
    .from('knowledge_chunks')
    .select('topic_id')
    .eq('chapter_id', CHAPTER_ID)

  const existingTopicIds = new Set(existingChunks?.map(c => c.topic_id) || [])
  const existingCount = existingTopicIds.size

  // Filter to ONLY process topics that DON'T have chunks yet
  const topicsToProcess = topics.filter(t => !existingTopicIds.has(t.id))
  const newCount = topicsToProcess.length

  console.log(`📊 Knowledge chunk status:`)
  console.log(`   - ${existingCount} topics already have chunks (skipping)`)
  console.log(`   - ${newCount} topics missing chunks (will create)`)
  console.log(`   - Total topics: ${topics.length}`)
  console.log()

  let processed = 0
  let succeeded = 0
  let failed = 0
  const batchSize = 10

  // Process topics in batches
  for (let i = 0; i < topicsToProcess.length; i += batchSize) {
    const batch = topicsToProcess.slice(i, i + batchSize)

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(topicsToProcess.length / batchSize)}...`)

    for (const topic of batch) {
      processed++

      try {
        // Generate detailed content using Grok
        const content = await generateDetailedContent(topic.full_name, topic.name)

        // Generate new embedding
        const embedding = await generateEmbedding(content)

        // Update in database (upsert)
        const success = await storeKnowledgeChunk(
          topic.id,
          topic.full_name,
          content,
          embedding
        )

        if (success) {
          succeeded++
          console.log(`    ✓ ${topic.full_name}`)
        } else {
          failed++
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        failed++
        console.error(`    ❌ Failed: ${topic.full_name} - ${error.message}`)

        // If rate limited, wait longer
        if (error.message?.includes('rate') || error.message?.includes('429')) {
          console.log('  ⏸️  Rate limited, waiting 60 seconds...')
          await new Promise(resolve => setTimeout(resolve, 60000))
        }
      }
    }

    // Delay between batches
    if (i + batchSize < topicsToProcess.length) {
      console.log('  Waiting 5 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('✅ Upgrade Complete!')
  console.log()
  console.log(`📊 Summary:`)
  console.log(`   Topics to upgrade: ${topicsToProcess.length}`)
  console.log(`   Processed: ${processed}`)
  console.log(`   Succeeded: ${succeeded}`)
  console.log(`   Failed: ${failed}`)
  console.log()
  console.log('📋 Next steps:')
  console.log('   1. Go to /admin')
  console.log('   2. Generate questions - they will now have real content!')
  console.log('   3. Questions will test actual Security+ knowledge, not syllabus structure')
}

main().catch(console.error)
