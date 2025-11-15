#!/usr/bin/env node

/**
 * Generate knowledge chunks from the Security+ syllabus
 *
 * This script:
 * 1. Reads the syllabus markdown file
 * 2. For each topic, generates descriptive content using Claude
 * 3. Creates embeddings using OpenAI
 * 4. Stores in knowledge_chunks table
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { readFileSync } from 'fs'

const CHAPTER_ID = '0517450a-61b2-4fa2-a425-5846b21ba4b0'
const SYLLABUS_FILE = 'security-plus-syllabus.md'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generateTopicContent(topicFullName, topicName) {
  console.log(`  Generating content for: ${topicFullName}`)

  const prompt = `You are a Security+ (SY0-701) subject matter expert. Generate comprehensive study content for the following topic.

Topic: ${topicFullName}

Provide a detailed explanation that covers:
1. Definition and key concepts
2. Important details and subconcepts
3. Real-world examples or use cases
4. Common exam points

Keep it concise but comprehensive (200-400 words). Write in an educational, clear style suitable for certification exam preparation.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = message.content[0].text
    return content
  } catch (error) {
    console.error(`    ❌ Error generating content: ${error.message}`)
    // Fallback to basic content
    return `${topicFullName}: This topic covers important concepts related to ${topicName}. Understanding this topic is essential for the Security+ certification exam.`
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
  const { error } = await supabase
    .from('knowledge_chunks')
    .insert({
      chapter_id: CHAPTER_ID,
      topic_id: topicId,
      content: content,
      embedding: embedding,
      chunk_index: 0,
      metadata: {
        source: 'syllabus_generation',
        topic_name: topicFullName,
        generated_at: new Date().toISOString()
      }
    })

  if (error) {
    console.error(`    ❌ Error storing chunk: ${error.message}`)
    return false
  }

  return true
}

async function main() {
  console.log('📚 Generating Knowledge Chunks from Syllabus')
  console.log('='.repeat(60))
  console.log()

  // Get all topics from database
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name, full_name, depth')
    .eq('chapter_id', CHAPTER_ID)
    .order('full_name')

  if (topicsError) {
    console.error('Error loading topics:', topicsError)
    process.exit(1)
  }

  console.log(`📊 Found ${topics.length} topics to process`)
  console.log()

  // Check for existing chunks
  const { count: existingCount } = await supabase
    .from('knowledge_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', CHAPTER_ID)

  if (existingCount > 0) {
    console.log(`⚠️  Warning: ${existingCount} chunks already exist for this chapter`)
    console.log('   Proceeding will add more chunks (duplicates possible)')
    console.log()
  }

  let processed = 0
  let succeeded = 0
  let failed = 0
  const batchSize = 10

  // Process topics in batches to respect rate limits
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize)

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(topics.length / batchSize)}...`)

    for (const topic of batch) {
      processed++

      try {
        // Generate content using Claude
        const content = await generateTopicContent(topic.full_name, topic.name)

        // Generate embedding using OpenAI
        const embedding = await generateEmbedding(content)

        // Store in database
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

        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        failed++
        console.error(`    ❌ Failed: ${topic.full_name} - ${error.message}`)
      }
    }

    // Longer delay between batches
    if (i + batchSize < topics.length) {
      console.log('  Waiting 5 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('✅ Generation Complete!')
  console.log()
  console.log(`📊 Summary:`)
  console.log(`   Total topics: ${topics.length}`)
  console.log(`   Processed: ${processed}`)
  console.log(`   Succeeded: ${succeeded}`)
  console.log(`   Failed: ${failed}`)
  console.log()
  console.log('📋 Next steps:')
  console.log('   1. Go to /admin')
  console.log('   2. Select Security+ chapter')
  console.log('   3. Generate questions - they will now use the knowledge chunks!')
}

main().catch(console.error)
