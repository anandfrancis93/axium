import fs from 'fs'

const data = JSON.parse(fs.readFileSync('./curriculum-parsed.json', 'utf-8'))
const batchSize = parseInt(process.argv[2]) || 100
const offset = parseInt(process.argv[3]) || 0

const batch = data.entities.slice(offset, offset + batchSize)

console.log(JSON.stringify(batch, null, 2))
