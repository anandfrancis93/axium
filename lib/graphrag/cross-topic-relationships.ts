/**
 * Cross-Topic Relationship Inference
 *
 * Uses Neo4j graph queries to infer relationships between topics
 * without expensive pairwise LLM comparisons.
 */

import { createSession } from '@/lib/neo4j/client'

export interface InferredRelationship {
  sourceTopic: string
  targetTopic: string
  relationshipType: string
  reason: string
  confidence: number
}

/**
 * Infer relationships between topics based on shared concepts
 */
export async function inferCrossTopicRelationships(): Promise<InferredRelationship[]> {
  const session = createSession()
  const relationships: InferredRelationship[] = []

  try {
    // Log removed

    // 1. Find topics that share concepts (co-occurrence)
    const sharedConceptsQuery = `
      MATCH (t1:CurriculumEntity)-[:MENTIONS|PART_OF|IS_A]->(c:CurriculumEntity)<-[:MENTIONS|PART_OF|IS_A]-(t2:CurriculumEntity)
      WHERE t1 <> t2
      AND NOT EXISTS((t1)-[:RELATED_CONCEPT]-(t2))
      WITH t1, t2, collect(DISTINCT c.name) AS sharedConcepts
      WHERE size(sharedConcepts) >= 2
      RETURN t1.name AS topic1, t2.name AS topic2, sharedConcepts, size(sharedConcepts) AS count
      ORDER BY count DESC
      LIMIT 100
    `

    const sharedResult = await session.run(sharedConceptsQuery)
    sharedResult.records.forEach(record => {
      const topic1 = record.get('topic1')
      const topic2 = record.get('topic2')
      const sharedConcepts = record.get('sharedConcepts')
      const count = record.get('count').toNumber()

      relationships.push({
        sourceTopic: topic1,
        targetTopic: topic2,
        relationshipType: 'RELATED_CONCEPT',
        reason: `Share ${count} concepts: ${sharedConcepts.slice(0, 3).join(', ')}`,
        confidence: Math.min(count / 5, 1.0) // Normalize to 0-1
      })
    })

    // Log removed

    // 2. Find prerequisite chains (A depends on B, B depends on C → A indirectly depends on C)
    const prerequisiteChainQuery = `
      MATCH path = (t1:CurriculumEntity)-[:PREREQUISITE|DEPENDS_ON*2..3]->(t2:CurriculumEntity)
      WHERE NOT EXISTS((t1)-[:PREREQUISITE|DEPENDS_ON]->(t2))
      RETURN t1.name AS topic1, t2.name AS topic2, length(path) AS distance
      LIMIT 50
    `

    const prereqResult = await session.run(prerequisiteChainQuery)
    prereqResult.records.forEach(record => {
      relationships.push({
        sourceTopic: record.get('topic1'),
        targetTopic: record.get('topic2'),
        relationshipType: 'PREREQUISITE',
        reason: `Indirect prerequisite (${record.get('distance').toNumber()} steps)`,
        confidence: 1.0 / record.get('distance').toNumber()
      })
    })

    // Log removed

    // 3. Find attack-defense pairs (if concept A attacks B, and C defends against B → C protects against A)
    const attackDefenseQuery = `
      MATCH (attack:CurriculumEntity)-[:ATTACKS|EXPLOITS]->(target:CurriculumEntity)<-[:PROTECTS_AGAINST|DEFENDS]-(defense:CurriculumEntity)
      WHERE NOT EXISTS((defense)-[:PROTECTS_AGAINST]-(attack))
      RETURN attack.name AS attacker, defense.name AS defender, target.name AS target
      LIMIT 50
    `

    const attackDefenseResult = await session.run(attackDefenseQuery)
    attackDefenseResult.records.forEach(record => {
      relationships.push({
        sourceTopic: record.get('defender'),
        targetTopic: record.get('attacker'),
        relationshipType: 'PROTECTS_AGAINST',
        reason: `Both relate to ${record.get('target')} (inferred)`,
        confidence: 0.8
      })
    })

    // Log removed

    // 4. Find similar topics by community detection (topics in same cluster)
    const communityQuery = `
      CALL gds.louvain.stream('myGraph', {relationshipTypes: ['RELATED_CONCEPT', 'IS_A', 'PART_OF']})
      YIELD nodeId, communityId
      WITH gds.util.asNode(nodeId) AS node, communityId
      WHERE node:CurriculumEntity
      RETURN communityId, collect(node.name) AS members
      ORDER BY size(members) DESC
    `

    try {
      const communityResult = await session.run(communityQuery)
      let communityRelationships = 0

      communityResult.records.forEach(record => {
        const members = record.get('members')
        // Create SIMILAR_TO relationships within community
        for (let i = 0; i < members.length - 1; i++) {
          for (let j = i + 1; j < Math.min(i + 4, members.length); j++) {
            relationships.push({
              sourceTopic: members[i],
              targetTopic: members[j],
              relationshipType: 'SIMILAR_TO',
              reason: 'Same community cluster',
              confidence: 0.7
            })
            communityRelationships++
          }
        }
      })

      // Log removed
    } catch (error) {
      // Log removed
    }

    // Log removed
    return relationships

  } finally {
    await session.close()
  }
}

/**
 * Apply inferred relationships to Neo4j graph
 */
export async function applyInferredRelationships(
  relationships: InferredRelationship[],
  minConfidence: number = 0.5
): Promise<number> {
  const session = createSession()
  let appliedCount = 0

  try {
    const filtered = relationships.filter(r => r.confidence >= minConfidence)

    for (const rel of filtered) {
      const query = `
        MATCH (source:CurriculumEntity {name: $sourceTopic})
        MATCH (target:CurriculumEntity {name: $targetTopic})
        MERGE (source)-[r:${rel.relationshipType} {inferred: true}]->(target)
        SET r.reason = $reason, r.confidence = $confidence
      `

      await session.run(query, {
        sourceTopic: rel.sourceTopic,
        targetTopic: rel.targetTopic,
        reason: rel.reason,
        confidence: rel.confidence
      })

      appliedCount++
    }

    // Log removed
    return appliedCount

  } finally {
    await session.close()
  }
}

/**
 * Main function: Infer and apply cross-topic relationships
 */
export async function enrichKnowledgeGraph(minConfidence: number = 0.6): Promise<void> {
  // Log removed

  // Step 1: Infer relationships
  const relationships = await inferCrossTopicRelationships()

  // Step 2: Apply high-confidence relationships
  const appliedCount = await applyInferredRelationships(relationships, minConfidence)

  // Log removed
}
