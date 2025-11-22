import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function renameAuthFactors() {
  console.log('Renaming authentication factor topics...')

  const updates = [
    { old: 'Something You Know Factor', new: 'Something You Know' },
    { old: 'Something You Have Factor', new: 'Something You Have' },
    { old: 'Something You Are Factor', new: 'Something You Are' },
    { old: 'Somewhere You Are Factor', new: 'Somewhere You Are' }
  ]

  for (const update of updates) {
    const { data, error } = await supabase
      .from('topics')
      .update({ name: update.new })
      .eq('name', update.old)
      .select()

    if (error) {
      console.error(`❌ Error renaming "${update.old}":`, error)
    } else if (data && data.length > 0) {
      console.log(`✅ Renamed "${update.old}" → "${update.new}"`)
    } else {
      console.log(`⚠️  Topic "${update.old}" not found (may already be renamed)`)
    }
  }

  console.log('\n✨ Done!')
}

renameAuthFactors().catch(console.error)
