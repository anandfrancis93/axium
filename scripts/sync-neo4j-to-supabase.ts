/**
 * Sync Neo4j Semantic Graph to Supabase Cache
 *
 * Populates Supabase cache tables with:
 * - Entity metadata (difficulty, learning depth, etc.)
 * - Semantic relationships (IS_A, PART_OF, PREREQUISITE)
 * - Prerequisite learning paths
 * - Domain learning paths
 *
 * Usage:
 *   npx tsx scripts/sync-neo4j-to-supabase.ts [--mode=full|incremental]
 */

import neo4j, { Driver, Session } from 'neo4j-driver'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/types/database'

// Environment variables
const NEO4J_URI = process.env.NEO4J_URI || ''
const NEO4J_USER = process.env.NEO4J_USERNAME || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Sync mode
const args = process.argv.slice(2)
const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'full'

interface SyncStats {
  entitiesSynced: number
  relationshipsSynced: number
  pathsGenerated: number
  domainPathsGenerated: number
  errors: string[]
}

const stats: SyncStats = {
  entitiesSynced: 0,
  relationshipsSynced: 0,
  pathsGenerated: 0,
  domainPathsGenerated: 0,
  errors: []
}

/**
 * Create Neo4j driver
 */
function createNeo4jDriver(): Driver {
  if (!NEO4J_URI || !NEO4J_PASSWORD) {
    throw new Error('Missing Neo4j configuration in environment variables')
  }
  return neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
}

/**
 * Create Supabase client with service role key (bypasses RLS)
 */
function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase configuration in environment variables')
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

/**
 * Convert Neo4j Integer to JavaScript number
 */
function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (value.toInt) return value.toInt() // Neo4j Integer object
  if (value.low !== undefined) return value.low // Neo4j Integer as plain object
  return parseInt(value, 10) || null
}

/**
 * Start sync job in database
 */
