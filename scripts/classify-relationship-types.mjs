/**
 * Classify Relationship Types Using LLM
 *
 * Takes SIMILAR_TO/RELATED_TO pairs and determines specific relationship type
 * using Grok 4 Fast (e.g., PROTECTS_AGAINST, EXPLOITS, MITIGATES, etc.)
 *
 * Cost: 181 pairs × $0.00105 = $0.19
 */

import OpenAI from 'openai'
import neo4j from 'neo4j-driver'

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
})

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

// All 40+ relationship types from documentation
const RELATIONSHIP_TYPES = {
  TAXONOMY: ['IS_A', 'PART_OF', 'CATEGORY_OF', 'EXAMPLE_OF', 'VARIANT_OF'],
  SECURITY: ['PROTECTS_AGAINST', 'EXPLOITS', 'ATTACKS', 'DEFENDS', 'MITIGATES', 'DETECTS', 'PREVENTS', 'VULNERABLE_TO'],
  TECHNICAL: ['IMPLEMENTS', 'USES', 'REQUIRES', 'ENABLES', 'CONFIGURES', 'ENCRYPTS', 'DECRYPTS', 'AUTHENTICATES', 'AUTHORIZES', 'VALIDATES'],
  FUNCTIONAL: ['MONITORS', 'LOGS', 'ALERTS', 'FILTERS', 'BLOCKS', 'ALLOWS', 'SCANS'],
  EDUCATIONAL: ['DEPENDS_ON', 'PREREQUISITE_FOR', 'SIMILAR_TO', 'CONTRASTS_WITH', 'COMPARED_TO', 'SUPERSEDES'],
  LOGICAL: ['CAUSES', 'SOLVES', 'LEADS_TO', 'RESULTS_IN', 'TRIGGERS']
}

const ALL_TYPES = Object.values(RELATIONSHIP_TYPES).flat()

/**
 * Classify relationship between two topics using Grok
 */
async function classifyRelationship(topic1, topic2, desc1, desc2) {
  const prompt = `You are a cybersecurity knowledge graph expert. Determine the MOST SPECIFIC relationship type between two concepts.

CONCEPT 1: ${topic1}
Description: ${desc1}

CONCEPT 2: ${topic2}
Description: ${desc2}

AVAILABLE RELATIONSHIP TYPES (choose the MOST SPECIFIC):

TAXONOMY: IS_A, PART_OF, CATEGORY_OF, EXAMPLE_OF, VARIANT_OF
SECURITY: PROTECTS_AGAINST, EXPLOITS, ATTACKS, DEFENDS, MITIGATES, DETECTS, PREVENTS, VULNERABLE_TO
TECHNICAL: IMPLEMENTS, USES, REQUIRES, ENABLES, CONFIGURES, ENCRYPTS, DECRYPTS, AUTHENTICATES, AUTHORIZES, VALIDATES
FUNCTIONAL: MONITORS, LOGS, ALERTS, FILTERS, BLOCKS, ALLOWS, SCANS
EDUCATIONAL: DEPENDS_ON, PREREQUISITE_FOR, SIMILAR_TO, CONTRASTS_WITH, COMPARED_TO, SUPERSEDES
LOGICAL: CAUSES, SOLVES, LEADS_TO, RESULTS_IN, TRIGGERS

RULES:
1. Choose the MOST SPECIFIC type (prefer SECURITY/TECHNICAL over generic SIMILAR_TO)
2. Indicate direction: "topic1 → topic2" or "bidirectional"
3. If no specific relationship exists, use "RELATED_CONCEPT"

Return ONLY a JSON object:
{
  "relationshipType": "TYPE_NAME",
  "direction": "topic1_to_topic2" | "topic2_to_topic1" | "bidirectional",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`

  try {
    const response = await xai.chat.completions.create({
      model: 'grok-4-fast',
      max_tokens: 200,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'You are a knowledge graph expert. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ]
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('Empty response')

    // Parse JSON
    let jsonText = content
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```(?:json)?\n?/g, '').replace(/\n?```$/g, '').trim()
    }

    return JSON.parse(jsonText)
  } catch (error) {
    console.error(`Error classifying ${topic1} ↔ ${topic2}:`, error.message)
    return {
      relationshipType: 'RELATED_CONCEPT',
      direction: 'bidirectional',
      confidence: 0.5,
      reason: 'Classification failed, using generic type'
    }
  }
}

/**
 * Fetch similar/related pairs from Neo4j
 */
async function fetchSimilarPairs() {
  const session = driver.session()

  try {
    console.log('[1/3] Fetching SIMILAR_TO and RELATED_TO pairs from Neo4j...\n')

    const result = await session.run(`
      MATCH (t1)-[r:SIMILAR_TO|RELATED_TO]-(t2)
      WHERE r.method = 'embedding'
      AND id(t1) < id(t2)
      RETURN id(t1) AS id1,
             t1.name AS topic1,
             coalesce(t1.description, '') AS desc1,
             id(t2) AS id2,
             t2.name AS topic2,
             coalesce(t2.description, '') AS desc2,
             type(r) AS currentType,
             r.similarity AS similarity
      ORDER BY r.similarity DESC
    `)

    const pairs = result.records.map(record => ({
      id1: record.get('id1').toNumber(),
      topic1: record.get('topic1'),
      desc1: record.get('desc1'),
      id2: record.get('id2').toNumber(),
      topic2: record.get('topic2'),
      desc2: record.get('desc2'),
      currentType: record.get('currentType'),
      similarity: record.get('similarity')
    }))

    console.log(`   Found ${pairs.length} pairs to classify\n`)
    return pairs

  } finally {
    await session.close()
  }
}

