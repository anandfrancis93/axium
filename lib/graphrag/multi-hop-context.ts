/**
 * Multi-Hop Graph Traversal for Systems Thinking
 *
 * Retrieves topic context by traversing the knowledge graph multiple hops away,
 * understanding relationships, dependencies, and cascading effects.
 */

import { createSession } from '@/lib/neo4j/client'

export interface GraphNode {
  id: string
  name: string
  description: string
  hierarchy_level: number
}

export interface GraphRelationship {
  type: string
  source: GraphNode
  target: GraphNode
  depth: number
}

export interface MultiHopContext {
  centralTopic: GraphNode
  parents: GraphNode[]
  children: GraphNode[]
  siblings: GraphNode[]
  ancestors: GraphNode[]  // 2-3 hops up (grandparents, great-grandparents)
  descendants: GraphNode[] // 2-3 hops down (grandchildren, great-grandchildren)
  relatedTopics: GraphNode[] // Topics at same level sharing parent
  contextText: string
  keystoneScore: number // How many topics depend on this one
}

/**
 * Get comprehensive multi-hop context for a topic
 * Traverses up to 3 hops in each direction to understand the topic's position
 * in the knowledge graph and its relationships to other topics
 */
export async function getMultiHopContext(
  topicId: string,
  maxHops: number = 3
): Promise<MultiHopContext> {
  const session = createSession()

  try {
    // Central topic
    const centralResult = await session.run(
      `MATCH (t:Topic {id: $topicId})
       RETURN t.id as id, t.name as name, t.description as description,
              t.hierarchy_level as hierarchy_level`,
      { topicId }
    )

    if (centralResult.records.length === 0) {
      throw new Error(`Topic ${topicId} not found`)
    }

    const centralTopic: GraphNode = {
      id: centralResult.records[0].get('id'),
      name: centralResult.records[0].get('name'),
      description: centralResult.records[0].get('description') || '',
      hierarchy_level: centralResult.records[0].get('hierarchy_level')
    }

    // Parents (1 hop up)
    const parentsResult = await session.run(
      `MATCH (t:Topic {id: $topicId})<-[:HAS_TOPIC|HAS_SUBTOPIC]-(p:Topic)
       RETURN p.id as id, p.name as name, p.description as description,
              p.hierarchy_level as hierarchy_level`,
      { topicId }
    )
    const parents = parentsResult.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description') || '',
      hierarchy_level: r.get('hierarchy_level')
    }))

    // Children (1 hop down)
    const childrenResult = await session.run(
      `MATCH (t:Topic {id: $topicId})-[:HAS_TOPIC|HAS_SUBTOPIC]->(c:Topic)
       RETURN c.id as id, c.name as name, c.description as description,
              c.hierarchy_level as hierarchy_level`,
      { topicId }
    )
    const children = childrenResult.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description') || '',
      hierarchy_level: r.get('hierarchy_level')
    }))

    // Siblings (same parent)
    const siblingsResult = await session.run(
      `MATCH (t:Topic {id: $topicId})<-[:HAS_TOPIC|HAS_SUBTOPIC]-(p)-[:HAS_TOPIC|HAS_SUBTOPIC]->(s:Topic)
       WHERE s.id <> $topicId
       RETURN DISTINCT s.id as id, s.name as name, s.description as description,
              s.hierarchy_level as hierarchy_level
       LIMIT 10`,
      { topicId }
    )
    const siblings = siblingsResult.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description') || '',
      hierarchy_level: r.get('hierarchy_level')
    }))

    // Ancestors (2-3 hops up)
    const ancestorsResult = await session.run(
      `MATCH path = (t:Topic {id: $topicId})<-[:HAS_TOPIC|HAS_SUBTOPIC*2..${maxHops}]-(a:Topic)
       RETURN DISTINCT a.id as id, a.name as name, a.description as description,
              a.hierarchy_level as hierarchy_level,
              length(path) as distance
       ORDER BY distance
       LIMIT 10`,
      { topicId }
    )
    const ancestors = ancestorsResult.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description') || '',
      hierarchy_level: r.get('hierarchy_level')
    }))

    // Descendants (2-3 hops down)
    const descendantsResult = await session.run(
      `MATCH path = (t:Topic {id: $topicId})-[:HAS_TOPIC|HAS_SUBTOPIC*2..${maxHops}]->(d:Topic)
       RETURN DISTINCT d.id as id, d.name as name, d.description as description,
              d.hierarchy_level as hierarchy_level,
              length(path) as distance
       ORDER BY distance
       LIMIT 15`,
      { topicId }
    )
    const descendants = descendantsResult.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description') || '',
      hierarchy_level: r.get('hierarchy_level')
    }))

    // Related topics (cousins - topics sharing grandparent)
    const relatedResult = await session.run(
      `MATCH (t:Topic {id: $topicId})<-[:HAS_TOPIC|HAS_SUBTOPIC*1..2]-(gp)-[:HAS_TOPIC|HAS_SUBTOPIC*1..2]->(r:Topic)
       WHERE r.id <> $topicId
         AND NOT (t)<-[:HAS_TOPIC|HAS_SUBTOPIC]-(r)
         AND NOT (t)-[:HAS_TOPIC|HAS_SUBTOPIC]->(r)
       RETURN DISTINCT r.id as id, r.name as name, r.description as description,
              r.hierarchy_level as hierarchy_level
       LIMIT 10`,
      { topicId }
    )
    const relatedTopics = relatedResult.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      description: r.get('description') || '',
      hierarchy_level: r.get('hierarchy_level')
    }))

    // Calculate keystone score (how many topics depend on this one)
    const keystoneResult = await session.run(
      `MATCH (t:Topic {id: $topicId})-[:HAS_TOPIC|HAS_SUBTOPIC*1..3]->(dependent:Topic)
       RETURN count(DISTINCT dependent) as dependentCount`,
      { topicId }
    )
    const keystoneScore = keystoneResult.records[0].get('dependentCount').toNumber()

    // Build comprehensive context text
    const contextText = buildContextText({
      centralTopic,
      parents,
      children,
      siblings,
      ancestors,
      descendants,
      relatedTopics,
      keystoneScore
    })

    return {
      centralTopic,
      parents,
      children,
      siblings,
      ancestors,
      descendants,
      relatedTopics,
      contextText,
      keystoneScore
    }
  } finally {
    await session.close()
  }
}

