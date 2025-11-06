import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function extractAndMigrateTopics() {
  console.log('Fetching knowledge chunks...')

  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('chapter_id', chapterId)

  if (error || !chunks) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${chunks.length} chunks\n`)

  // Extract all topics (clean names without parenthetical context)
  const topicsSet = new Set()

  chunks.forEach(chunk => {
    const content = chunk.content

    // Extract topics from "From X.X (Topic Name):" pattern
    const topicMatches = content.matchAll(/From \d+\.\d+ \(([^)]+)\):/g)
    for (const match of topicMatches) {
      topicsSet.add(match[1])
    }

    // Extract individual terms (clean term names, removing parenthetical context)
    const lines = content.split('\n')
    lines.forEach(line => {
      line = line.trim()
      // Skip headers and short lines
      if (line.startsWith('Domain') || line.startsWith('From') || line.length < 3) return

      // Extract terms that end with (...) but keep only the term part
      const termMatches = line.matchAll(/^([^(]+)\s*\([^)]+\)$/g)
      for (const match of termMatches) {
        const term = match[1].trim()
        if (term.length > 2 && term.length < 100) {
          topicsSet.add(term)
        }
      }
    })
  })

  const topics = Array.from(topicsSet).sort()
  console.log(`✓ Extracted ${topics.length} unique clean topics\n`)

  // Clear existing topics for this chapter
  console.log('Clearing existing topics...')
  const { error: deleteError } = await supabase
    .from('topics')
    .delete()
    .eq('chapter_id', chapterId)

  if (deleteError) {
    console.error('Error deleting:', deleteError.message)
    return
  }
  console.log('✓ Cleared\n')

  // Insert all topics
  console.log(`Inserting ${topics.length} topics...`)

  const topicsToInsert = topics.map((name, index) => ({
    chapter_id: chapterId,
    name,
    sequence_order: index,
    available_bloom_levels: [1, 2, 3, 4, 5, 6]
  }))

  // Insert in batches
  const batchSize = 100
  let totalInserted = 0

  for (let i = 0; i < topicsToInsert.length; i += batchSize) {
    const batch = topicsToInsert.slice(i, i + batchSize)
    const { data: insertedData, error: insertError } = await supabase
      .from('topics')
      .insert(batch)
      .select()

    if (insertError) {
      console.error(`Error batch ${Math.floor(i / batchSize) + 1}:`, insertError.message)
    } else {
      totalInserted += insertedData.length
      console.log(`✓ Batch ${Math.floor(i / batchSize) + 1}: ${insertedData.length} records (total: ${totalInserted})`)
    }
  }

  console.log(`\n✅ COMPLETE! Inserted ${totalInserted} topics`)
  console.log('\nFirst 20 topics:')
  topics.slice(0, 20).forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  console.log(`  ...\n  ${topics.length}. ${topics[topics.length - 1]}`)
}

extractAndMigrateTopics().catch(console.error)
