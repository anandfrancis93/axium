/**
 * Generate and store embeddings for all topics
 *
 * This is a ONE-TIME setup script that:
 * 1. Fetches all topics from the database
 * 2. Generates embeddings using OpenAI API (text-embedding-3-small)
 * 3. Stores embeddings back in the topics table
 *
 * Usage:
 *   node scripts/generate-topic-embeddings.mjs
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin access
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generateTopicEmbeddings() {
  console.log('🚀 Starting topic embedding generation...\n')

  // Fetch all topics
  const { data: topics, error: fetchError } = await supabase
    .from('topics')
    .select('id, name, full_name, description')
    .order('name')

  if (fetchError) {
    console.error('❌ Error fetching topics:', fetchError)
    process.exit(1)
  }

  console.log(`📊 Found ${topics.length} topics to process\n`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  // Process in batches to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize)

    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(topics.length / batchSize)}`)

    // Process batch concurrently
    const batchPromises = batch.map(async (topic) => {
      try {
        // Use full_name for better context (includes hierarchy)
        // Fallback to name if full_name doesn't exist
        const textToEmbed = topic.full_name || topic.name

        // Add description for richer context if available
        const embeddingText = topic.description
          ? `${textToEmbed}: ${topic.description}`
          : textToEmbed

        console.log(`  ⏳ Generating embedding for: ${textToEmbed}`)

        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: embeddingText,
        })

        const embedding = embeddingResponse.data[0].embedding

        // Store in database
        const { error: updateError } = await supabase
          .from('topics')
          .update({ embedding })
          .eq('id', topic.id)

        if (updateError) {
          console.error(`  ❌ Error updating ${topic.name}:`, updateError)
          errorCount++
        } else {
          console.log(`  ✅ Stored embedding for: ${topic.name}`)
          successCount++
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${topic.name}:`, error.message)
        errorCount++
      }
    })

    await Promise.all(batchPromises)

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < topics.length) {
      console.log('  ⏸️  Waiting 1s to respect rate limits...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📈 SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Successfully processed: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`⏭️  Skipped: ${skippedCount}`)
  console.log(`📊 Total topics: ${topics.length}`)
  console.log('='.repeat(60))

  if (successCount === topics.length) {
    console.log('\n🎉 All topic embeddings generated successfully!')
  } else if (errorCount > 0) {
    console.log('\n⚠️  Some embeddings failed. Review errors above.')
  }
}

// Run the script
generateTopicEmbeddings()
  .then(() => {
    console.log('\n✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
