import neo4j from 'neo4j-driver'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkDepths() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
  )

  const session = driver.session({ database: 'neo4j' })

  try {
    const result = await session.run(`
      MATCH (e:CurriculumEntity)
      RETURN e.level AS level, e.depth AS depth, e.entityType AS entityType, count(*) AS count
      ORDER BY depth, level
    `)

    console.log('Level → Depth → EntityType mapping in Neo4j:\n')
    result.records.forEach(record => {
      const level = record.get('level')
      const depth = record.get('depth')
      const entityType = record.get('entityType')
      const count = record.get('count').toNumber()
      console.log(`  ${level?.padEnd(15)} → depth ${depth} → ${entityType?.padEnd(15)} (${count} entities)`)
    })

  } finally {
    await session.close()
    await driver.close()
  }
}

checkDepths()
