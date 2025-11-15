import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function clearObjectiveEmbeddings() {
  console.log('🧹 Clearing embeddings for objectives (depth = 1)...\n')

  // Update all depth=1 topics to null embedding
  const { data, error } = await supabase
    .from('topics')
    .update({ embedding: null })
    .eq('depth', 1)
    .select('name')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Cleared embeddings for ${data.length} objectives:\n`)
  data.forEach((topic, i) => {
    console.log(`  ${i + 1}. ${topic.name}`)
  })
}

clearObjectiveEmbeddings().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
