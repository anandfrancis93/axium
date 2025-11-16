/**
 * Semantic Cache Layer
 *
 * Fast retrieval of semantic data from Supabase cache instead of Neo4j.
 * Falls back to Neo4j if cache is stale or missing.
 */

import { createClient } from '@/lib/supabase/server'
import { getContextById as getContextFromNeo4j } from '@/lib/graphrag/context'
import type { GraphRAGContext } from '@/lib/graphrag/context'

export interface CachedEntity {
  id: string
  neo4j_id: string
  name: string
  type: string
  level: string
  full_path: string
  context_summary: string | null
  domain_name: string | null
  objective_name: string | null
  scopes: string[]
  difficulty_score: number | null
  learning_depth: number
  estimated_study_time: number | null
  prerequisite_count: number
  is_a_count: number
  part_of_count: number
  enables_count: number
  semantic_data_synced_at: string | null
}

export interface CachedRelationship {
  id: string
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  confidence: number
  reasoning: string | null
  strategy: string | null
}

export interface CachedPrerequisitePath {
  id: string
  target_entity_id: string
  path_depth: number
  path_entity_ids: string[]
  path_names: string[]
  total_difficulty: number | null
  estimated_total_time: number | null
  synced_at: string
}

export interface CachedDomainPath {
  id: string
  domain_name: string
  path_entity_ids: string[]
  path_nodes: Array<{
    id: string
    name: string
    level: string
    difficultyScore: number
    learningDepth: number
    estimatedStudyTime: number
  }>
  total_nodes: number
  total_difficulty: number | null
  estimated_total_time: number | null
  starting_point_ids: string[]
  synced_at: string
  expires_at: string
}

/**
 * Check if cache is stale for an entity
 */
export async function isCacheStale(
  entityId: string,
  maxAgeHours: number = 24
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_entities')
    .select('semantic_data_synced_at')
    .eq('id', entityId)
    .single()

  if (error || !data || !data.semantic_data_synced_at) {
    return true // No cache or error = stale
  }

  const lastSync = new Date(data.semantic_data_synced_at)
  const ageMs = Date.now() - lastSync.getTime()
  const ageHours = ageMs / (1000 * 60 * 60)

  return ageHours > maxAgeHours
}

/**
 * Get entity from cache by Supabase UUID
 */
export async function getCachedEntity(entityId: string): Promise<CachedEntity | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_entities')
    .select('*')
    .eq('id', entityId)
    .single()

  if (error || !data) {
    return null
  }

  return data as CachedEntity
}

/**
 * Get entity from cache by Neo4j ID
 */
export async function getCachedEntityByNeo4jId(neo4jId: string): Promise<CachedEntity | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_entities')
    .select('*')
    .eq('neo4j_id', neo4jId)
    .single()

  if (error || !data) {
    return null
  }

  return data as CachedEntity
}

/**
 * Get entity from cache by full path
 */
export async function getCachedEntityByPath(fullPath: string): Promise<CachedEntity | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_entities')
    .select('*')
    .eq('full_path', fullPath)
    .single()

  if (error || !data) {
    return null
  }

  return data as CachedEntity
}

/**
 * Get all prerequisites for an entity from cache
 */
export async function getCachedPrerequisites(entityId: string): Promise<CachedRelationship[]> {
  const supabase = await createClient()

  const { data, error} = await supabase
    .from('graphrag_relationships')
    .select('*')
    .eq('target_entity_id', entityId)
    .eq('relationship_type', 'PREREQUISITE')
    .order('confidence', { ascending: false })

  if (error || !data) {
    return []
  }

  return data as CachedRelationship[]
}

/**
 * Get all IS_A relationships for an entity from cache
 */
export async function getCachedIsARelationships(entityId: string): Promise<CachedRelationship[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_relationships')
    .select('*')
    .eq('source_entity_id', entityId)
    .eq('relationship_type', 'IS_A')

  if (error || !data) {
    return []
  }

  return data as CachedRelationship[]
}

/**
 * Get all PART_OF relationships for an entity from cache
 */
export async function getCachedPartOfRelationships(entityId: string): Promise<CachedRelationship[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_relationships')
    .select('*')
    .eq('source_entity_id', entityId)
    .eq('relationship_type', 'PART_OF')

  if (error || !data) {
    return []
  }

  return data as CachedRelationship[]
}

/**
 * Get concepts enabled by an entity (what depends on this)
 */
export async function getCachedEnabledConcepts(entityId: string): Promise<CachedRelationship[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_relationships')
    .select('*')
    .eq('source_entity_id', entityId)
    .eq('relationship_type', 'PREREQUISITE')

  if (error || !data) {
    return []
  }

  return data as CachedRelationship[]
}

/**
 * Get prerequisite path from cache
 */
export async function getCachedPrerequisitePath(
  entityId: string
): Promise<CachedPrerequisitePath | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_prerequisite_paths')
    .select('*')
    .eq('target_entity_id', entityId)
    .single()

  if (error || !data) {
    return null
  }

  return data as CachedPrerequisitePath
}

/**
 * Get domain learning path from cache
 */
export async function getCachedDomainPath(domainName: string): Promise<CachedDomainPath | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_domain_paths')
    .select('*')
    .eq('domain_name', domainName)
    .single()

  if (error || !data) {
    return null
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return null
  }

  return data as CachedDomainPath
}

/**
 * Get entities by domain from cache
 */
