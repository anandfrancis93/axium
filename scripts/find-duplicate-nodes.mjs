/**
 * Find Duplicate Nodes in Neo4j
 *
 * Identifies nodes with identical names but different IDs
 * to determine if they're true duplicates or context-specific terms
 */

import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function findDuplicates() {
  const session = driver.session()

  try {
    console.log('='.repeat(70))
    console.log('DUPLICATE NODE ANALYSIS')
    console.log('='.repeat(70))

    // Find nodes with duplicate names
    const result = await session.run(`
      MATCH (n:CurriculumEntity)
      WITH n.name AS name, collect(n) AS nodes
      WHERE size(nodes) > 1
      RETURN name,
             size(nodes) AS count,
             [node IN nodes | {
               id: node.id,
               fullPath: node.fullPath,
               entityType: node.entityType,
               domain: node.domainName,
               objective: node.objectiveName,
               summary: node.contextSummary
             }] AS instances
      ORDER BY count DESC
    `)

    if (result.records.length === 0) {
      console.log('\n✅ No duplicate nodes found!\n')
      return
    }

    console.log(`\n⚠️  Found ${result.records.length} duplicate node names\n`)
    console.log('='.repeat(70))

    let totalDuplicates = 0
    const duplicatesByType = {
      trueDuplicates: [],      // Same context, should merge
      contextualDuplicates: [], // Different contexts, legitimate
      unclear: []              // Need manual review
    }

    result.records.forEach((record, idx) => {
      const name = record.get('name')
      const count = record.get('count').toNumber()
      const instances = record.get('instances')
      totalDuplicates += count

      console.log(`\n${idx + 1}. "${name}" (${count} instances)`)
      console.log('-'.repeat(70))

      instances.forEach((inst, i) => {
        console.log(`   ${i + 1}. Path: ${inst.fullPath}`)
        console.log(`      Type: ${inst.entityType}`)
        console.log(`      Domain: ${inst.domain || 'N/A'}`)
        console.log(`      Objective: ${inst.objective || 'N/A'}`)
        if (inst.summary) {
          console.log(`      Summary: ${inst.summary.substring(0, 80)}...`)
        }
        console.log()
      })

      // Classify duplicate type
      const domains = new Set(instances.map(i => i.domain).filter(Boolean))
      const objectives = new Set(instances.map(i => i.objective).filter(Boolean))
      const summaries = instances.map(i => i.summary || '').filter(Boolean)

      if (domains.size === 1 && objectives.size === 1) {
        // Same domain and objective - likely true duplicate
        duplicatesByType.trueDuplicates.push({ name, count, instances })
      } else if (domains.size > 1) {
        // Different domains - likely contextual (homonyms)
        duplicatesByType.contextualDuplicates.push({ name, count, instances })
      } else {
        duplicatesByType.unclear.push({ name, count, instances })
      }
    })

    console.log('\n' + '='.repeat(70))
    console.log('CLASSIFICATION')
    console.log('='.repeat(70))
    console.log(`\n✅ True Duplicates (same context, should merge): ${duplicatesByType.trueDuplicates.length}`)
    duplicatesByType.trueDuplicates.forEach(d => {
      console.log(`   - "${d.name}" (${d.count} instances)`)
    })

    console.log(`\n⚠️  Contextual Duplicates (different contexts, legitimate): ${duplicatesByType.contextualDuplicates.length}`)
    duplicatesByType.contextualDuplicates.forEach(d => {
      console.log(`   - "${d.name}" (${d.count} instances across ${new Set(d.instances.map(i => i.domain)).size} domains)`)
    })

    console.log(`\n❓ Unclear (needs manual review): ${duplicatesByType.unclear.length}`)
    duplicatesByType.unclear.forEach(d => {
      console.log(`   - "${d.name}" (${d.count} instances)`)
    })

    console.log('\n' + '='.repeat(70))
    console.log('SUMMARY')
    console.log('='.repeat(70))
    console.log(`Total unique names: 844 - ${result.records.length} = ${844 - result.records.length}`)
    console.log(`Total duplicate instances: ${totalDuplicates}`)
    console.log(`Wasted nodes: ${totalDuplicates - result.records.length}`)
    console.log('='.repeat(70))

  } finally {
    await session.close()
    await driver.close()
  }
}

findDuplicates().catch(console.error)
