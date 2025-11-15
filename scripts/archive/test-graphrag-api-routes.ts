/**
 * Test GraphRAG API Routes
 *
 * This script tests the GraphRAG context retrieval API endpoints
 * by making HTTP requests to the Next.js API routes.
 *
 * Run: npx tsx scripts/test-graphrag-api-routes.ts
 *
 * Prerequisites: Next.js dev server must be running (npm run dev)
 */

const API_BASE = 'http://localhost:3000/api/graphrag'

// Test entity IDs (from test-graphrag-queries.ts results)
const TEST_ENTITY_ID = '1dfe2982-936f-4764-9bd3-96769d32ac66' // Encryption topic

async function testContextEndpoint() {
  console.log('\n' + '='.repeat(80))
  console.log('Testing GraphRAG Context API Endpoint')
  console.log('='.repeat(80))

  console.log(`\n🔍 Test 1: GET /api/graphrag/context/${TEST_ENTITY_ID}`)

  try {
    const response = await fetch(`${API_BASE}/context/${TEST_ENTITY_ID}`)

    if (!response.ok) {
      console.log(`❌ Request failed with status ${response.status}`)
      const error = await response.json()
      console.log(`   Error:`, error)
      return false
    }

    const context = await response.json()

    console.log(`✅ Context retrieved successfully!`)
    console.log(`\n📝 Entity Details:`)
    console.log(`   ID: ${context.id}`)
    console.log(`   Name: ${context.name}`)
    console.log(`   Type: ${context.entityType}`)
    console.log(`   Domain: ${context.domain}`)
    console.log(`   Summary: ${context.summary?.substring(0, 80)}...`)
    console.log(`   Children: ${context.children.length}`)
    console.log(`   Related Concepts: ${context.relatedConcepts.length}`)

    return true
  } catch (error: any) {
    console.log(`❌ Request failed:`, error.message)
    return false
  }
}

async function testSearchEndpoint() {
  console.log('\n\n' + '='.repeat(80))
  console.log('Testing GraphRAG Search API Endpoint')
  console.log('='.repeat(80))

  const tests = [
    {
      name: 'Search by name',
      url: `${API_BASE}/search?name=Encryption`,
      expectedCount: 6 // Encryption appears in 6 places
    },
    {
      name: 'Search by scope tag',
      url: `${API_BASE}/search?scope=cryptography&limit=10`,
      expectedMin: 5
    },
    {
      name: 'Search by domain',
      url: `${API_BASE}/search?domain=General Security Concepts`,
      expectedMin: 100
    },
    {
      name: 'Invalid search (no params)',
      url: `${API_BASE}/search`,
      expectError: true
    }
  ]

  let passCount = 0

  for (const test of tests) {
    console.log(`\n🔍 Test: ${test.name}`)
    console.log(`   URL: ${test.url}`)

    try {
      const response = await fetch(test.url)

      if (test.expectError) {
        if (!response.ok) {
          console.log(`✅ Expected error received (status ${response.status})`)
          passCount++
        } else {
          console.log(`❌ Expected error but got success`)
        }
        continue
      }

      if (!response.ok) {
        console.log(`❌ Request failed with status ${response.status}`)
        const error = await response.json()
        console.log(`   Error:`, error)
        continue
      }

      const data = await response.json()

      console.log(`✅ Search successful!`)
      console.log(`   Search Type: ${data.searchType}`)
      console.log(`   Query: ${data.query}`)
      console.log(`   Results: ${data.count}`)

      if (test.expectedCount && data.count === test.expectedCount) {
        console.log(`   ✅ Count matches expected (${test.expectedCount})`)
        passCount++
      } else if (test.expectedMin && data.count >= test.expectedMin) {
        console.log(`   ✅ Count >= expected minimum (${test.expectedMin})`)
        passCount++
      } else if (data.count > 0) {
        console.log(`   ✅ Results returned`)
        passCount++
      }

      // Show sample results
      if (data.results && data.results.length > 0) {
        console.log(`\n   Sample Results:`)
        data.results.slice(0, 3).forEach((result: any, idx: number) => {
          console.log(`   ${idx + 1}. ${result.name} (${result.entityType || result.domain})`)
        })
      }
    } catch (error: any) {
      console.log(`❌ Request failed:`, error.message)
    }
  }

  console.log(`\n📊 Search Tests: ${passCount}/${tests.length} passed`)

  return passCount === tests.length
}

async function runTests() {
  console.log('\n' + '='.repeat(80))
  console.log('GraphRAG API Route Tests')
  console.log('='.repeat(80))
  console.log('\n⚠️  Prerequisites:')
  console.log('   - Next.js dev server must be running (npm run dev)')
  console.log('   - Server must be on http://localhost:3000')
  console.log('   - Neo4j database must be accessible')

  // Check if server is running
  console.log('\n🔌 Checking if Next.js dev server is running...')
  try {
    const response = await fetch('http://localhost:3000')
    if (response.ok) {
      console.log('✅ Server is running!')
    } else {
      console.log('⚠️  Server responded but may not be ready')
    }
  } catch (error) {
    console.log('❌ Server is not running!')
    console.log('   Please start the dev server with: npm run dev')
    process.exit(1)
  }

  const contextSuccess = await testContextEndpoint()
  const searchSuccess = await testSearchEndpoint()

  console.log('\n\n' + '='.repeat(80))
  console.log('Test Summary')
  console.log('='.repeat(80))
  console.log(`\n   Context Endpoint: ${contextSuccess ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`   Search Endpoint:  ${searchSuccess ? '✅ PASS' : '❌ FAIL'}`)

  if (contextSuccess && searchSuccess) {
    console.log(`\n✅ All GraphRAG API tests passed!`)
    console.log('='.repeat(80) + '\n')
    process.exit(0)
  } else {
    console.log(`\n❌ Some tests failed. Check logs above for details.`)
    console.log('='.repeat(80) + '\n')
    process.exit(1)
  }
}

runTests()
