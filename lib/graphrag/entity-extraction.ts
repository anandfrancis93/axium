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
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for consistent extraction
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

    // Parse JSON response
    const result = JSON.parse(content.text) as ExtractionResult

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
1. Extract ALL important entities (concepts, definitions, people, events, processes, tools, patterns)
2. For each entity, provide:
   - name: The canonical name
   - type: One of [concept, definition, person, event, process, tool, pattern, principle, technique, error, pitfall]
   - description: Brief 1-sentence description
   - aliases: Alternative names (optional)

3. Extract relationships between entities:
   - source: Entity name (must match an extracted entity)
   - target: Entity name (must match an extracted entity)
   - type: One of the following:
     * IS_A: Taxonomy/inheritance (e.g., "React IS_A JavaScript library")
     * PART_OF: Composition (e.g., "useState PART_OF React Hooks")
     * DEPENDS_ON: Prerequisite (e.g., "useEffect DEPENDS_ON understanding closures")
     * CAUSES: Causation (e.g., "Missing dependency CAUSES stale closure")
     * SIMILAR_TO: Analogy (e.g., "useEffect SIMILAR_TO componentDidMount")
     * CONTRASTS_WITH: Comparison (e.g., "TCP CONTRASTS_WITH UDP")
     * IMPLEMENTS: Implementation (e.g., "Redux IMPLEMENTS Flux pattern")
     * SOLVES: Problem-solution (e.g., "useMemo SOLVES expensive computation")
     * PREVENTS: Prevention (e.g., "Cleanup function PREVENTS memory leak")
     * USED_FOR: Application (e.g., "useRef USED_FOR accessing DOM")
   - description: Brief explanation (optional)
   - strength: Confidence 0-1 (optional, default 1.0)

RULES:
- Focus on educational/learning relationships
- Extract prerequisite relationships (DEPENDS_ON) when mentioned
- Capture common mistakes/pitfalls as entities with CAUSES/PREVENTS relationships
- Include comparisons and analogies
- Be conservative: only extract clear, unambiguous relationships
- Ensure all relationship sources/targets refer to extracted entities

OUTPUT FORMAT (valid JSON only):
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "concept",
      "description": "Brief description",
      "aliases": ["Alternative Name"]
    }
  ],
  "relationships": [
    {
      "source": "Entity A",
      "target": "Entity B",
      "type": "DEPENDS_ON",
      "description": "Why A depends on B",
      "strength": 0.9
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
