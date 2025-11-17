/**
 * Knowledge Transfer Inference
 *
 * Infers partial knowledge of related topics based on mastery of similar topics.
 * Uses graph structure to identify siblings, cousins, and hierarchical relationships.
 */

import { createSession } from '@/lib/neo4j/client'
import { createClient } from '@/lib/supabase/server'

export interface InferredKnowledge {
  topicId: string
  topicName: string
  inferredMasteryBoost: number // 0-30% boost based on related topic mastery
  transferSource: string // Which topic the knowledge transfers from
  relationshipType: 'sibling' | 'cousin' | 'parent' | 'child'
}

/**
 * Calculate knowledge transfer for a user
 * When a user masters topic A, they gain partial understanding of related topics
 */
export async function calculateKnowledgeTransfer(
  userId: string,
  masteredTopicId: string,
  masteryLevel: number // 0-100
): Promise<InferredKnowledge[]> {
  if (masteryLevel < 70) {
    // Only transfer knowledge from mastered topics (70%+)
    return []
  }

  const session = createSession()
  const supabase = await createClient()

  try {
    // Get related topics through graph
    const result = await session.run(
      `MATCH (mastered:Topic {id: $masteredTopicId})

       // Siblings (same parent)
       OPTIONAL MATCH (mastered)<-[:HAS_TOPIC|HAS_SUBTOPIC]-(parent)-[:HAS_TOPIC|HAS_SUBTOPIC]->(sibling:Topic)
       WHERE sibling.id <> $masteredTopicId

       // Cousins (same grandparent)
       OPTIONAL MATCH (mastered)<-[:HAS_TOPIC|HAS_SUBTOPIC*2]-(grandparent)-[:HAS_TOPIC|HAS_SUBTOPIC*2]->(cousin:Topic)
       WHERE cousin.id <> $masteredTopicId
         AND NOT (mastered)<-[:HAS_TOPIC|HAS_SUBTOPIC]-()<-[:HAS_TOPIC|HAS_SUBTOPIC]-(cousin)

       // Parent topics
       OPTIONAL MATCH (mastered)<-[:HAS_TOPIC|HAS_SUBTOPIC]-(parentTopic:Topic)

       // Children topics
       OPTIONAL MATCH (mastered)-[:HAS_TOPIC|HAS_SUBTOPIC]->(childTopic:Topic)

       WITH mastered,
            collect(DISTINCT {id: sibling.id, name: sibling.name, type: 'sibling'}) as siblings,
            collect(DISTINCT {id: cousin.id, name: cousin.name, type: 'cousin'}) as cousins,
            collect(DISTINCT {id: parentTopic.id, name: parentTopic.name, type: 'parent'}) as parents,
            collect(DISTINCT {id: childTopic.id, name: childTopic.name, type: 'child'}) as children

       RETURN mastered.name as masteredName,
              siblings,
              cousins,
              parents,
              children`,
      { masteredTopicId }
    )

    if (result.records.length === 0) {
      return []
    }

    const record = result.records[0]
    const masteredName = record.get('masteredName')
    const siblings = record.get('siblings').filter((s: any) => s.id)
    const cousins = record.get('cousins').filter((c: any) => c.id)
    const parents = record.get('parents').filter((p: any) => p.id)
    const children = record.get('children').filter((c: any) => c.id)

    const inferred: InferredKnowledge[] = []

    // Knowledge transfer rules:
    // 1. Siblings: High transfer (15-25%) - same category, different specifics
    // 2. Cousins: Moderate transfer (8-15%) - related but less direct
    // 3. Parents: Medium transfer (10-18%) - understanding specifics helps general
    // 4. Children: Low transfer (5-12%) - general knowledge helps with specifics

    // Siblings get highest transfer
    siblings.forEach((s: any) => {
      const boost = 15 + (masteryLevel - 70) / 3 // 15-25%
      inferred.push({
        topicId: s.id,
        topicName: s.name,
        inferredMasteryBoost: Math.min(25, boost),
        transferSource: masteredName,
        relationshipType: 'sibling'
      })
    })

    // Cousins get moderate transfer
    cousins.slice(0, 10).forEach((c: any) => {
      const boost = 8 + (masteryLevel - 70) / 4 // 8-15%
      inferred.push({
        topicId: c.id,
        topicName: c.name,
        inferredMasteryBoost: Math.min(15, boost),
        transferSource: masteredName,
        relationshipType: 'cousin'
      })
    })

    // Parents get medium transfer
    parents.forEach((p: any) => {
      const boost = 10 + (masteryLevel - 70) / 3.5 // 10-18%
      inferred.push({
        topicId: p.id,
        topicName: p.name,
        inferredMasteryBoost: Math.min(18, boost),
        transferSource: masteredName,
        relationshipType: 'parent'
      })
    })

    // Children get low transfer
    children.forEach((c: any) => {
      const boost = 5 + (masteryLevel - 70) / 5 // 5-12%
      inferred.push({
        topicId: c.id,
        topicName: c.name,
        inferredMasteryBoost: Math.min(12, boost),
        transferSource: masteredName,
        relationshipType: 'child'
      })
    })

    return inferred
  } finally {
    await session.close()
  }
}

