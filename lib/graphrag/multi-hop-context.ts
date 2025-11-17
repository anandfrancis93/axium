/**
 * Multi-Hop Graph Traversal for Systems Thinking
 *
 * Retrieves topic context by traversing the knowledge graph multiple hops away,
 * understanding relationships, dependencies, and cascading effects.
 */

import { createSession } from '@/lib/neo4j/client'
import { createClient } from '@supabase/supabase-js'

export interface GraphNode {
  id: string
  name: string
  description: string
  hierarchy_level: number
}

export interface MasteredGraphNode extends GraphNode {
  userMastery: number | null // 0-100, null if never studied
  isMastered: boolean // true if mastery >= 70%
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

export interface MasteryAwareContext {
  centralTopic: MasteredGraphNode
  parents: MasteredGraphNode[]
  children: MasteredGraphNode[]
  siblings: MasteredGraphNode[]
  ancestors: MasteredGraphNode[]
  descendants: MasteredGraphNode[]
  relatedTopics: MasteredGraphNode[]
  contextText: string
  keystoneScore: number
  masteredTopicIds: string[] // Quick lookup: which topics user has mastered
  notStudiedTopicIds: string[] // Quick lookup: which topics user hasn't studied
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
       LIMIT toInteger($limit)`,
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

/**
 * Get mastery-aware multi-hop context for a topic
 * Annotates all related topics with user's mastery status
 * Enables question generation that respects prerequisite knowledge
 */
export async function getMasteryAwareContext(
  userId: string,
  topicId: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  maxHops: number = 3
): Promise<MasteryAwareContext> {
  // Get base multi-hop context
  const baseContext = await getMultiHopContext(topicId, maxHops)

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Collect all topic IDs from the context
  const allTopicIds = new Set<string>([
    baseContext.centralTopic.id,
    ...baseContext.parents.map(t => t.id),
    ...baseContext.children.map(t => t.id),
    ...baseContext.siblings.map(t => t.id),
    ...baseContext.ancestors.map(t => t.id),
    ...baseContext.descendants.map(t => t.id),
    ...baseContext.relatedTopics.map(t => t.id)
  ])

  // Fetch user's mastery for all these topics
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('topic_id, mastery_scores')
    .eq('user_id', userId)
    .in('topic_id', Array.from(allTopicIds))

  // Build mastery map
  const masteryMap = new Map<string, number>()

  if (userProgress) {
    for (const progress of userProgress) {
      const scores = progress.mastery_scores as Record<string, any>

      // Calculate average mastery across all Bloom levels
      let totalMastery = 0
      let count = 0

      for (const levelScores of Object.values(scores)) {
        if (typeof levelScores === 'object' && levelScores !== null) {
          const avgForLevel = Object.values(levelScores as Record<string, number>).reduce(
            (sum, score) => sum + score, 0
          ) / Object.keys(levelScores).length
          totalMastery += avgForLevel
          count++
        } else if (typeof levelScores === 'number') {
          totalMastery += levelScores
          count++
        }
      }

      const avgMastery = count > 0 ? totalMastery / count : 0
      masteryMap.set(progress.topic_id, avgMastery)
    }
  }

  // Helper to annotate a GraphNode with mastery
  const annotateTopic = (node: GraphNode): MasteredGraphNode => {
    const mastery = masteryMap.get(node.id) ?? null
    return {
      ...node,
      userMastery: mastery,
      isMastered: mastery !== null && mastery >= 70
    }
  }

  // Annotate all topics
  const centralTopic = annotateTopic(baseContext.centralTopic)
  const parents = baseContext.parents.map(annotateTopic)
  const children = baseContext.children.map(annotateTopic)
  const siblings = baseContext.siblings.map(annotateTopic)
  const ancestors = baseContext.ancestors.map(annotateTopic)
  const descendants = baseContext.descendants.map(annotateTopic)
  const relatedTopics = baseContext.relatedTopics.map(annotateTopic)

  // Collect mastered and not-studied topic IDs
  const masteredTopicIds: string[] = []
  const notStudiedTopicIds: string[] = []

  const allAnnotated = [centralTopic, ...parents, ...children, ...siblings, ...ancestors, ...descendants, ...relatedTopics]
  for (const topic of allAnnotated) {
    if (topic.isMastered) {
      masteredTopicIds.push(topic.id)
    } else if (topic.userMastery === null) {
      notStudiedTopicIds.push(topic.id)
    }
  }

  // Build mastery-aware context text
  const contextText = buildMasteryAwareContextText({
    centralTopic,
    parents,
    children,
    siblings,
    ancestors,
    descendants,
    relatedTopics,
    keystoneScore: baseContext.keystoneScore
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
    keystoneScore: baseContext.keystoneScore,
    masteredTopicIds,
    notStudiedTopicIds
  }
}

/**
 * Build mastery-aware context text with clear indicators
 * Shows which topics user has mastered vs. not studied
 */
function buildMasteryAwareContextText(context: {
  centralTopic: MasteredGraphNode
  parents: MasteredGraphNode[]
  children: MasteredGraphNode[]
  siblings: MasteredGraphNode[]
  ancestors: MasteredGraphNode[]
  descendants: MasteredGraphNode[]
  relatedTopics: MasteredGraphNode[]
  keystoneScore: number
}): string {
  const { centralTopic, parents, children, siblings, ancestors, descendants, relatedTopics, keystoneScore } = context

  const formatTopic = (t: MasteredGraphNode) => {
    if (t.isMastered) {
      return `✅ ${t.name} (MASTERED - ${t.userMastery!.toFixed(0)}%)`
    } else if (t.userMastery !== null) {
      return `⚠️ ${t.name} (IN PROGRESS - ${t.userMastery!.toFixed(0)}%)`
    } else {
      return `❌ ${t.name} (NOT YET STUDIED)`
    }
  }

  let text = `MASTERY-AWARE SYSTEMS THINKING CONTEXT FOR: ${centralTopic.name}\n\n`

  // Central topic with mastery
  text += `## CENTRAL TOPIC\n`
  text += `${formatTopic(centralTopic)} (Level ${centralTopic.hierarchy_level})\n`
  if (centralTopic.description) {
    text += `Description: ${centralTopic.description}\n`
  }
  text += `Keystone Score: ${keystoneScore} (${keystoneScore > 10 ? 'HIGH IMPACT' : keystoneScore > 5 ? 'MODERATE IMPACT' : 'LOW IMPACT'} topic)\n\n`

