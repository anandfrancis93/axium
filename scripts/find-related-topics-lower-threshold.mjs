/**
 * Find Related Topics with Lower Threshold
 *
 * Checks similarity range 0.75-0.84 to find genuinely different
 * but related topics (not just singular/plural variations)
 */

import OpenAI from 'openai'
import neo4j from 'neo4j-driver'
import fs from 'fs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

// Load cached embeddings if available
const CACHE_FILE = 'topic-embeddings-cache.json'

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

async function main() {
  console.log('Finding related topics with threshold 0.75-0.84...\n')

  const session = driver.session()

  try {
    // Load cached embeddings
    if (!fs.existsSync(CACHE_FILE)) {
      console.log('❌ No embedding cache found. Run find-topic-similarities.mjs first.')
      return
    }

    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
    const { topics, embeddings } = cache

    console.log(`✅ Loaded ${topics.length} topics from cache\n`)

    // Find pairs with similarity 0.75-0.84
    const relatedPairs = []

    console.log('Analyzing pairs...')
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const similarity = cosineSimilarity(embeddings[i], embeddings[j])

        // Skip if same name or too similar (likely duplicates)
        if (topics[i].name === topics[j].name) continue
        if (similarity >= 0.85) continue

        // Find genuinely related topics
        if (similarity >= 0.75 && similarity < 0.85) {
          relatedPairs.push({
            topic1: topics[i].name,
            topic2: topics[j].name,
            similarity: similarity
          })
        }
      }

      if ((i + 1) % 100 === 0) {
        process.stdout.write(`   Processed ${i + 1}/${topics.length} topics...\r`)
      }
    }

    console.log(`   Found ${relatedPairs.length} related pairs (0.75-0.84 similarity)       \n`)

    if (relatedPairs.length === 0) {
      console.log('❌ No related pairs found in 0.75-0.84 range')
      console.log('   Most topics are either duplicates (>0.85) or unrelated (<0.75)\n')
      return
    }

    // Sort by similarity
    relatedPairs.sort((a, b) => b.similarity - a.similarity)

    // Show top 30
    console.log('🎯 Top 30 GENUINELY RELATED Topics (different concepts):\\n')
    console.log('='.repeat(70))

    relatedPairs.slice(0, 30).forEach((pair, i) => {
      console.log(`${i + 1}. ${pair.topic1}`)
      console.log(`   ↔ ${pair.topic2}`)
      console.log(`   Similarity: ${(pair.similarity * 100).toFixed(1)}%\n`)
    })

    // Ask user if they want to apply these
    console.log('='.repeat(70))
    console.log(`Found ${relatedPairs.length} related pairs total`)
    console.log('\\nApplying these as RELATED_TO relationships in Neo4j...\\n')

    // Apply to Neo4j
    let appliedCount = 0
    for (const pair of relatedPairs) {
      try {
        await session.run(`
          MATCH (t1:CurriculumEntity {name: $topic1})
          MATCH (t2:CurriculumEntity {name: $topic2})
          MERGE (t1)-[r:RELATED_TO]-(t2)
          SET r.similarity = $similarity,
              r.method = 'embedding',
              r.threshold = '0.75-0.84'
        `, {
          topic1: pair.topic1,
          topic2: pair.topic2,
          similarity: pair.similarity
        })

        appliedCount++

        if (appliedCount % 10 === 0) {
          process.stdout.write(`   Applied ${appliedCount}/${relatedPairs.length}...\r`)
        }
      } catch (error) {
        // Skip on error
      }
    }

    console.log(`   Applied ${appliedCount} relationships                \n`)
    console.log('='.repeat(70))
    console.log(`✅ Created ${appliedCount} RELATED_TO relationships`)
    console.log('💰 Cost: $0 (used cached embeddings)')
    console.log('='.repeat(70))

  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch(console.error)