/**
 * Classify all pairs and update Neo4j
 */
async function classifyAndUpdate(pairs) {
  const session = driver.session()

  console.log('[2/3] Classifying relationship types using Grok 4 Fast...')
  console.log(`   Cost: ~$${(pairs.length * 0.00105).toFixed(2)}\n`)

  const classifications = []
  let processedCount = 0

  try {
    for (const pair of pairs) {
      const classification = await classifyRelationship(
        pair.topic1,
        pair.topic2,
        pair.desc1 || pair.topic1,
        pair.desc2 || pair.topic2
      )

      classifications.push({
        ...pair,
        ...classification
      })

      processedCount++
      if (processedCount % 10 === 0) {
        process.stdout.write(`   Classified ${processedCount}/${pairs.length} pairs...\r`)
      }

      // Rate limiting: 1 request per 0.5 seconds
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`   Classified ${processedCount}/${pairs.length} pairs     \n`)

    // Show sample classifications
    console.log('\n📊 Sample Classifications:\n')
    console.log('='.repeat(70))
    classifications.slice(0, 10).forEach((c, i) => {
      const arrow = c.direction === 'bidirectional' ? '↔' :
                    c.direction === 'topic1_to_topic2' ? '→' : '←'
      console.log(`${i + 1}. ${c.topic1} ${arrow} ${c.topic2}`)
      console.log(`   Type: ${c.relationshipType}`)
      console.log(`   Reason: ${c.reason}`)
      console.log(`   Confidence: ${(c.confidence * 100).toFixed(0)}%\n`)
    })
    console.log('='.repeat(70))

    // Update Neo4j
    console.log('\n[3/3] Updating relationships in Neo4j...\n')

    let updatedCount = 0
    for (const c of classifications) {
      // Skip if confidence is too low or it's generic
      if (c.confidence < 0.6) continue
      if (c.relationshipType === 'RELATED_CONCEPT' && c.confidence < 0.8) continue

      try {
        // Delete old generic relationship
        await session.run(`
          MATCH (t1)-[r:SIMILAR_TO|RELATED_TO]-(t2)
          WHERE id(t1) = $id1 AND id(t2) = $id2
          AND r.method = 'embedding'
          DELETE r
        `, { id1: c.id1, id2: c.id2 })

        // Create new specific relationship
        const direction = c.direction === 'topic1_to_topic2' ? '->' :
                         c.direction === 'topic2_to_topic1' ? '<-' : '-'

        if (c.direction === 'bidirectional') {
          await session.run(`
            MATCH (t1), (t2)
            WHERE id(t1) = $id1 AND id(t2) = $id2
            MERGE (t1)-[r:${c.relationshipType}]-(t2)
            SET r.confidence = $confidence,
                r.reason = $reason,
                r.method = 'llm_classified',
                r.model = 'grok-4-fast'
          `, {
            id1: c.id1,
            id2: c.id2,
            confidence: c.confidence,
            reason: c.reason
          })
        } else {
          const sourceId = c.direction === 'topic1_to_topic2' ? c.id1 : c.id2
          const targetId = c.direction === 'topic1_to_topic2' ? c.id2 : c.id1

          await session.run(`
            MATCH (source), (target)
            WHERE id(source) = $sourceId AND id(target) = $targetId
            MERGE (source)-[r:${c.relationshipType}]->(target)
            SET r.confidence = $confidence,
                r.reason = $reason,
                r.method = 'llm_classified',
                r.model = 'grok-4-fast'
          `, {
            sourceId,
            targetId,
            confidence: c.confidence,
            reason: c.reason
          })
        }

        updatedCount++

        if (updatedCount % 10 === 0) {
          process.stdout.write(`   Updated ${updatedCount}/${classifications.length} relationships...\r`)
        }
      } catch (error) {
        console.error(`   Error updating ${c.topic1} ↔ ${c.topic2}:`, error.message)
      }
    }

    console.log(`   Updated ${updatedCount}/${classifications.length} relationships     \n`)

    return classifications

  } finally {
    await session.close()
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log('RELATIONSHIP TYPE CLASSIFICATION')
  console.log('='.repeat(70))
  console.log('Converts generic SIMILAR_TO/RELATED_TO into specific types\n')

  try {
    // Step 1: Fetch pairs
    const pairs = await fetchSimilarPairs()

    if (pairs.length === 0) {
      console.log('❌ No embedding-based relationships found')
      console.log('   Run find-topic-similarities.mjs first\n')
      return
    }

    // Step 2: Classify and update
    const classifications = await classifyAndUpdate(pairs)

    // Summary
    const typeCounts = {}
    classifications.forEach(c => {
      typeCounts[c.relationshipType] = (typeCounts[c.relationshipType] || 0) + 1
    })

    console.log('\n='.repeat(70))
    console.log('SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Pairs classified: ${classifications.length}`)
    console.log(`💰 Total cost: ~$${(classifications.length * 0.00105).toFixed(2)}`)
    console.log('\nRelationship Type Breakdown:')
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type.padEnd(30)} : ${count}`)
      })
    console.log('='.repeat(70))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    throw error
  } finally {
    await driver.close()
  }
}

main().catch(console.error)
