/**
 * Related Topics Discovery
 *
 * Finds semantically and hierarchically related topics using a hybrid approach:
 * 1. Vector similarity (embeddings) - finds conceptually related topics
 * 2. Hierarchy filtering - excludes unrelated branches
 *
 * This ensures topics like "Policy Engine" show "Control Plane" and "Policy Administrator"
 * but NOT "Data Plane" (different branch under Zero Trust)
 */

import { createClient } from '@/lib/supabase/server'

export interface RelatedTopic {
  id: string
  name: string
  similarity: number
  relationship: 'ancestor' | 'sibling' | 'prerequisite' | 'semantic'
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

  // Step 1: Get the primary topic with its embedding and hierarchy info
  const { data: primaryTopic, error: topicError } = await supabase
    .from('topics')
    .select('id, name, embedding, parent_topic_id, path, depth, prerequisites')
    .eq('id', topicId)
    .single()

  if (topicError || !primaryTopic) {
    console.error('Error fetching primary topic:', topicError)
    return []
  }

  if (!primaryTopic.embedding) {
    console.warn(`Topic ${primaryTopic.name} has no embedding. Run generate-topic-embeddings script.`)
    return []
  }

  // Step 2: Find semantically similar topics using vector similarity
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
    // Check if it's a sibling (same parent)
    else if (primaryTopic.parent_topic_id === candidate.parent_topic_id && primaryTopic.parent_topic_id !== null) {
      relationship = 'sibling'
    }
    // Check if it's a prerequisite
    else if (primaryTopic.prerequisites && primaryTopic.prerequisites.includes(candidate.id)) {
      relationship = 'prerequisite'
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

  // Step 4: Sort by priority and limit
  // Priority: ancestor > prerequisite > sibling > semantic
  const priorityOrder = {
    ancestor: 1,
    prerequisite: 2,
    sibling: 3,
    semantic: 4
  }

  relatedTopics.sort((a, b) => {
    // First by relationship type
    const priorityDiff = priorityOrder[a.relationship] - priorityOrder[b.relationship]
    if (priorityDiff !== 0) return priorityDiff

    // Then by similarity (descending)
    return b.similarity - a.similarity
  })

  return relatedTopics.slice(0, limit)
}

/**
 * Get topic IDs from related topics array
 */
export function getRelatedTopicIds(relatedTopics: RelatedTopic[]): string[] {
  return relatedTopics.map(t => t.id)
}
