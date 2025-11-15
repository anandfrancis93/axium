/**
 * Curriculum Parser
 *
 * Reads curriculum.md and generates hierarchical tree structure
 * with UUIDs and full paths for each entity.
 */

import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

interface Entity {
  id: string
  name: string
  level: 'domain' | 'objective' | 'topic' | 'subtopic' | 'subsubtopic'
  fullPath: string
  parentId: string | null
  domainId: string | null
  domainName: string | null
  objectiveId: string | null
  objectiveName: string | null
  children: Entity[]
  contextSummary: string | null
  status: 'active'
  curriculumVersion: string
  createdAt: string
}

interface ParsedCurriculum {
  entities: Entity[]
  stats: {
    totalEntities: number
    domains: number
    objectives: number
    topics: number
    subtopics: number
    subsubtopics: number
  }
  warnings: string[]
}

const LEVEL_MAP: Record<number, Entity['level']> = {
  1: 'domain',
  2: 'objective',
  3: 'topic',
  4: 'subtopic',
  5: 'subsubtopic'
}

function parseCurriculum(markdownPath: string): ParsedCurriculum {
  console.log(`Reading curriculum from: ${markdownPath}`)

  const content = fs.readFileSync(markdownPath, 'utf-8')
  const lines = content.split('\n')

  const entities: Entity[] = []
  const warnings: string[] = []

  // Stack to track parent entities at each level
  const parentStack: Entity[] = []

  const stats = {
    totalEntities: 0,
    domains: 0,
    objectives: 0,
    topics: 0,
    subtopics: 0,
    subsubtopics: 0
  }

  const timestamp = new Date().toISOString()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    // Match markdown headings: # Domain, ## Objective, etc.
    const match = line.match(/^(#{1,5})\s+(.+)$/)
    if (!match) continue

    const headingLevel = match[1].length
    const name = match[2].trim()

    // Validate heading level
    if (headingLevel > 5) {
      warnings.push(`Line ${i + 1}: Heading level ${headingLevel} too deep, max is 5`)
      continue
    }

    const level = LEVEL_MAP[headingLevel]

    // Create entity
    const entity: Entity = {
      id: randomUUID(),
      name,
      level,
      fullPath: '', // Will be set below
      parentId: null,
      domainId: null,
      domainName: null,
      objectiveId: null,
      objectiveName: null,
      children: [],
      contextSummary: null,
      status: 'active',
      curriculumVersion: '2024.1',
      createdAt: timestamp
    }

    // Set parent relationships
    // Remove entities from stack that are same level or deeper
    while (parentStack.length > 0 && parentStack.length >= headingLevel) {
      parentStack.pop()
    }

    // Current parent is top of stack
    const parent = parentStack.length > 0 ? parentStack[parentStack.length - 1] : null

    if (parent) {
      entity.parentId = parent.id
      parent.children.push(entity)
    }

    // Set domain and objective references
    if (level === 'domain') {
      entity.domainId = entity.id
      entity.domainName = entity.name
    } else {
      // Find domain (first item in stack)
      const domain = parentStack.find(e => e.level === 'domain')
      if (domain) {
        entity.domainId = domain.id
        entity.domainName = domain.name
      }

      // Find objective (second item in stack if it exists)
      const objective = parentStack.find(e => e.level === 'objective')
      if (objective) {
        entity.objectiveId = objective.id
        entity.objectiveName = objective.name
      }
    }

    // Build full path
    const pathParts = parentStack.map(e => e.name)
    pathParts.push(entity.name)
    entity.fullPath = pathParts.join(' > ')

    // Add to stack for children
    parentStack.push(entity)

    // Add to entities list
    entities.push(entity)

    // Update stats
    stats.totalEntities++
    switch (level) {
      case 'domain': stats.domains++; break
      case 'objective': stats.objectives++; break
      case 'topic': stats.topics++; break
      case 'subtopic': stats.subtopics++; break
      case 'subsubtopic': stats.subsubtopics++; break
    }
  }

  console.log(`\nParsed ${stats.totalEntities} entities:`)
  console.log(`  - Domains: ${stats.domains}`)
  console.log(`  - Objectives: ${stats.objectives}`)
  console.log(`  - Topics: ${stats.topics}`)
  console.log(`  - Subtopics: ${stats.subtopics}`)
  console.log(`  - Sub-subtopics: ${stats.subsubtopics}`)

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warnings:`)
    warnings.forEach(w => console.log(`  - ${w}`))
  }

  return {
    entities,
    stats,
    warnings
  }
}

function validateEntities(entities: Entity[]): string[] {
  const errors: string[] = []

  // Check for orphaned entities (no parent, except domains)
  const orphans = entities.filter(e =>
    e.level !== 'domain' && !e.parentId
  )
  if (orphans.length > 0) {
    errors.push(`Found ${orphans.length} orphaned entities (no parent)`)
  }

  // Check for duplicate names at same level
  const nameMap = new Map<string, Entity[]>()
  entities.forEach(e => {
    const key = `${e.level}:${e.name}`
    if (!nameMap.has(key)) {
      nameMap.set(key, [])
    }
    nameMap.get(key)!.push(e)
  })

  const duplicates = Array.from(nameMap.entries())
    .filter(([_, entities]) => entities.length > 1)

  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate names (cross-references):`)
    duplicates.forEach(([key, entities]) => {
      console.log(`  - "${entities[0].name}" appears ${entities.length} times:`)
      entities.forEach(e => console.log(`    * ${e.fullPath}`))
    })
  }

  // Check for missing required fields
  entities.forEach(e => {
    if (!e.id) errors.push(`Entity "${e.name}" missing ID`)
    if (!e.name) errors.push(`Entity with ID ${e.id} missing name`)
    if (!e.level) errors.push(`Entity "${e.name}" missing level`)
    if (!e.fullPath) errors.push(`Entity "${e.name}" missing fullPath`)
  })

  return errors
}

function flattenEntities(entities: Entity[]): Entity[] {
  // Entities array is already flat, just remove children property from each
  return entities.map(entity => {
    const { children, ...entityWithoutChildren } = entity
    return entityWithoutChildren as Entity
  })
}

// Main execution
function main() {
  const curriculumPath = path.join(process.cwd(), 'curriculum.md')
  const outputPath = path.join(process.cwd(), 'curriculum-parsed.json')

  console.log('='.repeat(60))
  console.log('Curriculum Parser')
  console.log('='.repeat(60))

  // Parse curriculum
  const result = parseCurriculum(curriculumPath)

  // Validate
  console.log('\nValidating entities...')
  const errors = validateEntities(result.entities)

  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} validation errors:`)
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }

  console.log('✅ Validation passed')

  // Flatten for output
  const flatEntities = flattenEntities(result.entities)

  // Save to JSON
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceFile: 'curriculum.md',
      version: '2024.1'
    },
    stats: result.stats,
    warnings: result.warnings,
    entities: flatEntities
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`\n✅ Saved parsed curriculum to: ${outputPath}`)

  console.log('\n' + '='.repeat(60))
  console.log('Summary:')
  console.log('='.repeat(60))
  console.log(`Total entities: ${result.stats.totalEntities}`)
  console.log(`Output file: ${outputPath}`)
  console.log(`Warnings: ${result.warnings.length}`)
  console.log(`Errors: ${errors.length}`)
  console.log('\nReady for import! ✨')
}

// Run if called directly
if (require.main === module) {
  main()
}

export { parseCurriculum, validateEntities, flattenEntities }