/**
 * Apply knowledge transfer to user's estimated mastery
 * Adjusts confidence and initial bloom level for related topics
 */
export async function applyKnowledgeTransferToEstimate(
  userId: string,
  targetTopicId: string
): Promise<{
  baselineEstimate: number  // 0 if never attempted
  transferBoost: number      // Boost from related topics
  totalEstimate: number      // baselineEstimate + transferBoost
  transferSources: string[]  // Topics that contributed knowledge
}> {
  const supabase = await createClient()

  // Get user's mastered topics
  const { data: masteredTopics } = await supabase
    .from('user_progress')
    .select('topic_id, topics(name), mastery_scores')
    .eq('user_id', userId)

  if (!masteredTopics || masteredTopics.length === 0) {
    return {
      baselineEstimate: 0,
      transferBoost: 0,
      totalEstimate: 0,
      transferSources: []
    }
  }

  // Calculate transfer from each mastered topic
  let totalBoost = 0
  const sources: string[] = []

  for (const progress of masteredTopics) {
    // Skip the target topic itself
    if (progress.topic_id === targetTopicId) continue

    // Calculate average mastery
    const scores = progress.mastery_scores as Record<string, number>
    const avgMastery = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length

    if (avgMastery < 70) continue // Only transfer from mastered topics

    // Get inferred knowledge
    const inferred = await calculateKnowledgeTransfer(userId, progress.topic_id, avgMastery)

    // Find if target topic is in the inferred list
    const transfer = inferred.find(i => i.topicId === targetTopicId)

    if (transfer) {
      totalBoost += transfer.inferredMasteryBoost
      sources.push(`${transfer.transferSource} (${transfer.relationshipType})`)
    }
  }

  // Cap total boost at 40% (can't replace actual practice)
  totalBoost = Math.min(40, totalBoost)

  // Get baseline estimate (from direct progress if any)
  const { data: directProgress } = await supabase
    .from('user_progress')
    .select('mastery_scores')
    .eq('user_id', userId)
    .eq('topic_id', targetTopicId)
    .single()

  let baseline = 0
  if (directProgress && directProgress.mastery_scores) {
    const scores = directProgress.mastery_scores as Record<string, number>
    baseline = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length
  }

  return {
    baselineEstimate: baseline,
    transferBoost: totalBoost,
    totalEstimate: Math.min(100, baseline + totalBoost),
    transferSources: sources
  }
}

/**
 * Get recommended starting Bloom level based on knowledge transfer
 * If user has high transfer (30%+), start at Bloom 2 instead of Bloom 1
 */
export async function getRecommendedStartingLevel(
  userId: string,
  topicId: string
): Promise<{
  bloomLevel: number
  reason: string
}> {
  const estimate = await applyKnowledgeTransferToEstimate(userId, topicId)

  if (estimate.totalEstimate >= 30) {
    return {
      bloomLevel: 2,
      reason: `Knowledge transfer from ${estimate.transferSources.slice(0, 2).join(', ')} suggests ${estimate.totalEstimate}% understanding`
    }
  }

  if (estimate.totalEstimate >= 15) {
    return {
      bloomLevel: 1,
      reason: `Some knowledge transfer (${estimate.totalEstimate}%) from related topics`
    }
  }

  return {
    bloomLevel: 1,
    reason: 'Cold start - no related knowledge'
  }
}
