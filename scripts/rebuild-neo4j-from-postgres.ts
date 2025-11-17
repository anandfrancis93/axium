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

interface Topic {
  id: string
  name: string
  description: string
  hierarchy_level: number
  parent_topic_id: string | null
  subject_id: string
}

interface Subject {
  id: string
  name: string
}

async function main() {
  console.log('🔄 Rebuilding Neo4j from PostgreSQL...\n')

  // Initialize clients
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    const session = driver.session()

    // Step 1: Clear Neo4j database
    console.log('🗑️  Clearing Neo4j database...')
    await session.run('MATCH (n) DETACH DELETE n')
    console.log('✅ Neo4j cleared\n')

    // Step 2: Fetch subject
    console.log('📥 Fetching subject from PostgreSQL...')
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('name', 'Cybersecurity')
      .single()

    if (subjectError) throw subjectError
    console.log(`✅ Found subject: ${subjects.name}\n`)

    // Step 3: Create Subject node
    await session.run(
      `CREATE (s:Subject {
        id: $id,
        name: $name
      })`,
      { id: subjects.id, name: subjects.name }
    )
    console.log('✅ Created Subject node in Neo4j\n')

    // Step 4: Fetch all topics
    console.log('📥 Fetching topics from PostgreSQL...')
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjects.id)
      .order('hierarchy_level', { ascending: true })
      .order('name', { ascending: true })

    if (topicsError) throw topicsError
    console.log(`✅ Found ${topics.length} topics\n`)

    // Step 5: Create Topic nodes
    console.log('📝 Creating Topic nodes...')
    for (const topic of topics) {
      await session.run(
        `CREATE (t:Topic {
          id: $id,
          name: $name,
          description: $description,
          hierarchy_level: $hierarchy_level
        })`,
        {
          id: topic.id,
          name: topic.name,
          description: topic.description || '',
          hierarchy_level: topic.hierarchy_level,
        }
      )
    }
    console.log(`✅ Created ${topics.length} Topic nodes\n`)

    // Step 6: Create relationships
    console.log('🔗 Creating relationships...')

    // Subject → Topic relationships (Level 1 topics)
    const level1Topics = topics.filter((t) => t.hierarchy_level === 1)
    for (const topic of level1Topics) {
      await session.run(
        `MATCH (s:Subject {id: $subjectId})
         MATCH (t:Topic {id: $topicId})
         CREATE (s)-[:HAS_TOPIC]->(t)`,
        { subjectId: subjects.id, topicId: topic.id }
      )
    }
    console.log(`✅ Created ${level1Topics.length} Subject → Topic relationships\n`)

    // Topic → Topic relationships (parent-child)
    const childTopics = topics.filter((t) => t.parent_topic_id !== null)
    for (const topic of childTopics) {
      await session.run(
        `MATCH (parent:Topic {id: $parentId})
         MATCH (child:Topic {id: $childId})
         CREATE (parent)-[:HAS_SUBTOPIC]->(child)`,
        { parentId: topic.parent_topic_id, childId: topic.id }
      )
    }
    console.log(`✅ Created ${childTopics.length} Topic → Topic relationships\n`)

    // Step 7: Verify import
    const countResult = await session.run(
      `MATCH (s:Subject)
       OPTIONAL MATCH (t:Topic)
       RETURN count(DISTINCT s) as subjects, count(DISTINCT t) as topics`
    )
    const counts = countResult.records[0]
    console.log('📊 Neo4j Database Summary:')
    console.log(`   Subjects: ${counts.get('subjects')}`)
    console.log(`   Topics: ${counts.get('topics')}`)

    const levelCountsResult = await session.run(
      `MATCH (t:Topic)
       RETURN t.hierarchy_level as level, count(*) as count
       ORDER BY level`
    )
    console.log('\n   Topics by Level:')
    for (const record of levelCountsResult.records) {
      console.log(`   Level ${record.get('level')}: ${record.get('count')} topics`)
    }

    await session.close()
    console.log('\n✅ Neo4j rebuild complete!')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await driver.close()
  }
}

main()