  // Mastered topics first (can be referenced)
  const masteredParents = parents.filter(p => p.isMastered)
  const masteredSiblings = siblings.filter(s => s.isMastered)
  const masteredRelated = relatedTopics.filter(r => r.isMastered)
  const masteredAncestors = ancestors.filter(a => a.isMastered)

  if (masteredParents.length > 0 || masteredSiblings.length > 0 || masteredRelated.length > 0 || masteredAncestors.length > 0) {
    text += `## ✅ MASTERED TOPICS (Safe to reference in questions)\n\n`

    if (masteredParents.length > 0) {
      text += `Parent Concepts:\n`
      masteredParents.forEach(p => text += `- ${p.name} (${p.userMastery!.toFixed(0)}%)\n`)
      text += `\n`
    }

    if (masteredSiblings.length > 0) {
      text += `Peer Concepts:\n`
      masteredSiblings.slice(0, 5).forEach(s => text += `- ${s.name} (${s.userMastery!.toFixed(0)}%)\n`)
      text += `\n`
    }

    if (masteredRelated.length > 0) {
      text += `Related Applications:\n`
      masteredRelated.slice(0, 5).forEach(r => text += `- ${r.name} (${r.userMastery!.toFixed(0)}%)\n`)
      text += `\n`
    }

    if (masteredAncestors.length > 0) {
      text += `Broader Context:\n`
      masteredAncestors.slice(0, 3).forEach(a => text += `- ${a.name} (${a.userMastery!.toFixed(0)}%)\n`)
      text += `\n`
    }
  }

  // Not-yet-studied topics (cannot be referenced)
  const notStudiedParents = parents.filter(p => p.userMastery === null)
  const notStudiedSiblings = siblings.filter(s => s.userMastery === null)
  const notStudiedChildren = children.filter(c => c.userMastery === null)
  const notStudiedRelated = relatedTopics.filter(r => r.userMastery === null)

  if (notStudiedParents.length > 0 || notStudiedSiblings.length > 0 || notStudiedChildren.length > 0 || notStudiedRelated.length > 0) {
    text += `## ❌ NOT YET STUDIED (Do NOT reference in questions)\n\n`

    if (notStudiedParents.length > 0) {
      text += `Parent Concepts: ${notStudiedParents.map(p => p.name).join(', ')}\n`
    }

    if (notStudiedSiblings.length > 0) {
      text += `Peer Concepts: ${notStudiedSiblings.slice(0, 5).map(s => s.name).join(', ')}\n`
    }

    if (notStudiedChildren.length > 0) {
      text += `Sub-Concepts: ${notStudiedChildren.slice(0, 5).map(c => c.name).join(', ')}\n`
    }

    if (notStudiedRelated.length > 0) {
      text += `Related Topics: ${notStudiedRelated.slice(0, 5).map(r => r.name).join(', ')}\n`
    }

    text += `\n`
  }

  // Explicit instruction section
  text += `## 🎯 QUESTION GENERATION CONSTRAINTS\n\n`
  text += `CRITICAL RULES:\n`
  text += `1. Only reference topics marked ✅ MASTERED in your question\n`
  text += `2. Do NOT assume knowledge of topics marked ❌ NOT YET STUDIED\n`
  text += `3. Do NOT compare/contrast with unstudied topics\n`
  text += `4. Build questions that use only mastered topics as foundation\n`
  text += `5. If no mastered related topics exist, focus purely on the central topic\n\n`

  const masteredCount = masteredParents.length + masteredSiblings.length + masteredRelated.length
  if (masteredCount === 0) {
    text += `NOTE: User has no mastered related topics. Generate a self-contained question\n`
    text += `focusing only on ${centralTopic.name} without requiring external context.\n\n`
  } else {
    text += `You may use these mastered topics for comparisons, applications, or examples:\n`
    if (masteredParents.length > 0) {
      text += `- Parents: ${masteredParents.map(p => p.name).join(', ')}\n`
    }
    if (masteredSiblings.length > 0) {
      text += `- Peers: ${masteredSiblings.map(s => s.name).join(', ')}\n`
    }
    if (masteredRelated.length > 0) {
      text += `- Applications: ${masteredRelated.map(r => r.name).join(', ')}\n`
    }
    text += `\n`
  }

  return text
}
