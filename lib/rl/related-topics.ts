/**
 * Related Topics Discovery
 *
 * Finds semantically and hierarchically related topics using a hybrid approach:
 * 1. Knowledge Graph - explicit relationships (is_a, part_of, enables, etc.)
 * 2. Vector similarity (embeddings) - finds conceptually related topics
 * 3. Hierarchy filtering - excludes unrelated branches
 *
 * This enables cross-branch discovery:
 * - "Access badge" (physical security) → "Preventative control" (control type)
 * - Knowledge graph provides explainable relationships
 * - Embeddings fill gaps where explicit relationships don't exist
 */

import { createClient } from '@/lib/supabase/server'

export interface RelatedTopic {
  id: string
  name: string
  similarity: number
  relationship: 'ancestor' | 'prerequisite' | 'semantic' | 'is_a' | 'part_of' | 'requires' | 'contrasts_with' | 'enables' | 'mitigates'
  reasoning?: string // For knowledge graph relationships
}

/**
 * Find related topics for a given topic using hybrid approach
 *
 * @param topicId - UUID of the primary topic
 * @param limit - Maximum number of related topics to return (default: 4)
 * @returns Array of related topics with metadata
 */
export async function findRelatedTopics(
  topicId: string,
  limit: number = 4
): Promise<RelatedTopic[]> {
  const supabase = await createClient()

  // Step 1: Get knowledge graph relationships (priority)
  const { data: kgRelationships } = await supabase.rpc('get_related_topics_kg', {
    p_topic_id: topicId,
    p_min_confidence: 0.7,
    p_limit: limit
  })

  const kgTopics: RelatedTopic[] = []
  if (kgRelationships && kgRelationships.length > 0) {
    for (const rel of kgRelationships) {
      kgTopics.push({
        id: rel.topic_id,
        name: rel.topic_name,
        similarity: rel.confidence,
        relationship: rel.relationship_type,
        reasoning: rel.reasoning
      })
    }
  }

  // If we have enough high-quality KG relationships, return them
  if (kgTopics.length >= limit) {
    return kgTopics.slice(0, limit)
  }

  // Step 2: Get the primary topic with its embedding and hierarchy info
  const { data: primaryTopic, error: topicError } = await supabase
    .from('topics')
    .select('id, name, embedding, parent_topic_id, path, depth, prerequisites')
    .eq('id', topicId)
    .single()

  if (topicError || !primaryTopic) {
    console.error('Error fetching primary topic:', topicError)
    return kgTopics // Return KG topics even if primary topic fetch fails
  }

  if (!primaryTopic.embedding) {
    console.warn(`Topic ${primaryTopic.name} has no embedding. Run generate-topic-embeddings script.`)
    return kgTopics // Return KG topics even if no embedding
  }

  // Step 2: Get the root domain (depth = 0) for this topic
  // Extract root from path (e.g., "1.2.3" → "1")
  const rootPath = primaryTopic.path ? primaryTopic.path.split('.')[0] : null
  let rootDomain = null

  if (rootPath) {
    const { data: domainData } = await supabase
      .from('topics')
      .select('id, name, embedding')
      .eq('depth', 0)
      .eq('path', rootPath)
      .single()

    if (domainData && domainData.id !== topicId) {
      rootDomain = domainData
    }
  }

  // Step 3: Find semantically similar topics using vector similarity
  // Use cosine distance for similarity (lower = more similar)
  const { data: similarTopics, error: similarError } = await supabase.rpc(
    'find_similar_topics',
    {
      query_embedding: primaryTopic.embedding,
      match_threshold: 0.7, // Only topics with >70% similarity
      match_count: limit * 3, // Get more candidates for filtering
      exclude_topic_id: topicId // Don't include the topic itself
    }
  )

  if (similarError) {
    console.error('Error finding similar topics:', similarError)
    return []
  }

  if (!similarTopics || similarTopics.length === 0) {
    // Even if no similar topics, still return root domain if available
    if (rootDomain) {
      return [{
        id: rootDomain.id,
        name: rootDomain.name,
        similarity: 1.0,
        relationship: 'ancestor'
      }]
    }
    return []
  }

  // Step 3: Apply hierarchy filtering
  const relatedTopics: RelatedTopic[] = []

  for (const candidate of similarTopics) {
    // Extract path components for hierarchy comparison
    const primaryPath = primaryTopic.path || ''
    const candidatePath = candidate.path || ''

    // Determine relationship type
    let relationship: RelatedTopic['relationship'] = 'semantic'
    let shouldInclude = true

    // Check if it's an ancestor (parent, grandparent, etc.)
    if (primaryPath.startsWith(candidatePath) && candidatePath !== '') {
      relationship = 'ancestor'
    }
    // Check if it's a prerequisite
    else if (primaryTopic.prerequisites && primaryTopic.prerequisites.includes(candidate.id)) {
      relationship = 'prerequisite'
    }
    // Skip siblings (same parent) - they are alternatives, not conceptually related
    // Example: "Avoid", "Mitigate", "Transfer" are siblings but not helpful for learning context
    else if (primaryTopic.parent_topic_id === candidate.parent_topic_id && primaryTopic.parent_topic_id !== null) {
      shouldInclude = false
      continue  // Skip siblings entirely
    }
    // Check if it's from a DIFFERENT parent branch at same level
    // Example: "Data Plane" and "Control Plane" are siblings under "Zero Trust"
    // but "Policy Engine" (under Control Plane) should NOT show "Data Plane"
    else if (primaryTopic.depth >= 2 && candidate.depth >= 2) {
      // Get parent paths (everything except last component)
      const primaryParentPath = primaryPath.substring(0, primaryPath.lastIndexOf('.'))
      const candidateParentPath = candidatePath.substring(0, candidatePath.lastIndexOf('.'))

      // If parent paths differ, they're from different branches - exclude
      if (primaryParentPath !== candidateParentPath) {
        shouldInclude = false
      }
    }

    if (shouldInclude) {
      relatedTopics.push({
        id: candidate.id,
        name: candidate.name,
        similarity: candidate.similarity,
        relationship
      })
    }
  }

  // Step 4: Add root domain if not already included
  if (rootDomain && !relatedTopics.find(t => t.id === rootDomain.id)) {
    relatedTopics.push({
      id: rootDomain.id,
      name: rootDomain.name,
      similarity: 1.0, // High priority
      relationship: 'ancestor'
    })
  }

  // Step 5: Merge knowledge graph and embedding-based results
  // Combine both sources, prioritizing KG relationships
  const allTopics: RelatedTopic[] = [...kgTopics]

  // Add embedding-based topics that aren't already in KG results
  for (const topic of relatedTopics) {
    if (!allTopics.find(t => t.id === topic.id)) {
      allTopics.push(topic)
    }
  }

  // Step 6: Sort by priority and limit
  // Priority: KG relationships > ancestor > prerequisite > semantic
  const priorityOrder: Record<string, number> = {
    is_a: 1,
    part_of: 2,
    requires: 3,
    enables: 4,
    mitigates: 5,
    contrasts_with: 6,
    ancestor: 7,
    prerequisite: 8,
    semantic: 9
  }

  allTopics.sort((a, b) => {
    // First by relationship type
    const priorityDiff = priorityOrder[a.relationship] - priorityOrder[b.relationship]
    if (priorityDiff !== 0) return priorityDiff

    // Then by similarity/confidence (descending)
    return b.similarity - a.similarity
  })

  return allTopics.slice(0, limit)
}

/**
 * Get topic IDs from related topics array
 */
export function getRelatedTopicIds(relatedTopics: RelatedTopic[]): string[] {
  return relatedTopics.map(t => t.id)
}