async function startSyncJob(supabase: ReturnType<typeof createSupabaseClient>, syncType: string) {
  const { data, error } = await supabase
    .from('graphrag_sync_log')
    .insert({
      sync_type: syncType,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data.id
}

/**
 * Complete sync job
 */
async function completeSyncJob(
  supabase: ReturnType<typeof createSupabaseClient>,
  jobId: string,
  stats: SyncStats,
  success: boolean
) {
  const duration = Date.now() - new Date().getTime()

  await supabase
    .from('graphrag_sync_log')
    .update({
      status: success ? 'completed' : 'failed',
      entities_synced: stats.entitiesSynced,
      relationships_synced: stats.relationshipsSynced,
      paths_generated: stats.pathsGenerated,
      completed_at: new Date().toISOString(),
      duration_ms: duration,
      error_message: stats.errors.length > 0 ? stats.errors.join('; ') : null,
      error_details: stats.errors.length > 0 ? { errors: stats.errors } : null
    })
    .eq('id', jobId)
}

/**
 * Sync all entities from Neo4j to Supabase
 */
async function syncEntities(
  neo4jSession: Session,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  console.log('\n📥 Syncing entities from Neo4j...')

  const result = await neo4jSession.run(`
    MATCH (entity:CurriculumEntity)
    RETURN
      entity.id as id,
      entity.name as name,
      entity.entityType as type,
      entity.level as level,
      entity.fullPath as full_path,
      entity.contextSummary as context_summary,
      entity.domainName as domain_name,
      entity.objectiveName as objective_name,
      entity.scopeTags as scopes,
      entity.depth as depth,
      entity.difficultyScore as difficulty_score,
      entity.learningDepth as learning_depth,
      entity.estimatedStudyTime as estimated_study_time
    ORDER BY entity.depth ASC, entity.name ASC
  `)

  console.log(`Found ${result.records.length} entities in Neo4j`)

  // Batch upsert in chunks of 100
  const BATCH_SIZE = 100
  for (let i = 0; i < result.records.length; i += BATCH_SIZE) {
    const batch = result.records.slice(i, i + BATCH_SIZE)

    const entities = batch.map(record => ({
      neo4j_id: record.get('id'),
      name: record.get('name'),
      type: record.get('type') || 'concept',
      level: record.get('level'),
      full_path: record.get('full_path'),
      context_summary: record.get('context_summary'),
      domain_name: record.get('domain_name'),
      objective_name: record.get('objective_name'),
      scopes: record.get('scopes') || [],
      difficulty_score: toNumber(record.get('difficulty_score')),
      learning_depth: toNumber(record.get('learning_depth')) || 0,
      estimated_study_time: toNumber(record.get('estimated_study_time')),
      semantic_data_synced_at: new Date().toISOString(),
      neo4j_synced_at: new Date().toISOString(),
      chapter_id: '00000000-0000-0000-0000-000000000000' // Placeholder
    }))

    const { error } = await supabase
      .from('graphrag_entities')
      .upsert(entities, {
        onConflict: 'neo4j_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error upserting entities batch:', error)
      stats.errors.push(`Entity batch ${i / BATCH_SIZE + 1}: ${error.message}`)
    } else {
      stats.entitiesSynced += entities.length
      console.log(`✅ Synced entities ${i + 1}-${Math.min(i + BATCH_SIZE, result.records.length)}`)
    }
  }

  // Count prerequisites for each entity
  console.log('\n📊 Counting relationships for each entity...')
  const countsResult = await neo4jSession.run(`
    MATCH (entity:CurriculumEntity)
    OPTIONAL MATCH (prereq)-[:PREREQUISITE]->(entity)
    OPTIONAL MATCH (entity)-[:IS_A]->(target)
    OPTIONAL MATCH (entity)-[:PART_OF]->(whole)
    OPTIONAL MATCH (entity)-[:PREREQUISITE]->(dependent)
    RETURN
      entity.id as id,
      count(DISTINCT prereq) as prerequisite_count,
      count(DISTINCT target) as is_a_count,
      count(DISTINCT whole) as part_of_count,
      count(DISTINCT dependent) as enables_count
  `)

  // Update counts in batches
  for (let i = 0; i < countsResult.records.length; i += BATCH_SIZE) {
    const batch = countsResult.records.slice(i, i + BATCH_SIZE)

    for (const record of batch) {
      const neo4jId = record.get('id')

      const { error } = await supabase
        .from('graphrag_entities')
        .update({
          prerequisite_count: Number(record.get('prerequisite_count')),
          is_a_count: Number(record.get('is_a_count')),
          part_of_count: Number(record.get('part_of_count')),
          enables_count: Number(record.get('enables_count'))
        })
        .eq('neo4j_id', neo4jId)

      if (error) {
        stats.errors.push(`Update counts for ${neo4jId}: ${error.message}`)
      }
    }

    console.log(`✅ Updated counts for entities ${i + 1}-${Math.min(i + BATCH_SIZE, countsResult.records.length)}`)
  }

  console.log(`\n✅ Synced ${stats.entitiesSynced} entities`)
}

/**
 * Sync all relationships from Neo4j to Supabase
 */
async function syncRelationships(
  neo4jSession: Session,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  console.log('\n📥 Syncing relationships from Neo4j...')

  // Get all semantic relationships
  const result = await neo4jSession.run(`
    MATCH (source:CurriculumEntity)-[r:IS_A|PART_OF|PREREQUISITE]->(target:CurriculumEntity)
    RETURN
      source.id as source_id,
      target.id as target_id,
      type(r) as relationship_type,
      r.confidence as confidence,
      r.reasoning as reasoning,
      r.strategy as strategy,
      r.extractedFrom as extracted_from
    ORDER BY type(r), source.name
  `)

  console.log(`Found ${result.records.length} semantic relationships in Neo4j`)

  // Get entity UUID mappings from Supabase
  const { data: entityMappings, error: mappingError } = await supabase
    .from('graphrag_entities')
    .select('id, neo4j_id')

  if (mappingError) {
    throw new Error(`Failed to get entity mappings: ${mappingError.message}`)
  }

  const neo4jToSupabaseId = new Map(
    entityMappings!.map(e => [e.neo4j_id, e.id])
  )

  // Batch upsert relationships
  const BATCH_SIZE = 100
  for (let i = 0; i < result.records.length; i += BATCH_SIZE) {
    const batch = result.records.slice(i, i + BATCH_SIZE)

    const relationships = batch
      .map(record => {
        const sourceNeo4jId = record.get('source_id')
        const targetNeo4jId = record.get('target_id')

        const sourceId = neo4jToSupabaseId.get(sourceNeo4jId)
        const targetId = neo4jToSupabaseId.get(targetNeo4jId)

        if (!sourceId || !targetId) {
          stats.errors.push(`Missing entity mapping: ${sourceNeo4jId} → ${targetNeo4jId}`)
          return null
        }

        return {
          source_entity_id: sourceId,
          target_entity_id: targetId,
          relationship_type: record.get('relationship_type'),
          confidence: record.get('confidence') || 1.0,
          reasoning: record.get('reasoning'),
          strategy: record.get('strategy'),
          neo4j_id: `${sourceNeo4jId}-${record.get('relationship_type')}-${targetNeo4jId}`,
          chapter_id: '00000000-0000-0000-0000-000000000000' // Placeholder
        }
      })
      .filter(r => r !== null)

    if (relationships.length > 0) {
      const { error } = await supabase
        .from('graphrag_relationships')
        .upsert(relationships as any[], {
          onConflict: 'neo4j_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error upserting relationships batch:', error)
        stats.errors.push(`Relationship batch ${i / BATCH_SIZE + 1}: ${error.message}`)
      } else {
        stats.relationshipsSynced += relationships.length
        console.log(`✅ Synced relationships ${i + 1}-${Math.min(i + BATCH_SIZE, result.records.length)}`)
      }
    }
  }

  console.log(`\n✅ Synced ${stats.relationshipsSynced} relationships`)
}

/**
 * Generate and cache prerequisite paths
 */
async function cachePrerequisitePaths(
  neo4jSession: Session,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  console.log('\n📥 Generating prerequisite paths...')

  // Find all entities with prerequisites
  const result = await neo4jSession.run(`
    MATCH (entity:CurriculumEntity)
    WHERE EXISTS {
      MATCH (prereq)-[:PREREQUISITE]->(entity)
    }
    RETURN entity.id as entity_id
  `)

  console.log(`Found ${result.records.length} entities with prerequisites`)

  // Get entity UUID mappings
  const { data: entityMappings } = await supabase
    .from('graphrag_entities')
    .select('id, neo4j_id')

  const neo4jToSupabaseId = new Map(
    entityMappings!.map(e => [e.neo4j_id, e.id])
  )

  // Generate path for each entity
  for (const record of result.records) {
    const neo4jId = record.get('entity_id')
    const supabaseId = neo4jToSupabaseId.get(neo4jId)

    if (!supabaseId) continue

    // Get shortest prerequisite path from Neo4j
    const pathResult = await neo4jSession.run(`
      MATCH (target:CurriculumEntity {id: $targetId})
      MATCH path = shortestPath((root)-[:PREREQUISITE*0..]->(target))
      WHERE NOT EXISTS {
        MATCH (other)-[:PREREQUISITE]->(root)
      }
      WITH path, nodes(path) as pathNodes
      ORDER BY length(path) DESC
      LIMIT 1
      RETURN
        [node in pathNodes | node.id] as path_ids,
        [node in pathNodes | node.name] as path_names,
        [node in pathNodes | node.difficultyScore] as difficulties,
        [node in pathNodes | node.estimatedStudyTime] as study_times,
        length(path) as path_length
    `, { targetId: neo4jId })

    if (pathResult.records.length === 0) continue

    const pathRecord = pathResult.records[0]
    const pathNeo4jIds = pathRecord.get('path_ids')
    const pathNames = pathRecord.get('path_names')
    const difficulties = pathRecord.get('difficulties')
    const studyTimes = pathRecord.get('study_times')

    // Convert Neo4j IDs to Supabase UUIDs
    const pathSupabaseIds = pathNeo4jIds
      .map((id: string) => neo4jToSupabaseId.get(id))
      .filter((id: string | undefined) => id !== undefined)

    const totalDifficulty = difficulties.reduce((sum: number, d: number) => sum + (d || 0), 0)
    const totalTime = studyTimes.reduce((sum: number, t: number) => sum + (t || 0), 0)

    // Upsert path
    const { error } = await supabase
      .from('graphrag_prerequisite_paths')
      .upsert({
        target_entity_id: supabaseId,
        path_depth: toNumber(pathRecord.get('path_length')) || 0, // Convert Neo4j Integer
        path_entity_ids: pathSupabaseIds,
        path_names: pathNames,
        total_difficulty: totalDifficulty,
        estimated_total_time: totalTime,
        synced_at: new Date().toISOString()
      }, {
        onConflict: 'target_entity_id',
        ignoreDuplicates: false
      })

    if (error) {
      stats.errors.push(`Path for ${neo4jId}: ${error.message}`)
    } else {
      stats.pathsGenerated++
    }
  }

  console.log(`\n✅ Generated ${stats.pathsGenerated} prerequisite paths`)
}

/**
 * Generate and cache domain learning paths
 */
async function cacheDomainPaths(
  neo4jSession: Session,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  console.log('\n📥 Generating domain learning paths...')

  // Get all domains
  const domainsResult = await neo4jSession.run(`
    MATCH (entity:CurriculumEntity)
    WHERE entity.domainName IS NOT NULL
    RETURN DISTINCT entity.domainName as domain_name
  `)

  console.log(`Found ${domainsResult.records.length} domains`)

  // Get entity UUID mappings
  const { data: entityMappings } = await supabase
    .from('graphrag_entities')
    .select('id, neo4j_id, difficulty_score, learning_depth, estimated_study_time')

  const neo4jToEntity = new Map(
    entityMappings!.map(e => [e.neo4j_id, e])
  )

  for (const domainRecord of domainsResult.records) {
    const domainName = domainRecord.get('domain_name')

    // Get optimal learning path for domain
    const pathResult = await neo4jSession.run(`
      MATCH (entity:CurriculumEntity)
      WHERE entity.domainName = $domain
        AND entity.level IN ['topic', 'subtopic']
      RETURN
        entity.id as id,
        entity.name as name,
        entity.difficultyScore as difficulty,
        entity.learningDepth as depth,
        entity.estimatedStudyTime as study_time,
        entity.level as level
      ORDER BY entity.learningDepth ASC, entity.difficultyScore ASC
      LIMIT 50
    `, { domain: domainName })

    const pathNeo4jIds = pathResult.records.map(r => r.get('id'))
    const pathNodes = pathResult.records.map(r => ({
      id: neo4jToEntity.get(r.get('id'))?.id,
      name: r.get('name'),
      level: r.get('level'),
      difficultyScore: r.get('difficulty') || 0,
      learningDepth: r.get('depth') || 0,
      estimatedStudyTime: r.get('study_time') || 15
    })).filter(node => node.id !== undefined)

    const pathSupabaseIds = pathNeo4jIds
      .map((id: string) => neo4jToEntity.get(id)?.id)
      .filter((id: string | undefined) => id !== undefined)

    // Find starting points (learning depth 0)
    const startingPointIds = pathNodes
      .filter(node => node.learningDepth === 0)
      .map(node => node.id)

    const totalDifficulty = pathNodes.reduce((sum, node) => sum + node.difficultyScore, 0)
    const totalTime = pathNodes.reduce((sum, node) => sum + node.estimatedStudyTime, 0)

    // Upsert domain path
    const { error } = await supabase
      .from('graphrag_domain_paths')
      .upsert({
        domain_name: domainName,
        path_entity_ids: pathSupabaseIds,
        path_nodes: pathNodes,
        total_nodes: pathNodes.length,
        total_difficulty: totalDifficulty,
        estimated_total_time: totalTime,
        starting_point_ids: startingPointIds,
        synced_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }, {
        onConflict: 'domain_name',
        ignoreDuplicates: false
      })

    if (error) {
      stats.errors.push(`Domain path for ${domainName}: ${error.message}`)
    } else {
      stats.domainPathsGenerated++
      console.log(`✅ Generated path for domain: ${domainName} (${pathNodes.length} nodes)`)
    }
  }

  console.log(`\n✅ Generated ${stats.domainPathsGenerated} domain paths`)
}

/**
 * Main sync function
 */
async function sync() {
  console.log('🔄 Starting Neo4j → Supabase sync')
  console.log(`Mode: ${mode}`)
  console.log('='.repeat(60))

  const neo4jDriver = createNeo4jDriver()
  const supabase = createSupabaseClient()
  const neo4jSession = neo4jDriver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' })

  let jobId: string | null = null

  try {
    // Start sync job
    jobId = await startSyncJob(supabase, mode)
    console.log(`Started sync job: ${jobId}`)

    // Sync entities
    await syncEntities(neo4jSession, supabase)

    // Sync relationships
    await syncRelationships(neo4jSession, supabase)

    // Cache prerequisite paths
    await cachePrerequisitePaths(neo4jSession, supabase)

    // Cache domain paths
    await cacheDomainPaths(neo4jSession, supabase)

    // Complete sync job
    if (jobId) {
      await completeSyncJob(supabase, jobId, stats, stats.errors.length === 0)
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Sync Summary')
    console.log('='.repeat(60))
    console.log(`Entities synced: ${stats.entitiesSynced}`)
    console.log(`Relationships synced: ${stats.relationshipsSynced}`)
    console.log(`Prerequisite paths generated: ${stats.pathsGenerated}`)
    console.log(`Domain paths generated: ${stats.domainPathsGenerated}`)
    console.log(`Errors: ${stats.errors.length}`)

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors:')
      stats.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`))
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`)
      }
    }

    if (stats.errors.length === 0) {
      console.log('\n🎉 Sync completed successfully!')
    } else {
      console.log('\n⚠️  Sync completed with errors')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Sync failed:', error)

    if (jobId) {
      await completeSyncJob(supabase, jobId, stats, false)
    }

    process.exit(1)
  } finally {
    await neo4jSession.close()
    await neo4jDriver.close()
  }
}

// Run sync
sync()
