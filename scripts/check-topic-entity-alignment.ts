/**
 * Check alignment between topics table and graphrag_entities table
 * to identify why test page components aren't loading data
 */

import { createBrowserClient } from '@supabase/ssr'
import 'dotenv/config'

async function main() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  console.log('\n🔍 Checking Topic ↔ Entity Alignment...\n')

  // Get topics with deepest prerequisite paths
  const { data: pathsData } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('target_entity_id, path_depth')
    .order('path_depth', { ascending: false })
    .limit(10)

  console.log(`Found ${pathsData?.length} prerequisite paths\n`)

  if (!pathsData || pathsData.length === 0) {
    console.log('❌ No prerequisite paths found')
    return
  }

  // Get entity details
  const entityIds = pathsData.map(p => p.target_entity_id)
  const { data: entities } = await supabase
    .from('graphrag_entities')
    .select('id, name, full_path')
    .in('id', entityIds)

  console.log('Entity → Topic Matching:\n')

  for (const entity of entities || []) {
    const path = pathsData.find(p => p.target_entity_id === entity.id)

    // Try to find matching topic
    const { data: matchingTopic } = await supabase
      .from('topics')
      .select('id, name, full_name')
      .eq('full_name', entity.full_path)
      .maybeSingle()

    const status = matchingTopic ? '✅' : '❌'
    console.log(`${status} Entity: "${entity.name}" (L${path?.path_depth})`)
    console.log(`   Path: ${entity.full_path}`)

    if (matchingTopic) {
      console.log(`   ✓ Topic found: ${matchingTopic.id}`)
      console.log(`   ✓ Topic name: "${matchingTopic.name}"`)
    } else {
      console.log(`   ✗ No matching topic in topics table`)
    }
    console.log('')
  }

  // Get overall stats
  const { count: totalEntities } = await supabase
    .from('graphrag_entities')
    .select('*', { count: 'exact', head: true })

  const { count: totalTopics } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })

  console.log('\n📊 Overall Stats:')
  console.log(`   GraphRAG Entities: ${totalEntities}`)
  console.log(`   Topics in DB: ${totalTopics}`)
  console.log(`   Prerequisite Paths: ${pathsData.length}`)
}

main().catch(console.error)
