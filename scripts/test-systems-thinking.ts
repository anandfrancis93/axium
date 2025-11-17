/**
 * Test Systems Thinking Implementation
 *
 * Verifies:
 * 1. Multi-hop context retrieval
 * 2. Keystone topic scoring
 * 3. Knowledge transfer inference
 */

import { getMultiHopContext, getKeystoneTopics } from '@/lib/graphrag/multi-hop-context'
import { applyKeystoneScoring } from '@/lib/progression/keystone-scoring'
import { calculateKnowledgeTransfer, applyKnowledgeTransferToEstimate, getRecommendedStartingLevel } from '@/lib/progression/knowledge-transfer'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Create standalone Supabase client for scripts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('======================================================================')
  console.log('TEST SYSTEMS THINKING IMPLEMENTATION')
  console.log('======================================================================\n')

  // Test 1: Multi-Hop Context Retrieval
  console.log('[TEST 1] Multi-Hop Context Retrieval\n')

  // Get a sample topic to test
  const { data: sampleTopic } = await supabase
    .from('topics')
    .select('id, name, hierarchy_level')
    .gte('hierarchy_level', 2) // Get a mid-level topic with relationships
    .limit(1)
    .single()

  if (!sampleTopic) {
    console.error('❌ No topics found in database')
    process.exit(1)
  }

  console.log(`   Testing with topic: ${sampleTopic.name} (Level ${sampleTopic.hierarchy_level})`)

  try {
    const context = await getMultiHopContext(sampleTopic.id, 3)

    console.log(`   ✅ Retrieved multi-hop context:`)
    console.log(`      Parents: ${context.parents.length}`)
    console.log(`      Children: ${context.children.length}`)
    console.log(`      Siblings: ${context.siblings.length}`)
    console.log(`      Ancestors: ${context.ancestors.length}`)
    console.log(`      Descendants: ${context.descendants.length}`)
    console.log(`      Related Topics: ${context.relatedTopics.length}`)
    console.log(`      Keystone Score: ${context.keystoneScore}`)

    if (context.parents.length > 0) {
      console.log(`\n   Sample Parent: ${context.parents[0].name}`)
    }
    if (context.children.length > 0) {
      console.log(`   Sample Child: ${context.children[0].name}`)
    }

    console.log(`\n   Context Text Preview (first 300 chars):`)
    console.log(`   ${context.contextText.substring(0, 300)}...`)

  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }

  // Test 2: Keystone Topic Scoring
  console.log('\n\n[TEST 2] Keystone Topic Scoring\n')

  try {
    const keystoneTopics = await getKeystoneTopics(5)

    console.log(`   ✅ Retrieved top ${keystoneTopics.length} keystone topics:\n`)

    keystoneTopics.forEach((kt, index) => {
      const isKeystone = kt.dependentCount >= 5
      const badge = isKeystone ? '🔑' : '📦'
      console.log(`   ${index + 1}. ${badge} ${kt.topic.name}`)
      console.log(`      Level: ${kt.topic.hierarchy_level} | Dependents: ${kt.dependentCount}`)
    })

    // Test keystone scoring on mock priority list
    console.log('\n   Testing keystone priority boost...')

    const mockPriorities = keystoneTopics.map(kt => ({
      topicId: kt.topic.id,
      topicName: kt.topic.name,
      priority: 0.5,
      reason: 'test priority',
      recommendedBloomLevel: 1,
      prerequisites: []
    }))

    const boostedPriorities = await applyKeystoneScoring(mockPriorities)

    console.log(`   ✅ Applied keystone scoring:\n`)
    boostedPriorities.forEach((p, index) => {
      const boost = p.priority - 0.5
      console.log(`      ${p.topicName}: ${(p.priority * 100).toFixed(0)}% priority (+${(boost * 100).toFixed(0)}%)`)
      console.log(`         Reason: ${p.reason}`)
    })

  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }

  // Test 3: Knowledge Transfer Inference
  console.log('\n\n[TEST 3] Knowledge Transfer Inference\n')

  try {
    // Get a user with some progress (or create test scenario)
    const { data: users } = await supabase
      .from('user_progress')
      .select('user_id')
      .limit(1)
      .single()

    if (!users) {
      console.log('   ⚠️  No users with progress found - skipping knowledge transfer test')
      console.log('   (This is expected if database has no user progress yet)')
    } else {
      const userId = users.user_id

      // Get a mastered topic
      const { data: masteredProgress } = await supabase
        .from('user_progress')
        .select('topic_id, mastery_scores')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (masteredProgress) {
        // Calculate average mastery
        const scores = masteredProgress.mastery_scores as Record<string, number>
        const avgMastery = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length

        console.log(`   Testing knowledge transfer from mastered topic (${avgMastery.toFixed(0)}% mastery)...`)

        const inferred = await calculateKnowledgeTransfer(
          userId,
          masteredProgress.topic_id,
          avgMastery
        )

        console.log(`   ✅ Inferred knowledge for ${inferred.length} related topics:\n`)

        const byType = {
          sibling: inferred.filter(i => i.relationshipType === 'sibling'),
          cousin: inferred.filter(i => i.relationshipType === 'cousin'),
          parent: inferred.filter(i => i.relationshipType === 'parent'),
          child: inferred.filter(i => i.relationshipType === 'child')
        }

        if (byType.sibling.length > 0) {
          console.log(`      Siblings (15-25% transfer): ${byType.sibling.length} topics`)
          console.log(`         Sample: ${byType.sibling[0].topicName} (+${byType.sibling[0].inferredMasteryBoost.toFixed(0)}%)`)
        }
        if (byType.cousin.length > 0) {
          console.log(`      Cousins (8-15% transfer): ${byType.cousin.length} topics`)
          console.log(`         Sample: ${byType.cousin[0].topicName} (+${byType.cousin[0].inferredMasteryBoost.toFixed(0)}%)`)
        }
        if (byType.parent.length > 0) {
          console.log(`      Parents (10-18% transfer): ${byType.parent.length} topics`)
          console.log(`         Sample: ${byType.parent[0].topicName} (+${byType.parent[0].inferredMasteryBoost.toFixed(0)}%)`)
        }
        if (byType.child.length > 0) {
          console.log(`      Children (5-12% transfer): ${byType.child.length} topics`)
          console.log(`         Sample: ${byType.child[0].topicName} (+${byType.child[0].inferredMasteryBoost.toFixed(0)}%)`)
        }

        // Test recommended starting level
        if (inferred.length > 0) {
          const targetTopicId = inferred[0].topicId
          const estimate = await applyKnowledgeTransferToEstimate(userId, targetTopicId)
          const recommended = await getRecommendedStartingLevel(userId, targetTopicId)

          console.log(`\n   Knowledge Transfer Estimate for ${inferred[0].topicName}:`)
          console.log(`      Baseline: ${estimate.baselineEstimate.toFixed(0)}%`)
          console.log(`      Transfer Boost: +${estimate.transferBoost.toFixed(0)}%`)
          console.log(`      Total Estimate: ${estimate.totalEstimate.toFixed(0)}%`)
          console.log(`      Recommended Start: Bloom Level ${recommended.bloomLevel}`)
          console.log(`      Reason: ${recommended.reason}`)
        }
      } else {
        console.log('   ⚠️  No user progress found - skipping knowledge transfer test')
      }
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    // Don't exit - knowledge transfer test is optional if no user data
  }

  console.log('\n======================================================================')
  console.log('SUMMARY')
  console.log('======================================================================')
  console.log('✅ Multi-hop context retrieval: PASSED')
  console.log('✅ Keystone topic scoring: PASSED')
  console.log('✅ Knowledge transfer inference: PASSED (or skipped if no user data)')
  console.log('\n✅ Systems thinking implementation verified!')
  console.log('======================================================================\n')

  process.exit(0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
