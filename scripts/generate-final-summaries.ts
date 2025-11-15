/**
 * Generate all remaining context summaries at once
 * This script will create summaries for all entities that still need them
 */

import * as fs from 'fs'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'curriculum-parsed.json')
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

// Get all entities missing summaries
const missingEntities = data.entities.filter((e: any) => e.contextSummary === null)

console.log(`Found ${missingEntities.length} entities missing summaries`)
console.log(`Generating path list for batch processing...`)

// Export paths for manual batch creation
const paths = missingEntities.map((e: any) => e.fullPath)
fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'remaining-summary-paths.json'),
  JSON.stringify(paths, null, 2)
)

console.log(`✅ Exported ${paths.length} paths to scripts/remaining-summary-paths.json`)
console.log(`\nNext steps:`)
console.log(`1. Create batch-11-summaries.ts with summaries for these paths`)
console.log(`2. Run: npx tsx scripts/batch-11-summaries.ts`)
console.log(`3. Verify completion: All 844 entities should have summaries`)
