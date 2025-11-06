import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function extractExactTopics() {
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

  // Extract topics EXACTLY as they appear in knowledge chunks
  // Format: "Topic name (context)" from lines like:
  // Technical (control category)
  // 802.1X (port security)

  const topicsSet = new Set()

  chunks.forEach(chunk => {
    const lines = chunk.content.split('\n')

    lines.forEach(line => {
      line = line.trim()

      // Skip domain headers and "From X.X" headers
      if (line.startsWith('Domain') || line.startsWith('From') || line.length < 3) return

      // Match lines that have format: "Something (context)"
      // This captures the FULL line including parentheses
      const match = line.match(/^(.+\s*\([^)]+\))$/)
      if (match) {
        const fullTopic = match[1].trim()
        if (fullTopic.length > 2 && fullTopic.length < 150) {
          topicsSet.add(fullTopic)
        }
      }
    })
  })

  const topics = Array.from(topicsSet).sort()
  console.log(`✓ Extracted ${topics.length} topics WITH context\n`)

  console.log('Sample topics (first 20):')
  topics.slice(0, 20).forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  // Clear existing topics
  console.log('\n\nClearing existing topics...')
  const { error: deleteError } = await supabase
    .from('topics')
    .delete()
    .eq('chapter_id', chapterId)

  if (deleteError) {
    console.error('Error deleting:', deleteError.message)
    return
  }
  console.log('✓ Cleared\n')

  // Insert with full context
  console.log(`Inserting ${topics.length} topics WITH context...`)

  const topicsToInsert = topics.map((name, index) => ({
    chapter_id: chapterId,
    name,  // Full name with context: "802.1X (port security)"
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
  console.log('\nTopics now match EXACTLY what appears in knowledge chunks')
}

extractExactTopics().catch(console.error)
