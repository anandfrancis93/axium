/**
 * Extract Semantic Relationships from Curriculum
 *
 * Analyzes curriculum entities and extracts:
 * - IS_A relationships (classification/inheritance)
 * - PART_OF relationships (composition)
 * - PREVENTS relationships (security mitigations)
 * - USES relationships (tools/protocols)
 * - DEPENDS_ON relationships (prerequisites)
 *
 * Uses Claude AI to analyze context summaries and entity names
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface CurriculumEntity {
  id: string
  name: string
  level: string
  fullPath: string
  parentId: string | null
  domainName: string
  objectiveName: string | null
  contextSummary: string
}

interface SemanticRelationship {
  fromId: string
  fromName: string
  toId: string
  toName: string
  relationshipType: 'IS_A' | 'PART_OF' | 'PREVENTS' | 'USES' | 'DEPENDS_ON' | 'PREREQUISITE'
  confidence: number // 0-1
  reasoning: string
  extractedFrom: 'hierarchy' | 'context' | 'name_pattern'
}

interface ExtractionResult {
  totalEntities: number
  relationshipsExtracted: number
  byType: Record<string, number>
  relationships: SemanticRelationship[]
  cost: number
  tokensUsed: number
}

/**
 * Extract IS_A relationships from hierarchy and context
 */
async function extractIsARelationships(
  entities: CurriculumEntity[]
): Promise<SemanticRelationship[]> {
  const relationships: SemanticRelationship[] = []

  console.log('\n🔍 Extracting IS_A relationships...')

  // Pattern 1: Direct hierarchy (subtopic IS_A topic parent)
  for (const entity of entities) {
    if (!entity.parentId) continue

    const parent = entities.find(e => e.id === entity.parentId)
    if (!parent) continue

    // Check if this looks like a classification relationship
    if (isClassificationRelationship(entity, parent)) {
      relationships.push({
        fromId: entity.id,
        fromName: entity.name,
        toId: parent.id,
        toName: parent.name,
        relationshipType: 'IS_A',
        confidence: 0.9,
        reasoning: `${entity.name} is a type/category of ${parent.name}`,
        extractedFrom: 'hierarchy'
      })
    }
  }

  console.log(`  Found ${relationships.length} IS_A relationships from hierarchy`)

  // Pattern 2: Use LLM to extract from context summaries (for complex cases)
  const complexEntities = entities.filter(e =>
    e.level === 'subtopic' &&
    e.contextSummary.length > 200 &&
    relationships.filter(r => r.fromId === e.id).length === 0
  ).slice(0, 50) // Limit to avoid high API costs

  if (complexEntities.length > 0) {
    console.log(`  Analyzing ${complexEntities.length} complex entities with LLM...`)

    for (const entity of complexEntities) {
      const llmRelationships = await extractIsAWithLLM(entity, entities)
      relationships.push(...llmRelationships)
    }
  }

  return relationships
}

/**
 * Check if parent-child relationship is a classification (IS_A)
 */
function isClassificationRelationship(
  child: CurriculumEntity,
  parent: CurriculumEntity
): boolean {
  // Keywords that suggest IS_A relationship
  const isAKeywords = [
    'type', 'category', 'kind', 'form', 'variant', 'example',
    'algorithm', 'protocol', 'method', 'technique', 'approach',
    'attack', 'vulnerability', 'control', 'tool', 'service'
  ]

  const parentNameLower = parent.name.toLowerCase()
  const childNameLower = child.name.toLowerCase()

  // Check if parent name suggests a category
  if (isAKeywords.some(keyword => parentNameLower.includes(keyword))) {
    return true
  }

  // Check if child appears to be a specific instance of parent
  if (parentNameLower.endsWith('s') && parent.level === 'topic') {
    // Plural parent (e.g., "Algorithms") suggests children are types
    return true
  }

  // Check context summary for IS_A indicators
  const contextLower = child.contextSummary.toLowerCase()
  if (contextLower.includes('is a type of') ||
      contextLower.includes('is a kind of') ||
      contextLower.includes('is an example of') ||
      contextLower.includes('is a category of')) {
    return true
  }

  return false
}

/**
 * Use LLM to extract IS_A relationships from context
 */
