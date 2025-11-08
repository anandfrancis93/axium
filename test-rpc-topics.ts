// Temporary test file to check what RPC sees
import { createClient } from '@/lib/supabase/server'

async function testRPC() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('debug_topics_count', {
    p_chapter_id: '0517450a-61b2-4fa2-a425-5846b21ba4b0'
  })

  console.log('RPC debug_topics_count:', data, error)
}

testRPC()
