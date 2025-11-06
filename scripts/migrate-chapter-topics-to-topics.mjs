import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function migrateTopics() {
  console.log('Fetching topics from chapter_topics...')

  // Get all unique topics from chapter_topics
  const { data: chapterTopicsData, error } = await supabase
    .from('chapter_topics')
    .select('topic, bloom_level')
    .eq('chapter_id', chapterId)

  if (error || !chapterTopicsData) {
    console.error('Error fetching chapter_topics:', error)
    return
  }

  console.log(`Found ${chapterTopicsData.length} records in chapter_topics`)

  // Get unique topic names
  const uniqueTopics = [...new Set(chapterTopicsData.map(t => t.topic))].sort()
  console.log(`\n${uniqueTopics.length} unique topics to migrate\n`)

  // Delete existing topics for this chapter (clean slate)
  console.log('Clearing existing topics for this chapter...')
  const { error: deleteError } = await supabase
    .from('topics')
    .delete()
    .eq('chapter_id', chapterId)

  if (deleteError) {
    console.error('Error deleting existing topics:', deleteError.message)
  } else {
    console.log('✓ Cleared existing topics\n')
  }

  // Insert all unique topics
  console.log(`Inserting ${uniqueTopics.length} topics...`)

  const topicsToInsert = uniqueTopics.map((topicName, index) => ({
    chapter_id: chapterId,
    name: topicName,
    sequence_order: index,
    available_bloom_levels: [1, 2, 3, 4, 5, 6]
  }))

  // Insert in batches of 100
  const batchSize = 100
  let totalInserted = 0

  for (let i = 0; i < topicsToInsert.length; i += batchSize) {
    const batch = topicsToInsert.slice(i, i + batchSize)
    const { data: insertedData, error: insertError } = await supabase
      .from('topics')
      .insert(batch)
      .select()

    if (insertError) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError.message)
    } else {
      totalInserted += insertedData.length
      console.log(`✓ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${insertedData.length} records (total: ${totalInserted})`)
    }
  }

  console.log('\n✅ MIGRATION COMPLETE!')
  console.log(`\nInserted ${totalInserted} topics`)
  console.log('\nSample topics:')
  uniqueTopics.slice(0, 10).forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  console.log(`  ...`)
  console.log(`  ${uniqueTopics.length}. ${uniqueTopics[uniqueTopics.length - 1]}`)
}

migrateTopics().catch(console.error)
