import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function extractAllConcepts() {
  console.log('Fetching all knowledge chunks...')

  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('chapter_id', chapterId)

  if (error || !chunks) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${chunks.length} chunks\n`)

  // Extract ALL individual concepts
  const conceptsSet = new Set()

  chunks.forEach(chunk => {
    const lines = chunk.content.split('\n')

    lines.forEach(line => {
      line = line.trim()

      // Skip empty lines and section headers
      if (!line || line.startsWith('Domain') || line.startsWith('From')) return

      // Keep the full line including context in parentheses
      let concept = line.trim()

      // Filter out very short or very long strings
      if (concept.length >= 3 && concept.length <= 150) {
        conceptsSet.add(concept)
      }
    })
  })

  const concepts = Array.from(conceptsSet).sort()
  console.log(`Extracted ${concepts.length} unique concepts\n`)

  console.log('First 30 concepts:')
  concepts.slice(0, 30).forEach((c, i) => console.log(`  ${i+1}. ${c}`))

  console.log(`\n... and ${concepts.length - 30} more\n`)

  if (concepts.length === 0) {
    console.error('❌ No concepts found!')
    return
  }

  // Delete existing records first
  console.log('Deleting existing records...')
  await supabase
    .from('chapter_topics')
    .delete()
    .eq('chapter_id', chapterId)
  console.log('✓ Cleared old records\n')

  // Insert concepts for all 6 Bloom levels
  console.log(`Inserting ${concepts.length} concepts × 6 Bloom levels = ${concepts.length * 6} records...\n`)

  const topicsToInsert = []
  for (const concept of concepts) {
    for (let bloomLevel = 1; bloomLevel <= 6; bloomLevel++) {
      topicsToInsert.push({
        chapter_id: chapterId,
        topic: concept,
        bloom_level: bloomLevel
      })
    }
  }

  // Insert in batches
  const batchSize = 500
  for (let i = 0; i < topicsToInsert.length; i += batchSize) {
    const batch = topicsToInsert.slice(i, i + batchSize)
    const { error } = await supabase
      .from('chapter_topics')
      .insert(batch)

    if (error) {
      console.error(`Error inserting batch:`, error.message)
    } else {
      console.log(`✓ Inserted ${Math.min(i + batchSize, topicsToInsert.length)}/${topicsToInsert.length}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ COMPLETE!')
  console.log('='.repeat(60))
  console.log(`\nTotal: ${concepts.length} concepts across 6 Bloom levels`)
  console.log(`Database records: ${concepts.length * 6}`)
  console.log('\nNext steps:')
  console.log('1. Restart Supabase (Dashboard → Pause → Resume)')
  console.log('2. Wait 30 seconds')
  console.log('3. Hard refresh browser (Ctrl+Shift+R)')
  console.log('4. Click "Start Learning"')
}

extractAllConcepts().catch(console.error)
