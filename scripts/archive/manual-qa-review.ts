import neo4j from 'neo4j-driver'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function manualQAReview() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
  )

  const session = driver.session({ database: 'neo4j' })

  try {
    console.log('\n' + '='.repeat(80))
    console.log('Manual QA Review - Random Entity Sample')
    console.log('='.repeat(80))

    // Sample 20 random entities across different depths
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      WITH e, rand() AS r
      ORDER BY r
      LIMIT 20
      RETURN
        e.id AS id,
        e.name AS name,
        e.entityType AS entityType,
        e.depth AS depth,
        e.fullPath AS fullPath,
        e.domainName AS domainName,
        e.contextSummary AS contextSummary,
        e.scopeTags AS scopeTags,
        e.parentId AS parentId
    `)

    console.log(`\n📋 Reviewing ${result.records.length} random entities...\n`)

    const issues: string[] = []

    result.records.forEach((record, idx) => {
      const entity = {
        id: record.get('id'),
        name: record.get('name'),
        entityType: record.get('entityType'),
        depth: record.get('depth'),
        fullPath: record.get('fullPath'),
        domainName: record.get('domainName'),
        contextSummary: record.get('contextSummary'),
        scopeTags: record.get('scopeTags'),
        parentId: record.get('parentId')
      }

      console.log(`${(idx + 1).toString().padStart(2)}. ${entity.entityType} - "${entity.name}"`)
      console.log(`    Domain: ${entity.domainName}`)
      console.log(`    Depth: ${entity.depth}`)
      console.log(`    Path: ${entity.fullPath}`)

      // Check for issues
      if (!entity.contextSummary || entity.contextSummary.length < 50) {
        issues.push(`⚠️  Entity #${idx + 1} has short/missing context summary`)
        console.log(`    ⚠️  WARNING: Context summary too short or missing`)
      } else {
        console.log(`    ✅ Context: ${entity.contextSummary.substring(0, 100)}...`)
      }

      if (!entity.scopeTags || entity.scopeTags.length === 0) {
        issues.push(`⚠️  Entity #${idx + 1} has no scope tags`)
        console.log(`    ⚠️  WARNING: No scope tags`)
      } else {
        console.log(`    ✅ Tags (${entity.scopeTags.length}): ${entity.scopeTags.slice(0, 5).join(', ')}${entity.scopeTags.length > 5 ? '...' : ''}`)
      }

      if (entity.depth > 0 && !entity.parentId) {
        issues.push(`⚠️  Entity #${idx + 1} (depth ${entity.depth}) has no parent`)
        console.log(`    ⚠️  WARNING: No parent ID but depth > 0`)
      }

      if (entity.depth === 0 && entity.parentId) {
        issues.push(`⚠️  Entity #${idx + 1} is a domain but has a parent`)
        console.log(`    ⚠️  WARNING: Domain has parent ID`)
      }

      console.log()
    })

    // Distribution check
    console.log('=' + '='.repeat(79))
    console.log('\n📊 Sample Distribution:\n')

    const byType = result.records.reduce((acc: any, record) => {
      const type = record.get('entityType')
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type.padEnd(15)}: ${count}`)
    })

    // Relationship check for sampled entities
    console.log('\n🔗 Relationship Validation:\n')

    for (const record of result.records) {
      const id = record.get('id')
      const name = record.get('name')

      const relCheck = await session.run(`
        MATCH (e:CurriculumEntity {id: $id})
        OPTIONAL MATCH (e)-[:PARENT_OF]->(child)
        OPTIONAL MATCH (e)-[:CHILD_OF]->(parent)
        OPTIONAL MATCH (e)-[:RELATED_CONCEPT]-(related)
        RETURN
          count(DISTINCT child) AS childCount,
          count(DISTINCT parent) AS parentCount,
          count(DISTINCT related) AS relatedCount
      `, { id })

      const childCount = relCheck.records[0].get('childCount').toNumber()
      const parentCount = relCheck.records[0].get('parentCount').toNumber()
      const relatedCount = relCheck.records[0].get('relatedCount').toNumber()

      const status = parentCount > 0 || childCount > 0 || relatedCount > 0 ? '✅' : '⚠️ '
      console.log(`  ${status} "${name}": ${parentCount} parent, ${childCount} children, ${relatedCount} related`)
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('QA Review Summary')
    console.log('='.repeat(80))

    if (issues.length === 0) {
      console.log('\n✅ No issues found in random sample')
    } else {
      console.log(`\n⚠️  Found ${issues.length} issues:\n`)
      issues.forEach(issue => console.log(`  ${issue}`))
    }

    console.log('\n✅ Manual QA review complete')
    console.log('='.repeat(80) + '\n')

  } finally {
    await session.close()
    await driver.close()
  }
}

if (require.main === module) {
  manualQAReview()
}

export { manualQAReview }
