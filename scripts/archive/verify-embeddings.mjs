import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyEmbeddings() {
  console.log('🔍 Verifying topic embeddings by depth...\n')

  // Get counts by depth
  const { data, error } = await supabase
    .from('topics')
    .select('depth, embedding')

  if (error) {
    console.error('Error:', error)
    return
  }

  const stats = {}
  data.forEach(topic => {
    const depth = topic.depth
    if (!stats[depth]) {
      stats[depth] = { total: 0, withEmbedding: 0 }
    }
    stats[depth].total++
    if (topic.embedding) {
      stats[depth].withEmbedding++
    }
  })

  console.log('Depth | Total Topics | With Embedding | Status')
  console.log('------|--------------|----------------|--------')
  Object.keys(stats).sort().forEach(depth => {
    const { total, withEmbedding } = stats[depth]
    const status = depth === '1'
      ? (withEmbedding === 0 ? '✅ GOOD (no embeddings)' : '❌ BAD (has embeddings)')
      : (withEmbedding > 0 ? '✅ GOOD' : '⚠️  No embeddings')
    console.log(`  ${depth}   |     ${total.toString().padStart(3)}      |      ${withEmbedding.toString().padStart(3)}       | ${status}`)
  })

  console.log('\n📊 Summary:')
  console.log(`Depth 0 (Domains): ${stats[0]?.withEmbedding || 0}/${stats[0]?.total || 0} have embeddings`)
  console.log(`Depth 1 (Objectives): ${stats[1]?.withEmbedding || 0}/${stats[1]?.total || 0} have embeddings ${stats[1]?.withEmbedding === 0 ? '✅' : '❌'}`)
  console.log(`Depth 2+ (Topics): ${Object.keys(stats).filter(d => d >= 2).reduce((sum, d) => sum + stats[d].withEmbedding, 0)} have embeddings`)
}

verifyEmbeddings().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
