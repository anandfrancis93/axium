/**
 * API: Get Prerequisites for an Entity
 *
 * Endpoint: GET /api/semantic/prerequisites/[entityId]
 *
 * Returns all prerequisite relationships for a given entity,
 * including learning paths and difficulty scores
 */

import { NextRequest, NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || ''
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

interface Prerequisite {
  id: string
  name: string
  level: string
  relationshipType: string
  strategy: string
  confidence: number
  reasoning: string
  difficultyScore: number
  learningDepth: number
}

interface PrerequisiteResponse {
  entityId: string
  entityName: string
  prerequisites: Prerequisite[]
  learningPath: string[]
  totalDepth: number
  estimatedStudyOrder: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params

    if (!NEO4J_URI || !NEO4J_PASSWORD) {
      return NextResponse.json(
        { error: 'Neo4j connection not configured' },
        { status: 500 }
      )
    }

    const driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    )

    const session = driver.session()

    try {
      // Get entity info
      const entityResult = await session.run(`
        MATCH (entity:CurriculumEntity {id: $entityId})
        RETURN entity.name as name,
               entity.level as level,
               entity.learningDepth as learningDepth,
               entity.difficultyScore as difficultyScore
      `, { entityId })

      if (entityResult.records.length === 0) {
        return NextResponse.json(
          { error: 'Entity not found' },
          { status: 404 }
        )
      }

      const entityRecord = entityResult.records[0]
      const entityName = entityRecord.get('name')
      const learningDepth = entityRecord.get('learningDepth') || 0
      const difficultyScore = entityRecord.get('difficultyScore') || 0

      // Get all prerequisites
      const prereqResult = await session.run(`
        MATCH (prereq)-[r:PREREQUISITE]->(entity:CurriculumEntity {id: $entityId})
        RETURN prereq.id as id,
               prereq.name as name,
               prereq.level as level,
               r.strategy as strategy,
               r.confidence as confidence,
               r.reasoning as reasoning,
               prereq.difficultyScore as difficultyScore,
               prereq.learningDepth as learningDepth
        ORDER BY prereq.learningDepth ASC, prereq.difficultyScore ASC
      `, { entityId })

      const prerequisites: Prerequisite[] = prereqResult.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        level: record.get('level'),
        relationshipType: 'PREREQUISITE',
        strategy: record.get('strategy'),
        confidence: record.get('confidence'),
        reasoning: record.get('reasoning'),
        difficultyScore: record.get('difficultyScore') || 0,
        learningDepth: record.get('learningDepth') || 0
      }))

      // Get learning path (from root to this entity)
      const pathResult = await session.run(`
        MATCH path = shortestPath((root)-[:PREREQUISITE*]->(entity:CurriculumEntity {id: $entityId}))
        WHERE NOT EXISTS {
          MATCH (other)-[:PREREQUISITE]->(root)
        }
        RETURN [node in nodes(path) | node.name] as pathNames
        ORDER BY length(path) DESC
        LIMIT 1
      `, { entityId })

      const learningPath = pathResult.records.length > 0
        ? pathResult.records[0].get('pathNames')
        : [entityName]

      // Calculate estimated study order (based on learning depth + difficulty)
      const estimatedStudyOrder = learningDepth * 10 + Math.floor(difficultyScore / 2)

      const response: PrerequisiteResponse = {
        entityId,
        entityName,
        prerequisites,
        learningPath,
        totalDepth: learningDepth,
        estimatedStudyOrder
      }

      return NextResponse.json(response)

    } finally {
      await session.close()
      await driver.close()
    }

  } catch (error: any) {
    console.error('Error fetching prerequisites:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch prerequisites',
        message: error.message
      },
      { status: 500 }
    )
  }
}
