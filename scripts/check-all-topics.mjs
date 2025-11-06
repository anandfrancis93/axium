import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllTopics() {
  // Get all chapters
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, slug')

  console.log('All chapters:')
  chapters.forEach(c => console.log(`  - ${c.name} (ID: ${c.id.substring(0, 8)}...)`))

  // Count topics in chapter_topics
  const { data: allTopics } = await supabase
    .from('chapter_topics')
    .select('chapter_id, topic')

  if (allTopics) {
    const uniqueTopics = new Set(allTopics.map(t => t.topic))
    const byChapter = {}
    const uniqueByChapter = {}

    allTopics.forEach(t => {
      byChapter[t.chapter_id] = (byChapter[t.chapter_id] || 0) + 1
      if (!uniqueByChapter[t.chapter_id]) {
        uniqueByChapter[t.chapter_id] = new Set()
      }
      uniqueByChapter[t.chapter_id].add(t.topic)
    })

    console.log(`\nTotal unique topics across all chapters: ${uniqueTopics.size}`)
    console.log(`Total chapter_topics records: ${allTopics.length}`)
    console.log(`\nTopics by chapter:`)
    Object.entries(byChapter).forEach(([chapterId, count]) => {
      const chapter = chapters.find(c => c.id === chapterId)
      const uniqueCount = uniqueByChapter[chapterId].size
      console.log(`  ${chapter?.name || chapterId}: ${uniqueCount} unique topics (${count} total records)`)
    })
  }
}

checkAllTopics().catch(console.error)
