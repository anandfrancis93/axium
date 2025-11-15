import fs from 'fs'

const data = JSON.parse(fs.readFileSync('./curriculum-parsed.json', 'utf-8'))

const needSummaries = data.entities.filter(e => !e.contextSummary)
const haveSummaries = data.entities.filter(e => e.contextSummary)

console.log('Total entities:', data.entities.length)
console.log('Entities with summaries:', haveSummaries.length)
console.log('Entities needing summaries:', needSummaries.length)

console.log('\nFirst 100 entities needing summaries:')
console.log(JSON.stringify(needSummaries.slice(0, 100).map(e => ({
  id: e.id,
  name: e.name,
  level: e.level,
  fullPath: e.fullPath
})), null, 2))
