import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function initializeTopics() {
  console.log('Fetching knowledge chunks for chapter:', chapterId)

  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('chapter_id', chapterId)

  if (error || !chunks) {
    console.error('Error fetching chunks:', error)
    return
  }

  console.log(`Found ${chunks.length} chunks\n`)

  // Extract ONLY topic-level names from "From X.X (Topic Name):" headers
  const topicsSet = new Set()

  chunks.forEach(chunk => {
    const content = chunk.content

    // Match "From X.X (Topic Name):" pattern and extract just the topic name
    const topicMatches = content.matchAll(/From \d+\.\d+ \(([^)]+)\):/g)
    for (const match of topicMatches) {
      topicsSet.add(match[1])
    }
  })

  const topics = Array.from(topicsSet).sort()
  console.log(`✓ Extracted ${topics.length} topic-level names\n`)

  console.log('Topics found:')
  topics.forEach((t, i) => console.log(`  ${i + 1}. ${t}`))

  if (topics.length === 0) {
    console.error('\n❌ No topics found!')
    return
  }

  // Insert into topics table (one record per topic)
  console.log(`\n\nInserting ${topics.length} topics into 'topics' table...\n`)

  const topicsToInsert = topics.map(topicName => ({
    chapter_id: chapterId,
    name: topicName,
    sequence_order: 0,
    available_bloom_levels: [1, 2, 3, 4, 5, 6]
  }))

  // Insert all at once
  const { data: insertedTopics, error: insertError } = await supabase
    .from('topics')
    .insert(topicsToInsert)
    .select()

  if (insertError) {
    console.error('Error inserting topics:', insertError.message)
    return
  }

  console.log(`✅ COMPLETE!`)
  console.log(`\nInserted ${insertedTopics.length} topic records`)
  console.log(`\nTopics created:`)
  insertedTopics.forEach((t, i) => console.log(`  ${i + 1}. ${t.name} (ID: ${t.id.substring(0, 8)}...)`))
  console.log(`\nNext: Update question generation to assign topic_id`)
}

initializeTopics().catch(console.error)
