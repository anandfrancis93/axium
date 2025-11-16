/**
 * Find Topic Similarities Using Embeddings
 *
 * Generates embeddings for all topics and finds similar pairs
 * without needing existing graph connections.
 *
 * Cost: ~$0.01 for 804 topics (one-time)
 */

import OpenAI from 'openai'
import neo4j from 'neo4j-driver'
import fs from 'fs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const CACHE_FILE = 'topic-embeddings-cache.json'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Fetch all topics from Neo4j
 */
async function fetchTopics() {
  const session = driver.session()

  try {
    console.log('[1/5] Fetching topics from Neo4j...')

    const result = await session.run(`
      MATCH (t:CurriculumEntity)
      RETURN t.name AS name,
             coalesce(t.description, t.name) AS description,
             id(t) AS id
      ORDER BY t.name
    `)

    const topics = result.records.map(record => ({
      name: record.get('name'),
      description: record.get('description'),
      id: record.get('id').toNumber()
    }))

    console.log(`   Found ${topics.length} topics\n`)
    return topics

  } finally {
    await session.close()
  }
}

/**
 * Generate embeddings for all topics in batches
 */
async function generateEmbeddings(topics, batchSize = 100) {
  console.log('[2/5] Generating embeddings...')
  console.log(`   Model: text-embedding-3-small`)
  console.log(`   Cost: ~$${(topics.length * 0.00001).toFixed(4)}\n`)

  const embeddings = []
  const totalBatches = Math.ceil(topics.length / batchSize)

  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1

    process.stdout.write(`   Batch ${batchNum}/${totalBatches}: Processing ${batch.length} topics...`)

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch.map(t => `${t.name}: ${t.description}`)
    })

    embeddings.push(...response.data.map(d => d.embedding))
    process.stdout.write(` ✓\n`)

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < topics.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`   Generated ${embeddings.length} embeddings\n`)
  return embeddings
}

/**
 * Find similar topic pairs using cosine similarity
 */
function findSimilarPairs(topics, embeddings, threshold = 0.85) {
  console.log('[3/5] Finding similar topic pairs...')
  console.log(`   Similarity threshold: ${threshold}`)
  console.log(`   Comparing ${topics.length * (topics.length - 1) / 2} pairs...\n`)

  const similarPairs = []

  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[j])

      if (similarity >= threshold) {
        similarPairs.push({
          topic1: topics[i].name,
          topic2: topics[j].name,
          similarity: similarity,
          id1: topics[i].id,
          id2: topics[j].id
        })
      }
    }

    // Progress indicator every 50 topics
    if ((i + 1) % 50 === 0) {
      process.stdout.write(`   Processed ${i + 1}/${topics.length} topics...\r`)
    }
  }

  console.log(`   Found ${similarPairs.length} similar pairs                    \n`)
  return similarPairs.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Apply similar pairs to Neo4j as SIMILAR_TO relationships
 */
async function applySimilarPairs(pairs, minSimilarity = 0.85) {
  const session = driver.session()
  let appliedCount = 0

  try {
    console.log('[4/5] Creating SIMILAR_TO relationships in Neo4j...')
    console.log(`   Applying ${pairs.length} relationships...\n`)

    for (const pair of pairs) {
      if (pair.similarity < minSimilarity) continue

      try {
        await session.run(`
          MATCH (t1:CurriculumEntity {name: $topic1})
          MATCH (t2:CurriculumEntity {name: $topic2})
          MERGE (t1)-[r:SIMILAR_TO]-(t2)
          SET r.similarity = $similarity,
              r.method = 'embedding',
              r.model = 'text-embedding-3-small'
          RETURN r
        `, {
          topic1: pair.topic1,
          topic2: pair.topic2,
          similarity: pair.similarity
        })

        appliedCount++

        if (appliedCount % 10 === 0) {
          process.stdout.write(`   Applied ${appliedCount}/${pairs.length} relationships...\r`)
        }
      } catch (error) {
        console.error(`   Error applying: ${pair.topic1} ↔ ${pair.topic2}`)
      }
    }

    console.log(`   Applied ${appliedCount} relationships                    \n`)
    return appliedCount

  } finally {
    await session.close()
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(70))
  console.log('EMBEDDING-BASED TOPIC SIMILARITY FINDER')
  console.log('='.repeat(70))
  console.log('This script finds related topics even if they have no graph connections.\n')

  try {
    // Step 1: Fetch topics
    const topics = await fetchTopics()

    if (topics.length === 0) {
      console.log('❌ No topics found in Neo4j')
      return
    }

    // Step 2: Generate embeddings
    const embeddings = await generateEmbeddings(topics)

    // Save embeddings to cache for future use
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ topics, embeddings }, null, 2))
    console.log(`   💾 Saved embeddings to ${CACHE_FILE}\n`)

    // Step 3: Find similar pairs
    const similarPairs = findSimilarPairs(topics, embeddings, 0.85)

    if (similarPairs.length === 0) {
      console.log('❌ No similar pairs found above threshold 0.85')
      console.log('   Try lowering threshold to 0.80\n')
      return
    }

    // Show top 10 most similar pairs
    console.log('[5/5] Top 10 Most Similar Topic Pairs:')
    console.log('='.repeat(70))
    similarPairs.slice(0, 10).forEach((pair, i) => {
      console.log(`\n${i + 1}. ${pair.topic1}`)
      console.log(`   ↔ ${pair.topic2}`)
      console.log(`   Similarity: ${(pair.similarity * 100).toFixed(1)}%`)
    })
    console.log('\n' + '='.repeat(70))

    // Step 4: Apply to Neo4j
    const appliedCount = await applySimilarPairs(similarPairs, 0.85)

    // Final summary
    console.log('\n' + '='.repeat(70))
    console.log('SUMMARY')
    console.log('='.repeat(70))
    console.log(`✅ Topics analyzed: ${topics.length}`)
    console.log(`✅ Similar pairs found: ${similarPairs.length}`)
    console.log(`✅ Relationships created: ${appliedCount}`)
    console.log(`💰 Total cost: ~$${(topics.length * 0.00001).toFixed(4)}`)
    console.log(`⚡ Method: Embedding-based (no LLM comparison needed)`)
    console.log('='.repeat(70))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    throw error
  } finally {
    await driver.close()
  }
}

// Run
main().catch(console.error)
