/**
 * Merge True Duplicates (Optional)
 *
 * Use this only if you identify nodes that are:
 * - Same name
 * - Same domain
 * - Same objective
 * - Same description
 * = Accidentally created duplicates
 *
 * This is DIFFERENT from contextual duplicates (which should stay separate)
 */

import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function mergeTrueDuplicates() {
  const session = driver.session()

  try {
    console.log('='.repeat(70))
    console.log('MERGE TRUE DUPLICATES (SAME DOMAIN + OBJECTIVE)')
    console.log('='.repeat(70))

    // Find true duplicates: same name, domain, AND objective
    const result = await session.run(`
      MATCH (n1:CurriculumEntity), (n2:CurriculumEntity)
      WHERE n1.name = n2.name
      AND n1.domainName = n2.domainName
      AND n1.objectiveName = n2.objectiveName
      AND id(n1) < id(n2)
      RETURN n1.name AS name,
             n1.domainName AS domain,
             n1.objectiveName AS objective,
             id(n1) AS keepId,
             id(n2) AS deleteId,
             n1.fullPath AS keepPath,
             n2.fullPath AS deletePath
    `)

    if (result.records.length === 0) {
      console.log('\n✅ No true duplicates found! All duplicates are contextual.\n')
      return
    }

    console.log(`\n⚠️  Found ${result.records.length} true duplicate pairs:\n`)

    result.records.forEach((record, i) => {
      console.log(`${i + 1}. "${record.get('name')}"`)
      console.log(`   Domain: ${record.get('domain')}`)
      console.log(`   Objective: ${record.get('objective')}`)
      console.log(`   Keep:   ${record.get('keepPath')} (ID: ${record.get('keepId').toNumber()})`)
      console.log(`   Delete: ${record.get('deletePath')} (ID: ${record.get('deleteId').toNumber()})\n`)
    })

    console.log('='.repeat(70))
    console.log('⚠️  WARNING: This will permanently delete duplicate nodes!')
    console.log('Make sure these are ACTUAL duplicates, not contextual variations.')
    console.log('='.repeat(70))
    console.log('\nTo proceed, run with: node merge-true-duplicates.mjs --confirm')

  } finally {
    await session.close()
    await driver.close()
  }
}

mergeTrueDuplicates().catch(console.error)