export async function getCachedEntitiesByDomain(
  domainName: string,
  minDepth: number = 2,
  limit: number = 50
): Promise<CachedEntity[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('graphrag_entities')
    .select('*')
    .eq('domain_name', domainName)
    .gte('learning_depth', minDepth)
    .order('learning_depth', { ascending: true })
    .order('difficulty_score', { ascending: true })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as CachedEntity[]
}

/**
 * Build GraphRAGContext from cached data
 *
 * This converts Supabase cache data to the same format as Neo4j getContextById()
 */
export async function buildContextFromCache(entityId: string): Promise<GraphRAGContext | null> {
  // Get entity
  const entity = await getCachedEntity(entityId)
  if (!entity) return null

  // Get relationships
  const [prerequisites, isARelationships, partOfRelationships, enabledConcepts] = await Promise.all([
    getCachedPrerequisites(entityId),
    getCachedIsARelationships(entityId),
    getCachedPartOfRelationships(entityId),
    getCachedEnabledConcepts(entityId)
  ])

  // Get target entities for relationships
  const supabase = await createClient()

  const isATargets = await Promise.all(
    isARelationships.map(async rel => {
      const { data } = await supabase
        .from('graphrag_entities')
        .select('id, name')
        .eq('id', rel.target_entity_id)
        .single()
      return data ? { ...data, confidence: rel.confidence, reasoning: rel.reasoning || '' } : null
    })
  )

  const partOfTargets = await Promise.all(
    partOfRelationships.map(async rel => {
      const { data } = await supabase
        .from('graphrag_entities')
        .select('id, name')
        .eq('id', rel.target_entity_id)
        .single()
      return data ? { ...data, confidence: rel.confidence, reasoning: rel.reasoning || '' } : null
    })
  )

  const prereqEntities = await Promise.all(
    prerequisites.map(async rel => {
      const { data } = await supabase
        .from('graphrag_entities')
        .select('id, name, difficulty_score, learning_depth')
        .eq('id', rel.source_entity_id)
        .single()
      return data
        ? {
            ...data,
            strategy: rel.strategy || 'unknown',
            confidence: rel.confidence,
            reasoning: rel.reasoning || ''
          }
        : null
    })
  )

  const enabledEntities = await Promise.all(
    enabledConcepts.map(async rel => {
      const { data } = await supabase
        .from('graphrag_entities')
        .select('id, name')
        .eq('id', rel.target_entity_id)
        .single()
      return data ? { ...data, relationshipType: 'PREREQUISITE' } : null
    })
  )

  // Build context object matching GraphRAGContext interface
  return {
    id: entity.neo4j_id, // Use Neo4j ID for compatibility
    name: entity.name,
    entityType: entity.type,
    depth: entity.learning_depth,
    summary: entity.context_summary,
    fullPath: entity.full_path,
    domain: entity.domain_name || '',
    objective: entity.objective_name,
    scopeTags: entity.scopes || [],
    parentName: null, // TODO: Fetch from hierarchy
    parentId: null,
    grandparentName: null,
    grandparentId: null,
    children: [], // TODO: Fetch children
    grandchildren: [],
    relatedConcepts: [], // TODO: Fetch cross-references
    semanticRelationships: {
      // Taxonomy
      isA: isATargets.filter(t => t !== null) as any[],
      partOf: partOfTargets.filter(t => t !== null) as any[],
      categoryOf: [],
      variantOf: [],

      // Educational
      prerequisites: prereqEntities.filter(e => e !== null) as any[],
      prerequisiteFor: [],
      dependsOn: [],
      contrastsWith: [],

      // Security
      protectsAgainst: [],
      attacks: [],

      // Technical
      implements: [],
      configures: [],
      requires: [],

      // Functional
      logs: [],
      monitors: [],
      scans: [],

      // Logical
      leadsTo: [],
      enables: [],

      // Backward compatibility
      enablesConcepts: enabledEntities.filter(e => e !== null) as any[]
    },
    learningMetadata: {
      difficultyScore: entity.difficulty_score || 1,
      learningDepth: entity.learning_depth,
      estimatedStudyTime: entity.estimated_study_time || 15,
      hasPrerequisites: entity.prerequisite_count > 0,
      prerequisiteCount: entity.prerequisite_count
    }
  }
}

/**
 * Get context with cache fallback to Neo4j
 *
 * Tries cache first, falls back to Neo4j if cache is stale or missing
 */
export async function getContextWithCache(
  entityId: string,
  maxCacheAgeHours: number = 24
): Promise<GraphRAGContext | null> {
  // Check if cache is stale
  const isStale = await isCacheStale(entityId, maxCacheAgeHours)

  if (!isStale) {
    // Try to build from cache
    const cachedContext = await buildContextFromCache(entityId)
    if (cachedContext) {
      return cachedContext
    }
  }

  // Fall back to Neo4j
  console.log(`Cache miss or stale for entity ${entityId}, fetching from Neo4j`)
  return await getContextFromNeo4j(entityId)
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_semantic_cache_stats')

  if (error) {
    console.error('Error getting cache stats:', error)
    return null
  }

  return data
}

/**
 * Clean up stale cache entries
 */
export async function cleanupStaleCache(maxAgeHours: number = 48) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('cleanup_stale_cache', {
    max_age_hours: maxAgeHours
  })

  if (error) {
    console.error('Error cleaning up cache:', error)
    return { expired_paths: 0, expired_domain_paths: 0 }
  }

  return data
}