async function extractIsAWithLLM(
  entity: CurriculumEntity,
  allEntities: CurriculumEntity[]
): Promise<SemanticRelationship[]> {
  const prompt = `You are analyzing a cybersecurity curriculum entity to identify IS_A relationships.

Entity: ${entity.name}
Level: ${entity.level}
Full Path: ${entity.fullPath}
Context: ${entity.contextSummary}

Identify if this entity IS_A (is a type/category/example of) any other concept mentioned in its context.

Return ONLY a JSON array of relationships in this format:
[
  {
    "targetConcept": "concept name",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
  }
]

If no IS_A relationships found, return empty array: []

Examples:
- "AES IS_A Symmetric Encryption Algorithm" (confidence: 0.95)
- "Phishing IS_A Social Engineering Attack" (confidence: 0.95)
- "Firewall IS_A Security Control" (confidence: 0.90)

Return only valid JSON, no other text.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') return []

    const jsonText = content.text.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const extracted = JSON.parse(jsonText)

    const relationships: SemanticRelationship[] = []

    for (const rel of extracted) {
      // Try to find matching entity
      const target = allEntities.find(e =>
        e.name.toLowerCase() === rel.targetConcept.toLowerCase() ||
        e.name.toLowerCase().includes(rel.targetConcept.toLowerCase())
      )

      if (target) {
        relationships.push({
          fromId: entity.id,
          fromName: entity.name,
          toId: target.id,
          toName: target.name,
          relationshipType: 'IS_A',
          confidence: rel.confidence,
          reasoning: rel.reasoning,
          extractedFrom: 'context'
        })
      }
    }

    return relationships
  } catch (error) {
    console.error(`  Error extracting IS_A for ${entity.name}:`, error)
    return []
  }
}

/**
 * Extract PART_OF relationships
 */
async function extractPartOfRelationships(
  entities: CurriculumEntity[]
): Promise<SemanticRelationship[]> {
  const relationships: SemanticRelationship[] = []

  console.log('\n🔍 Extracting PART_OF relationships...')

  // PART_OF is mostly captured by hierarchy (child PART_OF parent)
  // But we also want to find component relationships

  for (const entity of entities) {
    if (!entity.parentId) continue

    const parent = entities.find(e => e.id === entity.parentId)
    if (!parent) continue

    // Check if this is a component relationship (not classification)
    if (isComponentRelationship(entity, parent)) {
      relationships.push({
        fromId: entity.id,
        fromName: entity.name,
        toId: parent.id,
        toName: parent.name,
        relationshipType: 'PART_OF',
        confidence: 0.85,
        reasoning: `${entity.name} is a component/part of ${parent.name}`,
        extractedFrom: 'hierarchy'
      })
    }
  }

  console.log(`  Found ${relationships.length} PART_OF relationships`)

  return relationships
}

function isComponentRelationship(
  child: CurriculumEntity,
  parent: CurriculumEntity
): boolean {
  // Keywords that suggest PART_OF relationship
  const partOfKeywords = [
    'component', 'element', 'aspect', 'phase', 'stage', 'step',
    'layer', 'tier', 'module', 'section', 'part'
  ]

  const parentNameLower = parent.name.toLowerCase()
  const contextLower = child.contextSummary.toLowerCase()

  if (partOfKeywords.some(keyword => parentNameLower.includes(keyword))) {
    return true
  }

  if (contextLower.includes('part of') ||
      contextLower.includes('component of') ||
      contextLower.includes('element of') ||
      contextLower.includes('aspect of')) {
    return true
  }

  // Process-oriented names suggest PART_OF
  if (parentNameLower.includes('process') ||
      parentNameLower.includes('lifecycle') ||
      parentNameLower.includes('framework')) {
    return true
  }

  return false
}

/**
 * Extract PREVENTS relationships (security mitigations)
 */
async function extractPreventsRelationships(
  entities: CurriculumEntity[]
): Promise<SemanticRelationship[]> {
  console.log('\n🔍 Extracting PREVENTS relationships...')

  // This requires analyzing context to find mitigation relationships
  // We'll use LLM for this
  const relationships: SemanticRelationship[] = []

  // Focus on security controls and mitigations
  const securityControls = entities.filter(e =>
    e.name.toLowerCase().includes('control') ||
    e.name.toLowerCase().includes('firewall') ||
    e.name.toLowerCase().includes('encryption') ||
    e.name.toLowerCase().includes('authentication') ||
    e.name.toLowerCase().includes('authorization') ||
    e.name.toLowerCase().includes('antivirus') ||
    e.fullPath.toLowerCase().includes('security control')
  )

  console.log(`  Analyzing ${securityControls.length} security control entities...`)

  // Sample a subset to avoid high costs
  const sample = securityControls.slice(0, 30)

  for (const control of sample) {
    const prevented = await extractPreventsWithLLM(control, entities)
    relationships.push(...prevented)

    // Rate limiting
    await sleep(500)
  }

  console.log(`  Found ${relationships.length} PREVENTS relationships`)

  return relationships
}

async function extractPreventsWithLLM(
  control: CurriculumEntity,
  allEntities: CurriculumEntity[]
): Promise<SemanticRelationship[]> {
  const prompt = `Analyze this security control to identify what threats/attacks it PREVENTS.

Control: ${control.name}
Context: ${control.contextSummary}

Return ONLY a JSON array of what this control prevents:
[
  {
    "prevented": "threat/attack name",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
  }
]

Examples:
- Firewall PREVENTS unauthorized network access
- Encryption PREVENTS data interception
- MFA PREVENTS credential theft attacks

Return only valid JSON array, or [] if none found.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type !== 'text') return []

    const jsonText = content.text.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const extracted = JSON.parse(jsonText)

    const relationships: SemanticRelationship[] = []

    for (const rel of extracted) {
      // Try to find matching threat entity
      const target = allEntities.find(e =>
        e.name.toLowerCase().includes(rel.prevented.toLowerCase()) ||
        rel.prevented.toLowerCase().includes(e.name.toLowerCase())
      )

      if (target) {
        relationships.push({
          fromId: control.id,
          fromName: control.name,
          toId: target.id,
          toName: target.name,
          relationshipType: 'PREVENTS',
          confidence: rel.confidence,
          reasoning: rel.reasoning,
          extractedFrom: 'context'
        })
      }
    }

    return relationships
  } catch (error) {
    console.error(`  Error extracting PREVENTS for ${control.name}:`, error)
    return []
  }
}

