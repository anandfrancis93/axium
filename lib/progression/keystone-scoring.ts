/**
 * Keystone Topic Scoring
 *
 * Boosts priority of "keystone" topics - high-impact topics that unlock many others.
 * Uses Neo4j graph structure to identify central topics.
 */

import { createSession } from '@/lib/neo4j/client'

interface TopicPriority {
  topicId: string
  topicName: string
  priority: number
  reason: string
  recommendedBloomLevel: number
  prerequisites: string[]
}

interface KeystoneScore {
  topicId: string
  dependentCount: number
  childCount: number
  isKeystone: boolean
}

/**
 * Apply keystone scoring to topic priorities
 * Boosts priority for topics that unlock many other topics
 */
export async function applyKeystoneScoring(
  priorities: TopicPriority[]
): Promise<TopicPriority[]> {
  if (priorities.length === 0) return priorities

  const session = createSession()

  try {
    // Get keystone scores for all topics
    const topicIds = priorities.map(p => p.topicId)

    const result = await session.run(
      `UNWIND $topicIds AS topicId
       MATCH (t:Topic {id: topicId})
       OPTIONAL MATCH (t)-[:HAS_TOPIC|HAS_SUBTOPIC*1..3]->(dependent:Topic)
       OPTIONAL MATCH (t)-[:HAS_TOPIC|HAS_SUBTOPIC]->(child:Topic)
       RETURN t.id as topicId,
              count(DISTINCT dependent) as dependentCount,
              count(DISTINCT child) as childCount`,
      { topicIds }
    )

    const keystoneScores = new Map<string, KeystoneScore>()

    result.records.forEach(record => {
      const topicId = record.get('topicId')
      const dependentCount = record.get('dependentCount').toNumber()
      const childCount = record.get('childCount').toNumber()

      keystoneScores.set(topicId, {
        topicId,
        dependentCount,
        childCount,
        isKeystone: dependentCount >= 5 // Topics with 5+ dependents are keystones
      })
    })

    // Apply scoring boost
    return priorities.map(p => {
      const score = keystoneScores.get(p.topicId)

      if (!score) return p

      let boost = 0
      let reason = p.reason

      // Keystone topics get significant boost
      if (score.isKeystone) {
        // Scale boost: 0.1 to 0.3 based on dependent count
        boost = Math.min(0.3, 0.1 + (score.dependentCount / 100))
        reason += ` | KEYSTONE (unlocks ${score.dependentCount} topics)`
      }
      // Category topics (3-4 children) get moderate boost
      else if (score.childCount >= 3) {
        boost = 0.1
        reason += ` | category (${score.childCount} subtopics)`
      }
      // Bridge topics (has both parent and children) get small boost
      else if (score.childCount > 0) {
        boost = 0.05
        reason += ` | bridge topic`
      }

      return {
        ...p,
        priority: Math.min(1.0, p.priority + boost),
        reason
      }
    })
  } finally {
    await session.close()
  }
}

/**
 * Get top keystone topics for a subject
 * Useful for initial topic selection or curriculum design
 */
export async function getTopKeystoneTopics(
  subjectId: string,
  limit: number = 10
): Promise<Array<{
  topicId: string
  topicName: string
  dependentCount: number
  hierarchyLevel: number
}>> {
  const session = createSession()

  try {
    const result = await session.run(
      `MATCH (t:Topic)
       WHERE t.subject_id = $subjectId
       OPTIONAL MATCH (t)-[:HAS_TOPIC|HAS_SUBTOPIC*1..3]->(dependent:Topic)
       WITH t, count(DISTINCT dependent) as dependentCount
       WHERE dependentCount > 0
       RETURN t.id as topicId,
              t.name as topicName,
              t.hierarchy_level as hierarchyLevel,
              dependentCount
       ORDER BY dependentCount DESC
       LIMIT toInteger($limit)`,
      { subjectId, limit }
    )

    return result.records.map(r => ({
      topicId: r.get('topicId'),
      topicName: r.get('topicName'),
      dependentCount: r.get('dependentCount').toNumber(),
      hierarchyLevel: r.get('hierarchyLevel')
    }))
  } finally {
    await session.close()
  }
}
