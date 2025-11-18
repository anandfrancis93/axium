/**
 * Verify prerequisite paths were generated correctly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyPrerequisitePaths() {
  console.log('📊 Verifying prerequisite paths\n')

  // Count total paths
  const { count: totalPaths, error: countError } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error counting paths:', countError)
  } else {
    console.log(`✅ Total prerequisite paths: ${totalPaths}`)
  }

  // Get sample paths
  const { data: samplePaths, error: sampleError } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('target_entity_id, path_depth, path_names, total_difficulty, estimated_total_time')
    .order('path_depth', { ascending: false })
    .limit(10)

  if (sampleError) {
    console.error('❌ Error fetching samples:', sampleError)
  } else {
    console.log('\n📋 Sample prerequisite paths (deepest first):\n')
    samplePaths?.forEach((path, i) => {
      console.log(`${i + 1}. Depth L${path.path_depth}: ${path.path_names[path.path_names.length - 1]}`)
      console.log(`   Path: ${path.path_names.join(' → ')}`)
      console.log(`   Total Difficulty: ${path.total_difficulty || 'N/A'}`)
      console.log(`   Estimated Time: ${path.estimated_total_time || 'N/A'} min\n`)
    })
  }

  // Get depth distribution
  const { data: depthDist, error: distError } = await supabase
    .rpc('get_path_depth_distribution')
    .select('*')

  // If RPC doesn't exist, do it manually
  const { data: allPaths } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('path_depth')

  if (allPaths) {
    const distribution = allPaths.reduce((acc: any, path) => {
      const depth = path.path_depth || 0
      acc[depth] = (acc[depth] || 0) + 1
      return acc
    }, {})

    console.log('📊 Path depth distribution:')
    Object.keys(distribution)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(depth => {
        console.log(`   L${depth}: ${distribution[depth]} paths`)
      })
  }

  console.log('\n✅ Verification complete!')
}

verifyPrerequisitePaths()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
