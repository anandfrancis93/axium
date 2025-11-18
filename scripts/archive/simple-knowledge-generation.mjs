#!/usr/bin/env node

/**
 * Generate simple knowledge chunks from topics
 * Creates basic educational content for each topic without external APIs
 */

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

function generateBasicContent(topicFullName, topicName) {
  // Generate basic educational content from the topic hierarchy
  const parts = topicFullName.split(' > ')
  const domain = parts[0] || ''
  const section = parts[1] || ''
  const subsection = parts[2] || ''

  let content = `# ${topicName}\n\n`

  content += `This topic is part of the Security+ (SY0-701) certification under ${domain}.`

  if (section) {
    content += ` It specifically relates to ${section}.`
  }

  content += `\n\n## Key Concepts\n\n`
  content += `${topicName} is an important concept in cybersecurity that candidates need to understand for the Security+ exam. `
  content += `This topic covers essential knowledge required for information security professionals.\n\n`

  content += `## Exam Relevance\n\n`
  content += `Understanding ${topicName} is critical for:`
  content += `\n- Identifying security risks and vulnerabilities`
  content += `\n- Implementing appropriate security controls`
  content += `\n- Following industry best practices`
  content += `\n- Meeting compliance requirements\n\n`

  content += `## Context\n\n`
  content += `Within the broader domain of ${domain}, ${topicName} plays a key role in establishing comprehensive security measures. `
  content += `Security professionals must be familiar with this topic to effectively protect organizational assets and data.`

  return content
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
      chunk_index: 0
    })

  if (error) {
    console.error(`    ❌ Error storing chunk: ${error.message}`)
    return false
  }

  return true
}

async function main() {
  console.log('📚 Generating Basic Knowledge Chunks')
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

  let processed = 0
  let succeeded = 0
  let failed = 0
  const batchSize = 20 // OpenAI embedding API is more generous

  // Process topics in batches
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize)

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(topics.length / batchSize)}...`)

    for (const topic of batch) {
      processed++

      try {
        // Generate basic content
        const content = generateBasicContent(topic.full_name, topic.name)

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
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        failed++
        console.error(`    ❌ Failed: ${topic.full_name} - ${error.message}`)

        // If rate limited, wait longer
        if (error.message?.includes('rate')) {
          console.log('  ⏸️  Rate limited, waiting 60 seconds...')
          await new Promise(resolve => setTimeout(resolve, 60000))
        }
      }
    }

    // Delay between batches
    if (i + batchSize < topics.length) {
      console.log('  Waiting 2 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 2000))
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
  console.log('   3. Generate questions - they will now find knowledge chunks!')
}

main().catch(console.error)
