/**
 * Entity and Relationship Extraction for GraphRAG
 *
 * Uses Claude to extract entities and relationships from knowledge chunks.
 * This is the first step in building the knowledge graph.
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ExtractedEntity {
  name: string
  type: string // concept, definition, person, event, process, tool, pattern, etc.
  description: string
  aliases?: string[] // Alternative names
}

export interface ExtractedRelationship {
  source: string // Entity name
  target: string // Entity name
  type: string // IS_A, DEPENDS_ON, CAUSES, SIMILAR_TO, PART_OF, etc.
  description?: string
  strength?: number // 0-1 confidence
}

export interface ExtractionResult {
  entities: ExtractedEntity[]
  relationships: ExtractedRelationship[]
}

/**
 * Extract entities and relationships from a text chunk using Claude
 */
export async function extractEntitiesAndRelationships(
  chunkContent: string,
  chapterId: string,
  topicContext?: string
): Promise<ExtractionResult> {
  const prompt = buildExtractionPrompt(chunkContent, topicContext)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000, // Increased to prevent JSON truncation
      temperature: 0.1, // Very low temperature for consistent, structured output
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Strip markdown code fences if present
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      // Remove opening fence (```json or ```)
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '')
      // Remove closing fence
      jsonText = jsonText.replace(/\n?```$/, '')
      jsonText = jsonText.trim()
    }

    // Parse JSON response
    let result: ExtractionResult
    try {
      result = JSON.parse(jsonText) as ExtractionResult
    } catch (parseError) {
      console.error('JSON parsing failed. First 500 chars:', jsonText.substring(0, 500))
      console.error('Last 500 chars:', jsonText.substring(Math.max(0, jsonText.length - 500)))
      console.error('Parse error:', parseError)
      throw new Error('Failed to parse Claude response as JSON')
    }

    // Validate and clean
    return validateAndCleanExtraction(result)
  } catch (error) {
    console.error('Entity extraction failed:', error)
    throw new Error('Failed to extract entities and relationships')
  }
}

/**
 * Build extraction prompt for Claude
 */
function buildExtractionPrompt(content: string, topicContext?: string): string {
  return `You are a knowledge graph extraction expert. Extract entities and relationships from the following educational content.

${topicContext ? `TOPIC CONTEXT: ${topicContext}\n\n` : ''}CONTENT:
${content}

INSTRUCTIONS:
1. Extract ONLY the MOST IMPORTANT entities (max 10 total)
2. For each entity, provide:
   - name: The canonical name (max 40 chars)
   - type: One of [concept, definition, person, event, process, tool, pattern, principle, technique, error, pitfall]
   - description: Brief description (max 80 chars, NO quotes, simple language)
   - aliases: Alternative names (optional, max 2)

3. Extract ONLY the MOST IMPORTANT relationships (max 15 total):
   - source: Entity name (must match an extracted entity)
   - target: Entity name (must match an extracted entity)
   - type: Choose the MOST SPECIFIC type from:

     TAXONOMY: IS_A, PART_OF, CATEGORY_OF, EXAMPLE_OF, VARIANT_OF

     SECURITY: PROTECTS_AGAINST, EXPLOITS, ATTACKS, DEFENDS, MITIGATES, DETECTS, PREVENTS, VULNERABILE_TO

     TECHNICAL: IMPLEMENTS, USES, REQUIRES, ENABLES, CONFIGURES, ENCRYPTS, DECRYPTS, AUTHENTICATES, AUTHORIZES, VALIDATES

     FUNCTIONAL: MONITORS, LOGS, ALERTS, FILTERS, BLOCKS, ALLOWS, SCANS

     EDUCATIONAL: DEPENDS_ON, PREREQUISITE_FOR, SIMILAR_TO, CONTRASTS_WITH, COMPARED_TO, SUPERSEDES

     LOGICAL: CAUSES, SOLVES, LEADS_TO, RESULTS_IN, TRIGGERS

   - description: Brief explanation (max 60 chars, NO quotes, simple language)
   - strength: 0-1 (optional)

RULES:
- **Always choose the MOST SPECIFIC relationship type** (e.g., prefer PROTECTS_AGAINST over PREVENTS when discussing security controls)
- Use SECURITY types for attack/defense scenarios (EXPLOITS, PROTECTS_AGAINST, MITIGATES, etc.)
- Use TECHNICAL types for implementation details (IMPLEMENTS, REQUIRES, ENCRYPTS, etc.)
- Use EDUCATIONAL types for learning paths (DEPENDS_ON, PREREQUISITE_FOR, etc.)
- Extract prerequisite relationships when concepts must be learned in order
- Capture attack relationships (X EXPLOITS Y, A ATTACKS B)
- Capture defense relationships (X PROTECTS_AGAINST Y, A MITIGATES B)
- Include comparisons using COMPARED_TO or CONTRASTS_WITH
- Be conservative: only extract clear, unambiguous relationships
- Ensure all relationship sources/targets refer to extracted entities
- Keep descriptions VERY concise (max 80 chars for entities, 60 for relationships)
- Avoid quotes in descriptions - use simple language only
- **CRITICAL: Limit to max 10 entities and 15 relationships per chunk**
- Focus on the MOST IMPORTANT concepts only

OUTPUT FORMAT (valid JSON only, properly escaped):
{
  "entities": [
    {
      "name": "Firewall",
      "type": "tool",
      "description": "Network security device that monitors and controls traffic",
      "aliases": ["Network Firewall"]
    }
  ],
  "relationships": [
    {
      "source": "Firewall",
      "target": "DDoS Attack",
      "type": "PROTECTS_AGAINST",
      "description": "Filters malicious traffic to prevent DDoS",
      "strength": 0.9
    },
    {
      "source": "SSL/TLS",
      "target": "Data",
      "type": "ENCRYPTS",
      "description": "Secures data transmission over network",
      "strength": 1.0
    }
  ]
}

Return ONLY the JSON object, no additional text.`
}

/**
 * Validate and clean extraction results
 */
function validateAndCleanExtraction(result: ExtractionResult): ExtractionResult {
  // Ensure entities and relationships exist
  if (!result.entities) result.entities = []
  if (!result.relationships) result.relationships = []

  // Create entity name map for validation
  const entityNames = new Set(result.entities.map(e => e.name.toLowerCase()))

  // Filter out invalid relationships (where source/target don't exist)
  const validRelationships = result.relationships.filter(rel => {
    const sourceExists = entityNames.has(rel.source.toLowerCase())
    const targetExists = entityNames.has(rel.target.toLowerCase())

    if (!sourceExists || !targetExists) {
      console.warn(
        `Invalid relationship: ${rel.source} -> ${rel.target} (missing entity)`
      )
      return false
    }

    return true
  })

  // Set default strength if not provided
  validRelationships.forEach(rel => {
    if (!rel.strength) rel.strength = 1.0
  })

  return {
    entities: result.entities,
    relationships: validRelationships
  }
}

/**
 * Batch extract entities from multiple chunks
 */
export async function batchExtractEntities(
  chunks: Array<{ id: string; content: string }>,
  chapterId: string,
  topicContext?: string,
  batchSize: number = 5
): Promise<Map<string, ExtractionResult>> {
  const results = new Map<string, ExtractionResult>()

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)

    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(chunk =>
        extractEntitiesAndRelationships(chunk.content, chapterId, topicContext)
      )
    )

    // Collect results
    batch.forEach((chunk, idx) => {
      const result = batchResults[idx]
      if (result.status === 'fulfilled') {
        results.set(chunk.id, result.value)
      } else {
        console.error(`Failed to extract from chunk ${chunk.id}:`, result.reason)
        // Store empty result on failure
        results.set(chunk.id, { entities: [], relationships: [] })
      }
    })

    // Rate limiting (Anthropic: 50 requests/minute)
    if (i + batchSize < chunks.length) {
      await sleep(6000) // 6 seconds between batches (10 batches/min = ~50 chunks/min)
    }
  }

  return results
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Merge extraction results from multiple chunks
 * (Deduplicates entities and aggregates relationships)
 */
export function mergeExtractionResults(
  results: ExtractionResult[]
): ExtractionResult {
  const entityMap = new Map<string, ExtractedEntity>()
  const relationshipMap = new Map<string, ExtractedRelationship>()

  for (const result of results) {
    // Merge entities (deduplicate by name)
    for (const entity of result.entities) {
      const key = entity.name.toLowerCase()
      if (!entityMap.has(key)) {
        entityMap.set(key, entity)
      } else {
        // Entity already exists - merge aliases
        const existing = entityMap.get(key)!
        if (entity.aliases && entity.aliases.length > 0) {
          existing.aliases = existing.aliases || []
          existing.aliases.push(...entity.aliases)
          existing.aliases = [...new Set(existing.aliases)] // Deduplicate
        }
      }
    }

    // Merge relationships (deduplicate by source-type-target)
    for (const rel of result.relationships) {
      const key = `${rel.source.toLowerCase()}|${rel.type}|${rel.target.toLowerCase()}`
      if (!relationshipMap.has(key)) {
        relationshipMap.set(key, rel)
      } else {
        // Relationship already exists - average strength
        const existing = relationshipMap.get(key)!
        if (rel.strength && existing.strength) {
          existing.strength = (existing.strength + rel.strength) / 2
        }
      }
    }
  }

  return {
    entities: Array.from(entityMap.values()),
    relationships: Array.from(relationshipMap.values())
  }
}
