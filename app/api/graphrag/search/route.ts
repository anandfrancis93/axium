import { NextRequest, NextResponse } from 'next/server'
import { findEntitiesByName, getEntitiesByScope, getEntitiesByDomain } from '@/lib/graphrag/context'

/**
 * GET /api/graphrag/search
 *
 * Search for curriculum entities by various criteria.
 *
 * Query parameters:
 * - name: Search by entity name (returns multiple if name appears in different domains)
 * - scope: Search by scope tag (e.g., "cryptography", "network-security")
 * - domain: Search by domain name
 * - limit: Maximum results (default: 50)
 *
 * Examples:
 * - /api/graphrag/search?name=Encryption
 * - /api/graphrag/search?scope=cryptography&limit=20
 * - /api/graphrag/search?domain=General Security Concepts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name')
    const scope = searchParams.get('scope')
    const domain = searchParams.get('domain')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // Validate limit
    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 200' },
        { status: 400 }
      )
    }

    // Require at least one search parameter
    if (!name && !scope && !domain) {
      return NextResponse.json(
        {
          error: 'Missing search parameter',
          message: 'Provide at least one of: name, scope, or domain'
        },
        { status: 400 }
      )
    }

    // Execute appropriate search
    let results

    if (name) {
      // Search by name (returns full context for each match)
      results = await findEntitiesByName(name)
      return NextResponse.json({
        searchType: 'name',
        query: name,
        count: results.length,
        results
      })
    } else if (scope) {
      // Search by scope tag (returns summaries)
      results = await getEntitiesByScope(scope, limit)
      return NextResponse.json({
        searchType: 'scope',
        query: scope,
        count: results.length,
        limit,
        results
      })
    } else if (domain) {
      // Search by domain (returns summaries)
      results = await getEntitiesByDomain(domain)
      return NextResponse.json({
        searchType: 'domain',
        query: domain,
        count: results.length,
        results
      })
    }

    // Should never reach here
    return NextResponse.json(
      { error: 'Invalid search parameters' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('GraphRAG search error:', error)

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}
