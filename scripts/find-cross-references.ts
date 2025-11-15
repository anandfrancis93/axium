import neo4j from 'neo4j-driver'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

interface DuplicateEntity {
  name: string
  id: string
  fullPath: string
  entityType: string
  depth: number
  domainName: string
}

interface CrossReference {
  name: string
  count: number
  entities: DuplicateEntity[]
  domains: Set<string>
  types: Set<string>
}

async function findCrossReferences() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
  )

  const session = driver.session({ database: 'neo4j' })

  try {
    console.log('\n' + '='.repeat(80))
    console.log('Finding Cross-References in Curriculum')
    console.log('='.repeat(80))

    // Find entities with duplicate names
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      WITH e.name AS name, collect(e) AS entities
      WHERE size(entities) > 1
      UNWIND entities AS entity
      RETURN
        name,
        entity.id AS id,
        entity.fullPath AS fullPath,
        entity.entityType AS entityType,
        entity.depth AS depth,
        entity.domainName AS domainName
      ORDER BY name, fullPath
    `)

    // Group by name
    const crossRefsMap = new Map<string, CrossReference>()

    result.records.forEach(record => {
      const name = record.get('name')
      const entity: DuplicateEntity = {
        name,
        id: record.get('id'),
        fullPath: record.get('fullPath'),
        entityType: record.get('entityType'),
        depth: record.get('depth'),
        domainName: record.get('domainName')
      }

      if (!crossRefsMap.has(name)) {
        crossRefsMap.set(name, {
          name,
          count: 0,
          entities: [],
          domains: new Set(),
          types: new Set()
        })
      }

      const crossRef = crossRefsMap.get(name)!
      crossRef.entities.push(entity)
      crossRef.count = crossRef.entities.length
      crossRef.domains.add(entity.domainName)
      crossRef.types.add(entity.entityType)
    })

    // Convert to array and sort
    const crossRefs = Array.from(crossRefsMap.values())
      .sort((a, b) => b.count - a.count)

    // Statistics
    console.log('\n📊 Cross-Reference Statistics:')
    console.log(`  Total unique names with duplicates: ${crossRefs.length}`)
    console.log(`  Total duplicate instances: ${result.records.length}`)

    // Count by number of occurrences
    const occurrenceCounts = new Map<number, number>()
    crossRefs.forEach(cr => {
      occurrenceCounts.set(cr.count, (occurrenceCounts.get(cr.count) || 0) + 1)
    })

    console.log('\n  Distribution:')
    Array.from(occurrenceCounts.entries())
      .sort((a, b) => b[0] - a[0])
      .forEach(([count, num]) => {
        console.log(`    ${count} occurrences: ${num} names`)
      })

    // Cross-domain vs same-domain
    const crossDomain = crossRefs.filter(cr => cr.domains.size > 1)
    const sameDomain = crossRefs.filter(cr => cr.domains.size === 1)

    console.log('\n  Cross-domain duplicates: ' + crossDomain.length)
    console.log('  Same-domain duplicates: ' + sameDomain.length)

    // Top cross-references
    console.log('\n🔗 Top Cross-References (by occurrence count):')
    crossRefs.slice(0, 20).forEach((cr, idx) => {
      const domainInfo = cr.domains.size > 1
        ? `${cr.domains.size} domains`
        : `1 domain (${Array.from(cr.domains)[0]})`
      console.log(`  ${(idx + 1).toString().padStart(2)}. "${cr.name}" - ${cr.count} occurrences (${domainInfo})`)
    })

    // Cross-domain references (most interesting)
    console.log('\n🌐 Cross-Domain References (concepts appearing in multiple domains):')
    crossDomain
      .sort((a, b) => b.domains.size - a.domains.size || b.count - a.count)
      .slice(0, 15)
      .forEach((cr, idx) => {
        console.log(`\n  ${idx + 1}. "${cr.name}" - ${cr.count} occurrences across ${cr.domains.size} domains`)
        console.log(`     Domains: ${Array.from(cr.domains).join(', ')}`)
        console.log(`     Types: ${Array.from(cr.types).join(', ')}`)
      })

    // Sample detailed view
    console.log('\n📋 Sample Detailed Cross-References:')
    crossDomain.slice(0, 5).forEach(cr => {
      console.log(`\n  "${cr.name}" (${cr.count} occurrences):`)
      cr.entities.forEach(e => {
        console.log(`    - [${e.entityType}] ${e.fullPath}`)
      })
    })

    // Export to JSON
    const outputPath = path.join(process.cwd(), 'cross-references.json')
    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalDuplicates: crossRefs.length,
        crossDomain: crossDomain.length,
        sameDomain: sameDomain.length
      },
      crossReferences: crossRefs.map(cr => ({
        name: cr.name,
        count: cr.count,
        domains: Array.from(cr.domains),
        types: Array.from(cr.types),
        entities: cr.entities
      }))
    }

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2))
    console.log(`\n💾 Cross-references exported to: ${outputPath}`)

    // Generate potential RELATED_CONCEPT candidates
    const candidates = crossDomain
      .filter(cr => cr.count >= 2 && cr.count <= 10) // Not too few, not too many
      .filter(cr => cr.domains.size >= 2) // At least 2 different domains
      .sort((a, b) => b.domains.size - a.domains.size)

    console.log(`\n✨ Recommended RELATED_CONCEPT candidates: ${candidates.length}`)
    console.log('   (2-10 occurrences, 2+ domains)')

    const candidatesPath = path.join(process.cwd(), 'cross-reference-candidates.json')
    fs.writeFileSync(
      candidatesPath,
      JSON.stringify({
        metadata: {
          generatedAt: new Date().toISOString(),
          count: candidates.length,
          criteria: '2-10 occurrences, 2+ domains'
        },
        candidates: candidates.map(cr => ({
          name: cr.name,
          count: cr.count,
          domains: Array.from(cr.domains),
          entityPairs: cr.entities.map(e => ({
            id: e.id,
            fullPath: e.fullPath,
            entityType: e.entityType,
            domainName: e.domainName
          }))
        }))
      }, null, 2)
    )

    console.log(`   Exported to: ${candidatesPath}`)

    console.log('\n' + '='.repeat(80))
    console.log('✅ Cross-reference analysis complete')
    console.log('='.repeat(80) + '\n')

  } finally {
    await session.close()
    await driver.close()
  }
}

if (require.main === module) {
  findCrossReferences()
}

export { findCrossReferences }
