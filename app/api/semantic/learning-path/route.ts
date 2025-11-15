/**
 * API: Get Optimal Learning Path
 *
 * Endpoint: GET /api/semantic/learning-path?domain=X&targetEntity=Y
 *
 * Returns optimal learning path for a domain or to reach a specific entity
 */

import { NextRequest, NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || ''
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ''

interface PathNode {
  id: string
  name: string
  level: string
  difficultyScore: number
  learningDepth: number
  estimatedStudyTime: number // minutes
}

interface LearningPath {
  path: PathNode[]
  totalNodes: number
  totalDifficulty: number
  estimatedTotalTime: number // minutes
  startingPoints: PathNode[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const domain = searchParams.get('domain')
    const targetEntityId = searchParams.get('targetEntity')

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
      let learningPath: LearningPath

      if (targetEntityId) {
        // Get path to specific entity
        learningPath = await getPathToEntity(session, targetEntityId)
      } else if (domain) {
        // Get recommended path for domain
        learningPath = await getPathForDomain(session, domain)
      } else {
        return NextResponse.json(
          { error: 'Must specify either domain or targetEntity' },
          { status: 400 }
        )
      }

      return NextResponse.json(learningPath)

    } finally {
      await session.close()
      await driver.close()
    }

  } catch (error: any) {
    console.error('Error generating learning path:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate learning path',
        message: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Get optimal path to a specific entity
 */
async function getPathToEntity(
  session: any,
  targetEntityId: string
): Promise<LearningPath> {
  // Find shortest path from any root to target
  const result = await session.run(`
    MATCH (target:CurriculumEntity {id: $targetEntityId})
    MATCH path = shortestPath((root)-[:PREREQUISITE*0..]->(target))
    WHERE NOT EXISTS {
      MATCH (other)-[:PREREQUISITE]->(root)
    }
    WITH path, nodes(path) as pathNodes
    ORDER BY length(path) ASC
    LIMIT 1
    UNWIND pathNodes as node
    RETURN node.id as id,
           node.name as name,
           node.level as level,
           node.difficultyScore as difficultyScore,
           node.learningDepth as learningDepth
    ORDER BY node.learningDepth ASC
  `, { targetEntityId })

  const path: PathNode[] = result.records.map((record: any) => {
    const difficultyScore = record.get('difficultyScore') || 3
    return {
      id: record.get('id'),
      name: record.get('name'),
      level: record.get('level'),
      difficultyScore,
      learningDepth: record.get('learningDepth') || 0,
      estimatedStudyTime: estimateStudyTime(difficultyScore)
    }
  })

  // Get all root nodes as starting points
  const rootResult = await session.run(`
    MATCH (root:CurriculumEntity)
    WHERE NOT EXISTS {
      MATCH (other)-[:PREREQUISITE]->(root)
    }
    AND root.level IN ['topic', 'subtopic']
    RETURN root.id as id,
           root.name as name,
           root.level as level,
           root.difficultyScore as difficultyScore,
           root.learningDepth as learningDepth
    ORDER BY root.difficultyScore ASC
    LIMIT 10
  `)

  const startingPoints: PathNode[] = rootResult.records.map((record: any) => {
    const difficultyScore = record.get('difficultyScore') || 3
    return {
      id: record.get('id'),
      name: record.get('name'),
      level: record.get('level'),
      difficultyScore,
      learningDepth: 0,
      estimatedStudyTime: estimateStudyTime(difficultyScore)
    }
  })

  return {
    path,
    totalNodes: path.length,
    totalDifficulty: path.reduce((sum, node) => sum + node.difficultyScore, 0),
    estimatedTotalTime: path.reduce((sum, node) => sum + node.estimatedStudyTime, 0),
    startingPoints
  }
}

/**
 * Get recommended path for a domain
 */
async function getPathForDomain(
  session: any,
  domain: string
): Promise<LearningPath> {
  // Get entities in domain ordered by learning depth and difficulty
  const result = await session.run(`
    MATCH (entity:CurriculumEntity)
    WHERE entity.domainName = $domain
      AND entity.level IN ['topic', 'subtopic']
    RETURN entity.id as id,
           entity.name as name,
           entity.level as level,
           entity.difficultyScore as difficultyScore,
           entity.learningDepth as learningDepth
    ORDER BY entity.learningDepth ASC, entity.difficultyScore ASC
    LIMIT 50
  `, { domain })

  const path: PathNode[] = result.records.map((record: any) => {
    const difficultyScore = record.get('difficultyScore') || 3
    return {
      id: record.get('id'),
      name: record.get('name'),
      level: record.get('level'),
      difficultyScore,
      learningDepth: record.get('learningDepth') || 0,
      estimatedStudyTime: estimateStudyTime(difficultyScore)
    }
  })

  // Starting points are entities with learning depth 0
  const startingPoints = path.filter(node => node.learningDepth === 0)

  return {
    path,
    totalNodes: path.length,
    totalDifficulty: path.reduce((sum, node) => sum + node.difficultyScore, 0),
    estimatedTotalTime: path.reduce((sum, node) => sum + node.estimatedStudyTime, 0),
    startingPoints: startingPoints.length > 0 ? startingPoints : path.slice(0, 5)
  }
}

/**
 * Estimate study time based on difficulty (in minutes)
 */
function estimateStudyTime(difficultyScore: number): number {
  // Base: 15 minutes
  // Add 5 minutes per difficulty point
  return 15 + (difficultyScore * 5)
}
