/**
 * Identify Semantic Relationships Between Topics
 *
 * Compares each topic with every other topic to identify meaningful relationships
 * beyond the hierarchical HAS_TOPIC/HAS_SUBTOPIC structure.
 */

import neo4j from 'neo4j-driver'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })

const NEO4J_URI = process.env.NEO4J_URI!
const NEO4J_USER = process.env.NEO4J_USERNAME!
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!

// Initialize xAI Grok client
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
})

interface Topic {
  id: string
  name: string
  description: string
  hierarchy_level: number
}

interface IdentifiedRelationship {
  source: string
  target: string
  type: string
  reason: string
  confidence: number
  bidirectional: boolean
}

// Relationship types taxonomy
const RELATIONSHIP_TYPES = [
  'IS_A',                    // Subtype/supertype (e.g., Phishing IS_A Social Engineering Attack)
  'PART_OF',                 // Component relationship (e.g., Encryption PART_OF PKI)
  'PREREQUISITE_FOR',        // Required before (e.g., Authentication PREREQUISITE_FOR Authorization)
  'LEADS_TO',                // Causal (e.g., Misconfiguration LEADS_TO Vulnerability)
  'PROTECTS_AGAINST',        // Defensive (e.g., Firewall PROTECTS_AGAINST Network Attack)
  'EXPLOITS',                // Attack vector (e.g., SQL Injection EXPLOITS Web Application)
  'MITIGATES',               // Risk reduction (e.g., Patching MITIGATES Zero-day)
  'IMPLEMENTS',              // Realizes/applies (e.g., TLS IMPLEMENTS Encryption)
  'REQUIRES',                // Dependency (e.g., Digital Signature REQUIRES PKI)
  'CONTRASTS_WITH',          // Opposite/alternative (e.g., Symmetric CONTRASTS_WITH Asymmetric)
  'RELATED_TO',              // Generic semantic relationship
  'SIMILAR_TO',              // Analogous concepts
  'VARIANT_OF',              // Different form of same concept
  'USES',                    // Utilization (e.g., VPN USES Encryption)
  'DEPENDS_ON',              // Operational dependency
  'ENABLES',                 // Makes possible (e.g., Authentication ENABLES Access Control)
  'CATEGORY_OF',             // Grouping (e.g., Malware CATEGORY_OF Ransomware)
  'ATTACKS',                 // Offensive relationship
  'MONITORS',                // Surveillance relationship
  'CONFIGURES',              // Configuration relationship
  'VALIDATES',               // Verification relationship
]

const BATCH_SIZE = 10 // Compare 10 pairs at a time
const CONFIDENCE_THRESHOLD = 60 // Minimum confidence to create relationship

