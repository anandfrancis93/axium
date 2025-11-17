import neo4j from 'neo4j-driver'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const NEO4J_URI = process.env.NEO4J_URI!
const NEO4J_USER = process.env.NEO4J_USERNAME!
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  console.log('🔄 Clearing GraphRAG data from Neo4j and Supabase...\n')

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    const session = driver.session()

    // Step 1: Clear GraphRAG entities from Neo4j
    console.log('🗑️  Clearing GraphRAG Entity nodes from Neo4j...')
    const neo4jResult = await session.run(
      'MATCH (e:Entity) DETACH DELETE e RETURN count(e) as deletedCount'
    )
    const deletedEntities = neo4jResult.records[0]?.get('deletedCount')?.toInt() || 0
    console.log(`✅ Deleted ${deletedEntities} Entity nodes from Neo4j\n`)

    await session.close()

    // Step 2: Clear GraphRAG tables in Supabase
    console.log('🗑️  Clearing GraphRAG tables in Supabase...')

    // Delete in correct order (respecting foreign key constraints)
    const tables = [
      'graphrag_metrics',
      'graphrag_query_cache',
      'graphrag_communities',
      'graphrag_relationships',
      'graphrag_entities',
      'graphrag_indexing_jobs'
    ]

    for (const table of tables) {
      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (error) {
        console.error(`❌ Error clearing ${table}:`, error.message)
      } else {
        console.log(`✅ Cleared ${table}`)
      }
    }

    console.log('\n✅ GraphRAG data cleared successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Neo4j Entity nodes deleted: ${deletedEntities}`)
    console.log(`   Supabase tables cleared: ${tables.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await driver.close()
  }
}

main()
