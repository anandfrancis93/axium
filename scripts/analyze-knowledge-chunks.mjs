import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const chapterId = '0517450a-61b2-4fa2-a425-5846b21ba4b0'

async function analyzeChunks() {
  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('content')
    .eq('chapter_id', chapterId)

  if (error || !chunks) {
    console.error('Error:', error)
    return
  }

  console.log(`Total chunks: ${chunks.length}\n`)

  // Extract all topics using the SAME logic as extract-all-topics.mjs
  const topicsSet = new Set()

  chunks.forEach(chunk => {
    const content = chunk.content

    // Extract topics from "From X.X (Topic Name):" pattern
    const topicMatches = content.matchAll(/From \d+\.\d+ \(([^)]+)\):/g)
    for (const match of topicMatches) {
      topicsSet.add(match[1])
    }

    // Extract individual terms (lines that end with (...))
    const lines = content.split('\n')
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
  console.log(`Extracted ${topics.length} unique topics\n`)

  // Show full first chunk
  console.log('=== SAMPLE CHUNK 1 ===')
  console.log(chunks[0].content.substring(0, 500))
  console.log('...\n')

  // Show first 30 topics
  console.log('First 30 topics:')
  topics.slice(0, 30).forEach((t, i) => console.log(`  ${i + 1}. ${t}`))
  console.log(`  ...\n  Total: ${topics.length}`)
}

analyzeChunks().catch(console.error)