async function main() {
  console.log('=' .repeat(70))
  console.log('IDENTIFY TOPIC RELATIONSHIPS')
  console.log('=' .repeat(70))
  console.log('Comparing all topics to identify semantic relationships\n')

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const session = driver.session()

  try {
    // Fetch all topics
    console.log('[1/4] Fetching all topics from Neo4j...\n')
    const result = await session.run(`
      MATCH (t:Topic)
      RETURN t.id as id, t.name as name, t.description as description, t.hierarchy_level as hierarchy_level
      ORDER BY t.name
    `)

    const topics: Topic[] = result.records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      description: record.get('description') || '',
      hierarchy_level: record.get('hierarchy_level')
    }))

    console.log(`   Found ${topics.length} topics\n`)

    // Generate all unique pairs (excluding self-comparisons)
    console.log('[2/4] Generating topic pairs for comparison...\n')
    const pairs: Array<[Topic, Topic]> = []

    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        // Skip pairs that are already connected via hierarchy
        const topic1 = topics[i]
        const topic2 = topics[j]

        pairs.push([topic1, topic2])
      }
    }

    console.log(`   Generated ${pairs.length} unique pairs to analyze\n`)
    console.log(`   Estimated cost: ~$${((pairs.length / BATCH_SIZE) * 0.01).toFixed(2)} (at $0.01 per batch)\n`)

    // Process pairs in batches
    console.log('[3/4] Analyzing relationships using Grok 4 Fast...\n')

    const allRelationships: IdentifiedRelationship[] = []
    let processedPairs = 0

    for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
      const batch = pairs.slice(i, i + BATCH_SIZE)

      try {
        const batchRelationships = await analyzeBatch(batch)
        allRelationships.push(...batchRelationships)
        processedPairs += batch.length

        // Progress indicator
        if (processedPairs % 100 === 0 || processedPairs === pairs.length) {
          console.log(`   Analyzed ${processedPairs}/${pairs.length} pairs...`)
        }

        // Rate limiting - wait 1 second between batches
        if (i + BATCH_SIZE < pairs.length) {
          await sleep(1000)
        }
      } catch (error) {
        console.error(`   Error processing batch ${i}-${i + batch.length}:`, error)
        // Continue with next batch
      }
    }

    console.log(`\n   Total relationships identified: ${allRelationships.length}`)

    // Filter by confidence threshold
    const filteredRelationships = allRelationships.filter(r => r.confidence >= CONFIDENCE_THRESHOLD)
    console.log(`   After confidence filter (≥${CONFIDENCE_THRESHOLD}%): ${filteredRelationships.length}\n`)

    // Save to file for review
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `identified-relationships-${timestamp}.json`
    fs.writeFileSync(filename, JSON.stringify(filteredRelationships, null, 2))
    console.log(`   Saved relationships to ${filename}\n`)

    // Create relationships in Neo4j
    console.log('[4/4] Creating relationships in Neo4j...\n')

    let createdCount = 0
    for (const rel of filteredRelationships) {
      try {
        await session.run(`
          MATCH (source:Topic {name: $sourceName})
          MATCH (target:Topic {name: $targetName})
          MERGE (source)-[r:${rel.type}]->(target)
          ON CREATE SET
            r.reason = $reason,
            r.confidence = $confidence,
            r.created_at = datetime()
        `, {
          sourceName: rel.source,
          targetName: rel.target,
          reason: rel.reason,
          confidence: rel.confidence
        })

        // If bidirectional, create reverse relationship too
        if (rel.bidirectional) {
          await session.run(`
            MATCH (source:Topic {name: $sourceName})
            MATCH (target:Topic {name: $targetName})
            MERGE (target)-[r:${rel.type}]->(source)
            ON CREATE SET
              r.reason = $reason,
              r.confidence = $confidence,
              r.created_at = datetime()
          `, {
            sourceName: rel.source,
            targetName: rel.target,
            reason: rel.reason,
            confidence: rel.confidence
          })
        }

        createdCount++
        if (createdCount % 50 === 0) {
          console.log(`   Created ${createdCount}/${filteredRelationships.length} relationships...`)
        }
      } catch (error) {
        console.error(`   Error creating relationship ${rel.source} -> ${rel.target}:`, error)
      }
    }

    console.log(`\n   Created ${createdCount} relationships in Neo4j\n`)

    // Summary
    console.log('=' .repeat(70))
    console.log('SUMMARY')
    console.log('=' .repeat(70))
    console.log(`✅ Topics analyzed: ${topics.length}`)
    console.log(`✅ Pairs compared: ${pairs.length}`)
    console.log(`✅ Relationships identified: ${allRelationships.length}`)
    console.log(`✅ High-confidence relationships (≥${CONFIDENCE_THRESHOLD}%): ${filteredRelationships.length}`)
    console.log(`✅ Relationships created in Neo4j: ${createdCount}`)
    console.log(`💾 Full results saved to: ${filename}`)
    console.log('=' .repeat(70))

  } catch (error) {
    console.error('Error:', error)
    throw error
  } finally {
    await session.close()
    await driver.close()
  }
}

async function analyzeBatch(batch: Array<[Topic, Topic]>): Promise<IdentifiedRelationship[]> {
  const prompt = `You are a cybersecurity knowledge graph expert. Analyze the following pairs of cybersecurity topics and identify semantic relationships between them.

For each pair, determine:
1. Is there a meaningful semantic relationship? (not just that they're both security topics)
2. What type of relationship? Choose from: ${RELATIONSHIP_TYPES.join(', ')}
3. Direction: Which is source and which is target?
4. Is it bidirectional (relationship applies both ways)?
5. Confidence level (0-100%)
6. Brief reason explaining the relationship

IMPORTANT RULES:
- Only identify relationships with confidence ≥ 60%
- Focus on direct, specific relationships (not vague connections)
- Prefer specific relationship types over generic RELATED_TO
- If no meaningful relationship exists, skip that pair
- For hierarchical relationships (parent-child), skip them as they already exist

Topic Pairs to Analyze:
${batch.map(([t1, t2], idx) => `
${idx + 1}. "${t1.name}" ↔ "${t2.name}"
   ${t1.name}: ${t1.description.substring(0, 100)}...
   ${t2.name}: ${t2.description.substring(0, 100)}...
`).join('\n')}

Respond with a JSON array of relationships. Example:
[
  {
    "source": "Phishing",
    "target": "Social Engineering",
    "type": "IS_A",
    "reason": "Phishing is a specific type of social engineering attack",
    "confidence": 95,
    "bidirectional": false
  }
]

If no relationships found for a pair, omit it from the array. Return only valid JSON.`

  const response = await xai.chat.completions.create({
    model: 'grok-4-fast',
    messages: [
      { role: 'system', content: 'You are a cybersecurity ontology expert. Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
  })

  const content = response.choices[0].message.content || '[]'

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  }

  try {
    const relationships: IdentifiedRelationship[] = JSON.parse(jsonStr)
    return relationships
  } catch (error) {
    console.error('   Failed to parse AI response:', content.substring(0, 200))
    return []
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main()
