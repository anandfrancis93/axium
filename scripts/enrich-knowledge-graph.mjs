/**
 * Enrich Knowledge Graph with Cross-Topic Relationships
 *
 * Runs graph-based inference to find relationships between topics
 * without any API calls (FREE).
 */

import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function inferCrossTopicRelationships() {
  const session = driver.session()
  const relationships = []

  try {
    console.log('[Graph Inference] Finding cross-topic relationships...\n')

    // 1. Find topics that share concepts (co-occurrence)
    console.log('1. Finding topics with shared concepts...')
    const sharedConceptsQuery = `
      MATCH (t1:CurriculumEntity)-[r1]-(c:CurriculumEntity)-[r2]-(t2:CurriculumEntity)
      WHERE t1 <> t2
      AND id(t1) < id(t2)
      AND type(r1) IN ['PART_OF', 'IS_A', 'RELATED_CONCEPT', 'PREREQUISITE']
      AND type(r2) IN ['PART_OF', 'IS_A', 'RELATED_CONCEPT', 'PREREQUISITE']
      WITH t1, t2, collect(DISTINCT c.name) AS sharedConcepts
      WHERE size(sharedConcepts) >= 2
      RETURN t1.name AS topic1, t2.name AS topic2, sharedConcepts, size(sharedConcepts) AS count
      ORDER BY count DESC
      LIMIT 100
    `

    const sharedResult = await session.run(sharedConceptsQuery)
    console.log(`   Found ${sharedResult.records.length} shared concept pairs`)

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
        confidence: Math.min(count / 5, 1.0)
      })
    })

    // 2. Find prerequisite chains
    console.log('\n2. Finding prerequisite chains...')
    const prerequisiteChainQuery = `
      MATCH path = (t1:CurriculumEntity)-[:PREREQUISITE*2..3]->(t2:CurriculumEntity)
      WHERE NOT EXISTS((t1)-[:PREREQUISITE]->(t2))
      RETURN t1.name AS topic1, t2.name AS topic2, length(path) AS distance
      LIMIT 50
    `

    const prereqResult = await session.run(prerequisiteChainQuery)
    console.log(`   Found ${prereqResult.records.length} prerequisite chains`)

    prereqResult.records.forEach(record => {
      relationships.push({
        sourceTopic: record.get('topic1'),
        targetTopic: record.get('topic2'),
        relationshipType: 'PREREQUISITE',
        reason: `Indirect prerequisite (${record.get('distance').toNumber()} steps)`,
        confidence: 1.0 / record.get('distance').toNumber()
      })
    })

    // 3. Find parent-child hierarchies that aren't direct
    console.log('\n3. Finding hierarchical relationships...')
    const hierarchyQuery = `
      MATCH path = (t1:CurriculumEntity)-[:PARENT_OF*2..3]->(t2:CurriculumEntity)
      WHERE NOT EXISTS((t1)-[:PARENT_OF]->(t2))
      RETURN t1.name AS topic1, t2.name AS topic2, length(path) AS distance
      LIMIT 50
    `

    const hierarchyResult = await session.run(hierarchyQuery)
    console.log(`   Found ${hierarchyResult.records.length} hierarchical relationships`)

    hierarchyResult.records.forEach(record => {
      relationships.push({
        sourceTopic: record.get('topic1'),
        targetTopic: record.get('topic2'),
        relationshipType: 'PARENT_OF',
        reason: `Ancestor-descendant (${record.get('distance').toNumber()} levels)`,
        confidence: 0.8 / record.get('distance').toNumber()
      })
    })

    console.log(`\n[Graph Inference] Total inferred relationships: ${relationships.length}`)
    return relationships

  } finally {
    await session.close()
  }
}

async function applyInferredRelationships(relationships, minConfidence = 0.5) {
  const session = driver.session()
  let appliedCount = 0

  try {
    const filtered = relationships.filter(r => r.confidence >= minConfidence)
    console.log(`\n[Applying] Processing ${filtered.length} relationships (confidence >= ${minConfidence})...\n`)

    for (const rel of filtered) {
      try {
        const query = `
          MATCH (source:CurriculumEntity {name: $sourceTopic})
          MATCH (target:CurriculumEntity {name: $targetTopic})
          MERGE (source)-[r:${rel.relationshipType}]->(target)
          SET r.inferred = true, r.reason = $reason, r.confidence = $confidence
          RETURN source.name, target.name
        `

        await session.run(query, {
          sourceTopic: rel.sourceTopic,
          targetTopic: rel.targetTopic,
          reason: rel.reason,
          confidence: rel.confidence
        })

        appliedCount++

        if (appliedCount % 10 === 0) {
          process.stdout.write(`   Applied ${appliedCount}/${filtered.length} relationships...\r`)
        }
      } catch (error) {
        console.error(`   Error applying relationship: ${rel.sourceTopic} -> ${rel.targetTopic}:`, error.message)
      }
    }

    console.log(`\n[Applied] Successfully created ${appliedCount} inferred relationships`)
    return appliedCount

  } finally {
    await session.close()
  }
}

async function enrichKnowledgeGraph(minConfidence = 0.6) {
  console.log('='.repeat(60))
  console.log('KNOWLEDGE GRAPH ENRICHMENT')
  console.log('='.repeat(60))
  console.log(`Min Confidence Threshold: ${minConfidence}`)
  console.log(`Cost: $0 (no API calls)\n`)

  try {
    // Step 1: Infer relationships
    const relationships = await inferCrossTopicRelationships()

    if (relationships.length === 0) {
      console.log('\n❌ No relationships found. Your graph may be too sparse.')
      return
    }

    // Step 2: Show sample relationships
    console.log('\n' + '='.repeat(60))
    console.log('SAMPLE INFERRED RELATIONSHIPS')
    console.log('='.repeat(60))
    relationships.slice(0, 10).forEach((rel, i) => {
      console.log(`${i + 1}. ${rel.sourceTopic}`)
      console.log(`   → ${rel.relationshipType} →`)
      console.log(`   ${rel.targetTopic}`)
      console.log(`   Reason: ${rel.reason}`)
      console.log(`   Confidence: ${(rel.confidence * 100).toFixed(0)}%\n`)
    })

    // Step 3: Apply high-confidence relationships
    const appliedCount = await applyInferredRelationships(relationships, minConfidence)

    console.log('\n' + '='.repeat(60))
    console.log('ENRICHMENT COMPLETE!')
    console.log('='.repeat(60))
    console.log(`✅ Applied ${appliedCount} new relationships to Neo4j`)
    console.log(`💰 Cost: $0 (graph-based inference)`)
    console.log(`⚡ Time: < 1 minute`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error during enrichment:', error)
    throw error
  } finally {
    await driver.close()
  }
}

// Run enrichment
enrichKnowledgeGraph(0.6).catch(console.error)
