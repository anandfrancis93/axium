#!/usr/bin/env node

/**
 * Export topics for knowledge graph building with external AI
 *
 * Generates a JSON file with all topics and their candidate pairs
 * for relationship extraction using ChatGPT-5 Pro or other AI models
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
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

/**
 * Get candidate topics for a source topic
 */
function getCandidateTopics(sourceTopic, allTopics, limit = 50) {
  const candidates = allTopics.filter(candidate => {
    // Exclude self
    if (candidate.id === sourceTopic.id) return false

    // Exclude same-branch siblings
    if (candidate.parent_topic_id === sourceTopic.parent_topic_id && sourceTopic.parent_topic_id !== null) {
      return false
    }

    // Prefer topics from different domains or distant branches
    const sourcePathParts = sourceTopic.path ? sourceTopic.path.split('.') : []
    const candidatePathParts = candidate.path ? candidate.path.split('.') : []

    // Different root domain = good candidate
    if (sourcePathParts[0] !== candidatePathParts[0]) {
      return true
    }

    // Same domain but different high-level branch = good candidate
    if (sourcePathParts[1] !== candidatePathParts[1]) {
      return true
    }

    // Very distant in same branch = acceptable
    const pathDistance = Math.abs(sourcePathParts.length - candidatePathParts.length)
    return pathDistance >= 2
  })

  return candidates.slice(0, limit)
}

async function exportTopics() {
  console.log('Exporting topics for knowledge graph building...\n')

  // Get all topics (depth >= 2)
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, full_name, depth, path, parent_topic_id, description')
    .gte('depth', 2)
    .order('name', { ascending: true })

  if (!topics || topics.length === 0) {
    console.log('No topics found')
    return
  }

  console.log(`Found ${topics.length} topics\n`)

  // Build topic pairs for processing
  const topicPairs = []

  for (const sourceTopic of topics) {
    const candidates = getCandidateTopics(sourceTopic, topics, 50)

    if (candidates.length === 0) continue

    topicPairs.push({
      source: {
        id: sourceTopic.id,
        name: sourceTopic.name,
        full_name: sourceTopic.full_name,
        description: sourceTopic.description || ''
      },
      candidates: candidates.map((c, idx) => ({
        candidate_id: idx + 1,
        id: c.id,
        name: c.name,
        full_name: c.full_name
      }))
    })
  }

  // Export to JSON
  const output = {
    total_topics: topics.length,
    total_pairs: topicPairs.length,
    instructions: {
      prompt: `You are a cybersecurity knowledge graph builder. Your task is to identify semantic relationships between security concepts.

SOURCE TOPIC:
Name: "{source.name}"
Full Path: {source.full_name}
{source.description ? 'Description: ' + source.description : ''}

CANDIDATE TOPICS:
{candidates.map((t, i) => i+1 + '. "' + t.name + '" - ' + t.full_name).join('\\n')}

RELATIONSHIP TYPES:

IS_A: Source is a type/instance of target
Examples: "Access badge" IS-A "Preventative control", "Phishing" IS-A "Social engineering attack", "AES" IS-A "Encryption algorithm"

PART_OF: Source is a component/element of target
Examples: "Policy Engine" PART-OF "Control Plane", "Authentication" PART-OF "Identity management", "Hash function" PART-OF "Cryptographic primitives"

REQUIRES: Source requires target as prerequisite knowledge
Examples: "Apply" REQUIRES "Understand" (Bloom levels), "Public key cryptography" REQUIRES "Symmetric encryption", "Penetration testing" REQUIRES "Vulnerability assessment"

CONTRASTS_WITH: Source is opposite/alternative to target
Examples: "Preventative control" CONTRASTS-WITH "Detective control", "Symmetric encryption" CONTRASTS-WITH "Asymmetric encryption", "Allow list" CONTRASTS-WITH "Block list"

ENABLES: Source makes target possible/achievable
Examples: "Encryption" ENABLES "Confidentiality", "MFA" ENABLES "Strong authentication", "Logging" ENABLES "Incident detection"

MITIGATES: Source reduces/prevents risk of target
Examples: "MFA" MITIGATES "Password attacks", "Firewalls" MITIGATE "Unauthorized network access", "Input validation" MITIGATES "Injection attacks"

INSTRUCTIONS:
1. For EACH candidate topic, determine if there's a meaningful relationship with the source topic
2. Only include relationships that would help a student understand connections between concepts
3. Avoid redundant relationships (e.g., if A is_a B and B part_of C, don't also say A part_of C)
4. Confidence scoring:
   - 0.95-1.0: Definitive relationship (e.g., "Access badge IS-A Physical security control")
   - 0.80-0.94: Strong relationship (e.g., "Firewall ENABLES Network security")
   - 0.70-0.79: Moderate relationship (needs human review)
   - <0.70: Don't include

OUTPUT FORMAT (JSON array):
[
  {
    "candidate_id": 1,
    "relationship": "is_a",
    "confidence": 0.95,
    "reasoning": "Brief explanation of why this relationship exists"
  }
]

IMPORTANT:
- Only include relationships with confidence >= 0.70
- Empty array [] if no relationships found
- Be precise and conservative with relationship identification`,
      relationship_types: ['is_a', 'part_of', 'requires', 'contrasts_with', 'enables', 'mitigates'],
      output_format: 'JSON array with fields: candidate_id, relationship (lowercase), confidence (0.70-1.0), reasoning'
    },
    topic_pairs: topicPairs
  }

  const filename = 'knowledge-graph-export.json'
  writeFileSync(filename, JSON.stringify(output, null, 2))

  console.log(`✓ Exported ${topicPairs.length} topic pairs to ${filename}`)
  console.log(`\nNext steps:`)
  console.log(`1. Use ChatGPT-5 Pro to process each topic pair`)
  console.log(`2. Collect the JSON responses`)
  console.log(`3. Import results using: node scripts/import-kg-results.mjs`)
}

exportTopics().catch(console.error)