/**
 * Build rich context text from multi-hop graph data
 * Formatted for LLM consumption with systems thinking perspective
 */
function buildContextText(context: Omit<MultiHopContext, 'contextText'>): string {
  const { centralTopic, parents, children, siblings, ancestors, descendants, relatedTopics, keystoneScore } = context

  let text = `SYSTEMS THINKING CONTEXT FOR: ${centralTopic.name}\n\n`

  // Central topic
  text += `## CENTRAL TOPIC\n`
  text += `${centralTopic.name} (Level ${centralTopic.hierarchy_level})\n`
  if (centralTopic.description) {
    text += `Description: ${centralTopic.description}\n`
  }
  text += `Keystone Score: ${keystoneScore} (${keystoneScore > 10 ? 'HIGH IMPACT' : keystoneScore > 5 ? 'MODERATE IMPACT' : 'LOW IMPACT'} topic)\n\n`

  // Hierarchy context
  if (parents.length > 0) {
    text += `## PARENT CONCEPTS (What ${centralTopic.name} is part of)\n`
    parents.forEach(p => text += `- ${p.name}: ${p.description || 'broader category'}\n`)
    text += `\n`
  }

  if (children.length > 0) {
    text += `## SUB-CONCEPTS (Components of ${centralTopic.name})\n`
    children.forEach(c => text += `- ${c.name}: ${c.description || 'subcategory'}\n`)
    text += `\n`
  }

  if (siblings.length > 0) {
    text += `## PEER CONCEPTS (Related topics at same level)\n`
    siblings.slice(0, 5).forEach(s => text += `- ${s.name}\n`)
    text += `\n`
  }

  // Multi-hop context
  if (ancestors.length > 0) {
    text += `## BROADER CONTEXT (Higher-level concepts)\n`
    ancestors.slice(0, 5).forEach(a => text += `- ${a.name}\n`)
    text += `\n`
  }

  if (descendants.length > 0) {
    text += `## DETAILED BREAKDOWN (Lower-level specifics)\n`
    descendants.slice(0, 7).forEach(d => text += `- ${d.name}\n`)
    text += `\n`
  }

  if (relatedTopics.length > 0) {
    text += `## RELATED TOPICS (Connected through shared concepts)\n`
    relatedTopics.slice(0, 5).forEach(r => text += `- ${r.name}\n`)
    text += `\n`
  }

  // Systems thinking insight
  text += `## SYSTEMS THINKING INSIGHT\n`
  if (keystoneScore > 10) {
    text += `This is a KEYSTONE topic - mastering it unlocks ${keystoneScore} related concepts. `
    text += `Changes in understanding here will cascade through many dependent topics.\n`
  } else if (parents.length > 0 && children.length > 0) {
    text += `This is a BRIDGE topic - it connects higher-level concepts (${parents[0].name}) `
    text += `to lower-level details (${children.length} subtopics). Understanding both levels is crucial.\n`
  } else if (children.length > 3) {
    text += `This is a CATEGORY topic with ${children.length} subtypes. `
    text += `Master the general concept first, then explore variations.\n`
  } else if (parents.length > 0) {
    text += `This is a SPECIFIC topic under ${parents[0].name}. `
    text += `Understanding the parent concept provides essential context.\n`
  }

  return text
}

/**
 * Get prioritized list of topics to learn based on graph centrality
 * Identifies "keystone" topics that unlock many others when mastered
 */
export async function getKeystoneTopics(limit: number = 10): Promise<Array<{topic: GraphNode, dependentCount: number}>> {
  const session = createSession()

  try {
    const result = await session.run(
      `MATCH (t:Topic)-[:HAS_TOPIC|HAS_SUBTOPIC*1..3]->(dependent:Topic)
       WITH t, count(DISTINCT dependent) as dependentCount
       WHERE dependentCount > 0
       RETURN t.id as id, t.name as name, t.description as description,
              t.hierarchy_level as hierarchy_level, dependentCount
       ORDER BY dependentCount DESC
       LIMIT $limit`,
      { limit }
    )

    return result.records.map(r => ({
      topic: {
        id: r.get('id'),
        name: r.get('name'),
        description: r.get('description') || '',
        hierarchy_level: r.get('hierarchy_level')
      },
      dependentCount: r.get('dependentCount').toNumber()
    }))
  } finally {
    await session.close()
  }
}
