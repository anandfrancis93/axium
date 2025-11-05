import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function extractAllTopics() {
  console.log('Fetching all knowledge chunks...')

  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('chapter_id', chapterId)

  if (error || !chunks) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${chunks.length} chunks`)

  // Extract all topics from content
  const topicsSet = new Set()

  chunks.forEach(chunk => {
    const content = chunk.content

    // Extract topics from "From X.X (Topic Name):" pattern
    const topicMatches = content.matchAll(/From \d+\.\d+ \(([^)]+)\):/g)
    for (const match of topicMatches) {
      topicsSet.add(match[1])
    }

    // Extract individual terms (lines that aren't headers)
    const lines = content.split('\\n')
    lines.forEach(line => {
      line = line.trim()
      // Skip headers and short lines
      if (line.startsWith('Domain') || line.startsWith('From') || line.length < 3) return

      // Extract terms that end with (...)
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
  console.log(`\\nExtracted ${topics.length} unique topics`)

  console.log('\\nSample topics:')
  topics.slice(0, 20).forEach((t, i) => console.log(`  ${i+1}. ${t}`))

  if (topics.length === 0) {
    console.error('\\n❌ No topics found!')
    return
  }

  // Insert topics for all 6 Bloom levels
  console.log(`\\nInserting ${topics.length} topics × 6 Bloom levels = ${topics.length * 6} records...`)

  const topicsToInsert = []
  for (const topic of topics) {
    for (let bloomLevel = 1; bloomLevel <= 6; bloomLevel++) {
      topicsToInsert.push({
        chapter_id: chapterId,
        topic,
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
      console.error(`Error inserting batch ${i}-${i+batch.length}:`, error.message)
    } else {
      console.log(`✓ Inserted ${batch.length} records (${i + batch.length}/${topicsToInsert.length})`)
    }
  }

  console.log('\\n✅ COMPLETE!')
  console.log(`\\nTotal: ${topics.length} topics across 6 Bloom levels`)
  console.log('\\nNext steps:')
  console.log('1. Restart Supabase (Dashboard → Pause → Resume)')
  console.log('2. Wait 30 seconds')
  console.log('3. Hard refresh browser (Ctrl+Shift+R)')
  console.log('4. Click "Start Learning"')
}

extractAllTopics().catch(console.error)