/**
 * Main extraction function
 */
async function extractAllRelationships(): Promise<ExtractionResult> {
  console.log('=' .repeat(80))
  console.log('Semantic Relationship Extraction Pipeline')
  console.log('='.repeat(80))

  // Load curriculum
  const curriculumPath = path.join(process.cwd(), 'curriculum-parsed.json')
  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'))
  const entities: CurriculumEntity[] = curriculum.entities

  console.log(`\nLoaded ${entities.length} entities from curriculum`)

  // Extract relationships
  const isARelationships = await extractIsARelationships(entities)
  const partOfRelationships = await extractPartOfRelationships(entities)
  const preventsRelationships = await extractPreventsRelationships(entities)

  // Combine all relationships
  const allRelationships = [
    ...isARelationships,
    ...partOfRelationships,
    ...preventsRelationships
  ]

  // Calculate stats
  const byType: Record<string, number> = {}
  for (const rel of allRelationships) {
    byType[rel.relationshipType] = (byType[rel.relationshipType] || 0) + 1
  }

  const result: ExtractionResult = {
    totalEntities: entities.length,
    relationshipsExtracted: allRelationships.length,
    byType,
    relationships: allRelationships,
    cost: 0, // Will be calculated based on API usage
    tokensUsed: 0
  }

  // Save results
  const outputPath = path.join(process.cwd(), 'semantic-relationships.json')
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))

  console.log('\n' + '='.repeat(80))
  console.log('Extraction Complete')
  console.log('='.repeat(80))
  console.log(`\nTotal Relationships: ${result.relationshipsExtracted}`)
  console.log('\nBy Type:')
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`)
  }
  console.log(`\nSaved to: ${outputPath}`)

  return result
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Run extraction
extractAllRelationships()
  .then(() => {
    console.log('\n✅ Extraction pipeline complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Extraction failed:', error)
    process.exit(1)
  })
