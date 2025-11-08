#!/usr/bin/env node

/**
 * Knowledge Graph Builder
 *
 * Uses Anthropic Claude to extract semantic relationships between topics.
 * Implements hybrid approach: AI suggests, human reviews high-value relationships.
 *
 * Usage:
 *   node scripts/build-knowledge-graph.mjs --mode=full     # Process all topics
 *   node scripts/build-knowledge-graph.mjs --mode=incremental --topic-id=<uuid>  # Single topic
 *   node scripts/build-knowledge-graph.mjs --mode=review   # Review low-confidence relationships
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Relationship type definitions with examples
const RELATIONSHIP_TYPES = {
  is_a: {
    description: 'Source is a type/instance of target',
    examples: [
      '"Access badge" IS-A "Preventative control"',
      '"Phishing" IS-A "Social engineering attack"',
      '"AES" IS-A "Encryption algorithm"'
    ]
  },
  part_of: {
    description: 'Source is a component/element of target',
    examples: [
      '"Policy Engine" PART-OF "Control Plane"',
      '"Authentication" PART-OF "Identity management"',
      '"Hash function" PART-OF "Cryptographic primitives"'
    ]
  },
  requires: {
    description: 'Source requires target as prerequisite knowledge',
    examples: [
      '"Apply" REQUIRES "Understand" (Bloom levels)',
      '"Public key cryptography" REQUIRES "Symmetric encryption"',
      '"Penetration testing" REQUIRES "Vulnerability assessment"'
    ]
  },
  contrasts_with: {
    description: 'Source is opposite/alternative to target',
    examples: [
      '"Preventative control" CONTRASTS-WITH "Detective control"',
      '"Symmetric encryption" CONTRASTS-WITH "Asymmetric encryption"',
      '"Allow list" CONTRASTS-WITH "Block list"'
    ]
  },
  enables: {
    description: 'Source makes target possible/achievable',
    examples: [
      '"Encryption" ENABLES "Confidentiality"',
      '"MFA" ENABLES "Strong authentication"',
      '"Logging" ENABLES "Incident detection"'
    ]
  },
  mitigates: {
    description: 'Source reduces/prevents risk of target',
    examples: [
      '"MFA" MITIGATES "Password attacks"',
      '"Firewalls" MITIGATE "Unauthorized network access"',
      '"Input validation" MITIGATES "Injection attacks"'
    ]
  }
}

/**
 * Extract relationships for a single topic using Claude
 */
async function extractRelationships(sourceTopic, candidateTopics) {
  console.log(`\nExtracting relationships for: ${sourceTopic.name}`)
  console.log(`  Analyzing ${candidateTopics.length} candidate topics...`)

  const prompt = `You are a cybersecurity knowledge graph builder. Your task is to identify semantic relationships between security concepts.

SOURCE TOPIC:
Name: "${sourceTopic.name}"
Full Path: ${sourceTopic.full_name}
${sourceTopic.description ? `Description: ${sourceTopic.description}` : ''}

CANDIDATE TOPICS:
${candidateTopics.map((t, i) => `${i + 1}. "${t.name}" - ${t.full_name}`).join('\n')}

RELATIONSHIP TYPES:
${Object.entries(RELATIONSHIP_TYPES).map(([type, info]) => `
${type.toUpperCase()}: ${info.description}
Examples: ${info.examples.join(', ')}
`).join('\n')}

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
- Be precise and conservative with relationship identification`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0].text

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.log('  No relationships found')
      return []
    }

    const relationships = JSON.parse(jsonMatch[0])
    console.log(`  Found ${relationships.length} relationships`)

    return relationships
  } catch (error) {
    console.error(`  Error extracting relationships:`, error.message)
    return []
  }
}

/**
 * Get candidate topics for relationship extraction
 * Excludes: same branch siblings, self, objectives (depth=1)
 */
