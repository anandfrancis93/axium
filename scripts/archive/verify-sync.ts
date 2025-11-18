/**
 * Verify Neo4j → Supabase sync results
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySyncResults() {
  console.log('📊 Verifying Neo4j → Supabase sync results\n')

  // Count entities with difficulty scores
  const { count: withDifficulty, error: difficultyError } = await supabase
    .from('graphrag_entities')
    .select('*', { count: 'exact', head: true })
    .not('difficulty_score', 'is', null)

  if (difficultyError) {
    console.error('❌ Error counting difficulty scores:', difficultyError)
  } else {
    console.log(`✅ Entities with difficulty_score: ${withDifficulty}`)
  }

  // Count entities with learning depth
  const { count: withDepth, error: depthError } = await supabase
    .from('graphrag_entities')
    .select('*', { count: 'exact', head: true })
    .not('learning_depth', 'is', null)

  if (depthError) {
    console.error('❌ Error counting learning depths:', depthError)
  } else {
    console.log(`✅ Entities with learning_depth: ${withDepth}`)
  }

  // Sample 10 entities with scores
  const { data: samples, error: sampleError } = await supabase
    .from('graphrag_entities')
    .select('name, difficulty_score, learning_depth, estimated_study_time')
    .not('difficulty_score', 'is', null)
    .limit(10)

  if (sampleError) {
    console.error('❌ Error fetching samples:', sampleError)
  } else {
    console.log('\n📋 Sample entities with semantic data:')
    samples?.forEach((entity, i) => {
      console.log(`  ${i + 1}. ${entity.name}`)
      console.log(`     Difficulty: ${entity.difficulty_score}/10`)
      console.log(`     Depth: L${entity.learning_depth}`)
      console.log(`     Study Time: ${entity.estimated_study_time || 'N/A'} min`)
    })
  }

  // Count relationships
  const { count: relationshipCount, error: relError } = await supabase
    .from('graphrag_relationships')
    .select('*', { count: 'exact', head: true })

  if (relError) {
    console.error('❌ Error counting relationships:', relError)
  } else {
    console.log(`\n✅ Total relationships synced: ${relationshipCount}`)
  }

  // Count domain paths
  const { count: domainPathCount, error: domainError } = await supabase
    .from('graphrag_domain_paths')
    .select('*', { count: 'exact', head: true })

  if (domainError) {
    console.error('❌ Error counting domain paths:', domainError)
  } else {
    console.log(`✅ Domain paths generated: ${domainPathCount}`)
  }

  console.log('\n✅ Verification complete!')
}

verifySyncResults()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
