#!/usr/bin/env node

/**
 * Import knowledge graph results from ChatGPT-5 Pro
 *
 * Reads a JSON file with relationship extraction results and
 * imports them into the topic_relationships table
 *
 * Usage:
 *   node scripts/import-kg-results.mjs results.json
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function importResults(filename) {
  console.log(`Importing knowledge graph results from ${filename}...\n`)

  // Read results file
  const data = JSON.parse(readFileSync(filename, 'utf8'))

  if (!data.results || !Array.isArray(data.results)) {
    console.error('Error: File must contain a "results" array')
    console.log('\nExpected format:')
    console.log(JSON.stringify({
      results: [
        {
          source_topic_id: "uuid",
          relationships: [
            {
              candidate_id: 1,
              target_topic_id: "uuid",
              relationship: "is_a",
              confidence: 0.95,
              reasoning: "Explanation..."
            }
          ]
        }
      ]
    }, null, 2))
    return
  }

  let totalImported = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const result of data.results) {
    if (!result.source_topic_id || !result.relationships) {
      console.warn(`Skipping invalid result (missing source_topic_id or relationships)`)
      totalSkipped++
      continue
    }

    for (const rel of result.relationships) {
      // Validate relationship
      if (!rel.target_topic_id || !rel.relationship || typeof rel.confidence !== 'number') {
        console.warn(`Skipping invalid relationship for ${result.source_topic_id}`)
        totalSkipped++
        continue
      }

      // Insert into database
      const { error } = await supabase
        .from('topic_relationships')
        .upsert({
          source_topic_id: result.source_topic_id,
          target_topic_id: rel.target_topic_id,
          relationship_type: rel.relationship.toLowerCase(),
          confidence: rel.confidence,
          reasoning: rel.reasoning || '',
          created_by: 'chatgpt',
          reviewed: rel.confidence >= 0.90 // Auto-approve high confidence
        }, {
          onConflict: 'source_topic_id,target_topic_id,relationship_type'
        })

      if (error) {
        console.error(`Error importing relationship: ${error.message}`)
        totalErrors++
      } else {
        totalImported++
        const status = rel.confidence >= 0.90 ? '✓' : '?'
        if (totalImported % 100 === 0) {
          console.log(`${status} Imported ${totalImported} relationships...`)
        }
      }
    }
  }

  console.log(`\n✓ Import complete!`)
  console.log(`  Imported: ${totalImported}`)
  console.log(`  Skipped: ${totalSkipped}`)
  console.log(`  Errors: ${totalErrors}`)
}

const filename = process.argv[2]
if (!filename) {
  console.error('Usage: node scripts/import-kg-results.mjs <results-file.json>')
  process.exit(1)
}

importResults(filename).catch(console.error)