async function getCandidateTopics(sourceTopic, limit = 50) {
  const { data: allTopics } = await supabase
    .from('topics')
    .select('id, name, full_name, depth, path, parent_topic_id, description')
    .gte('depth', 2) // Exclude domains and objectives
    .neq('id', sourceTopic.id) // Exclude self
    .limit(limit * 2) // Get more for filtering

  if (!allTopics) return []

  // Filter out same-branch siblings
  const candidates = allTopics.filter(candidate => {
    // Exclude topics with same parent (siblings)
    if (candidate.parent_topic_id === sourceTopic.parent_topic_id) {
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

/**
 * Store relationships in database
 */
async function storeRelationships(sourceTopic, relationships, candidateTopics) {
  for (const rel of relationships) {
    const targetTopic = candidateTopics[rel.candidate_id - 1]
    if (!targetTopic) {
      console.warn(`  Warning: Invalid candidate_id ${rel.candidate_id}`)
      continue
    }

    const { error } = await supabase
      .from('topic_relationships')
      .upsert({
        source_topic_id: sourceTopic.id,
        target_topic_id: targetTopic.id,
        relationship_type: rel.relationship.toLowerCase(), // Convert to lowercase for enum
        confidence: rel.confidence,
        reasoning: rel.reasoning,
        created_by: 'ai',
        reviewed: rel.confidence >= 0.90 // Auto-approve high confidence
      }, {
        onConflict: 'source_topic_id,target_topic_id,relationship_type'
      })

    if (error) {
      console.error(`  Error storing relationship:`, error.message)
    } else {
      const status = rel.confidence >= 0.90 ? '✓' : '?'
      console.log(`  ${status} ${sourceTopic.name} --${rel.relationship}--> ${targetTopic.name} (${rel.confidence.toFixed(2)})`)
    }
  }
}

/**
 * Process all topics to build knowledge graph
 */
async function buildFullGraph() {
  console.log('Building knowledge graph for all topics...\n')

  // Get all topics (depth >= 2)
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, full_name, depth, path, parent_topic_id, description')
    .gte('depth', 2)
    .order('depth', { ascending: true }) // Process from top-down

  if (!topics || topics.length === 0) {
    console.log('No topics found')
    return
  }

  console.log(`Found ${topics.length} topics to process\n`)

  let processed = 0
  let totalRelationships = 0

  for (const sourceTopic of topics) {
    // Get candidate topics
    const candidates = await getCandidateTopics(sourceTopic, 50)

    if (candidates.length === 0) {
      console.log(`Skipping ${sourceTopic.name} (no candidates)`)
      continue
    }

    // Extract relationships using Claude
    const relationships = await extractRelationships(sourceTopic, candidates)

    // Store relationships
    if (relationships.length > 0) {
      await storeRelationships(sourceTopic, relationships, candidates)
      totalRelationships += relationships.length
    }

    processed++

    // Rate limiting: wait 1 second between API calls
    if (processed < topics.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`\nComplete! Processed ${processed} topics, created ${totalRelationships} relationships`)
}

/**
 * Process a single topic (incremental mode)
 */
async function buildIncrementalGraph(topicId) {
  console.log(`Building relationships for topic: ${topicId}\n`)

  // Get source topic
  const { data: sourceTopic } = await supabase
    .from('topics')
    .select('id, name, full_name, depth, path, parent_topic_id, description')
    .eq('id', topicId)
    .single()

  if (!sourceTopic) {
    console.error('Topic not found')
    return
  }

  // Get candidates
  const candidates = await getCandidateTopics(sourceTopic, 50)
  console.log(`Found ${candidates.length} candidate topics\n`)

  // Extract relationships
  const relationships = await extractRelationships(sourceTopic, candidates)

  // Store relationships
  if (relationships.length > 0) {
    await storeRelationships(sourceTopic, relationships, candidates)
  }

  console.log(`\nComplete! Created ${relationships.length} relationships`)
}

/**
 * Review low-confidence relationships
 */
async function reviewRelationships() {
  console.log('Fetching relationships needing review (confidence 0.70-0.89)...\n')

  const { data: relationships } = await supabase
    .from('topic_relationships')
    .select(`
      id,
      source_topic:topics!source_topic_id(name),
      target_topic:topics!target_topic_id(name),
      relationship_type,
      confidence,
      reasoning
    `)
    .eq('reviewed', false)
    .gte('confidence', 0.70)
    .lt('confidence', 0.90)
    .order('confidence', { ascending: false })

  if (!relationships || relationships.length === 0) {
    console.log('No relationships need review')
    return
  }

  console.log(`Found ${relationships.length} relationships needing review:\n`)

  relationships.forEach((rel, i) => {
    console.log(`${i + 1}. [${rel.confidence.toFixed(2)}] ${rel.source_topic.name} --${rel.relationship_type}--> ${rel.target_topic.name}`)
    console.log(`   Reasoning: ${rel.reasoning}\n`)
  })

  console.log('\nTo approve/reject, update the database manually or build a review UI')
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'full'
  const topicId = args.find(a => a.startsWith('--topic-id='))?.split('=')[1]

  console.log('=== Knowledge Graph Builder ===\n')

  if (mode === 'full') {
    await buildFullGraph()
  } else if (mode === 'incremental') {
    if (!topicId) {
      console.error('Error: --topic-id required for incremental mode')
      process.exit(1)
    }
    await buildIncrementalGraph(topicId)
  } else if (mode === 'review') {
    await reviewRelationships()
  } else {
    console.error(`Unknown mode: ${mode}`)
    console.log('Valid modes: full, incremental, review')
    process.exit(1)
  }
}

main().catch(console.error)
