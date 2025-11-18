/**
 * List all entities missing context summaries
 */

import * as fs from 'fs'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'curriculum-parsed.json')
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

const missing = data.entities
  .map((e: any, idx: number) => ({ ...e, originalIndex: idx + 1 }))
  .filter((e: any) => e.contextSummary === null)

console.log(`Total entities: ${data.entities.length}`)
console.log(`With summaries: ${data.metadata.summariesGenerated}`)
console.log(`Missing summaries: ${missing.length}\n`)

console.log('Entities missing summaries:\n')
missing.forEach((e: any, i: number) => {
  console.log(`${e.originalIndex}. ${e.fullPath}`)
})
