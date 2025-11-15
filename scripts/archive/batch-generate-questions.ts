import { getEntitiesByDomain, getEntitiesByScope } from '../lib/graphrag/context'
import { generateQuestionWithRetry } from '../lib/graphrag/generate'
import { storeGeneratedQuestion } from '../lib/graphrag/storage'
import { QuestionFormat, getRecommendedFormats, BLOOM_LEVELS } from '../lib/graphrag/prompts'
import { createScriptClient } from '../lib/supabase/script-client'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })

/**
 * Batch Question Generation Configuration
 */
interface BatchConfig {
  // Selection criteria
  domain?: string                    // Generate for specific domain
  scopeTag?: string                  // Generate for specific scope tag
  entityIds?: string[]               // Generate for specific entities
  limit?: number                     // Max entities to process

  // Question parameters
  bloomLevels: number[]              // Bloom levels to generate (e.g., [1, 2, 3])
  formats?: QuestionFormat[]         // Specific formats, or auto-select
  questionsPerEntity?: number        // Questions per entity (default: 1 per Bloom level)

  // Processing
  batchSize?: number                 // Process N entities at a time (default: 10)
  delayBetweenBatches?: number       // ms delay between batches (default: 5000)
  maxRetries?: number                // Max retries per question (default: 3)

  // Output
  store?: boolean                    // Store in database (default: true)
  saveToFile?: boolean               // Save results to JSON file (default: true)
  outputFile?: string                // Output file path

  // Resume
  resumeFromFile?: string            // Resume from previous run
}

interface BatchResult {
  totalEntities: number
  totalQuestions: number
  successCount: number
  failureCount: number
  duplicateCount: number
  totalCost: number
  totalTokens: number
  startTime: Date
  endTime?: Date
  questions: Array<{
    entityId: string
    entityName: string
    bloomLevel: number
    format: QuestionFormat
    success: boolean
    questionId?: string
    error?: string
    cost?: number
    tokens?: number
  }>
}

/**
 * Save progress to file
 */
function saveProgress(result: BatchResult, outputFile: string) {
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2))
  console.log(`Progress saved to ${outputFile}`)
}

/**
 * Load previous progress
 */
function loadProgress(inputFile: string): BatchResult | null {
  if (!fs.existsSync(inputFile)) {
    return null
  }
  const data = fs.readFileSync(inputFile, 'utf-8')
  return JSON.parse(data)
}

/**
 * Batch generate questions
 */
export async function batchGenerateQuestions(config: BatchConfig): Promise<BatchResult> {
  console.log('\n' + '='.repeat(80))
  console.log('Batch Question Generation')
  console.log('='.repeat(80))

  // Create script-safe Supabase client
  const supabase = createScriptClient()

  // Initialize or resume result
  let result: BatchResult = config.resumeFromFile
    ? loadProgress(config.resumeFromFile) || {
        totalEntities: 0,
        totalQuestions: 0,
        successCount: 0,
        failureCount: 0,
        duplicateCount: 0,
        totalCost: 0,
        totalTokens: 0,
        startTime: new Date(),
        questions: []
      }
    : {
        totalEntities: 0,
        totalQuestions: 0,
        successCount: 0,
        failureCount: 0,
        duplicateCount: 0,
        totalCost: 0,
        totalTokens: 0,
        startTime: new Date(),
        questions: []
      }

  const outputFile = config.outputFile || `batch-questions-${Date.now()}.json`

  // Get processed entity IDs (for resume)
  const processedEntityIds = new Set(result.questions.map(q => q.entityId))

  try {
    // Step 1: Get entities
    console.log('\n📍 Step 1: Retrieving entities...')
    let entities

    if (config.entityIds) {
      console.log(`Using ${config.entityIds.length} specific entity IDs`)
      entities = [] // Would need getContextById for each
    } else if (config.domain) {
      console.log(`Fetching entities for domain: ${config.domain}`)
      entities = await getEntitiesByDomain(config.domain, 2) // Topics and below
    } else if (config.scopeTag) {
      console.log(`Fetching entities for scope tag: ${config.scopeTag}`)
      entities = await getEntitiesByScope(config.scopeTag, config.limit || 100, 2)
    } else {
      throw new Error('Must specify domain, scopeTag, or entityIds')
    }

    // Filter out already processed (for resume)
    entities = entities.filter(e => !processedEntityIds.has(e.id))

    if (config.limit && entities.length > config.limit) {
      entities = entities.slice(0, config.limit)
    }

    console.log(`✅ Found ${entities.length} entities to process`)
    result.totalEntities = entities.length + processedEntityIds.size

    // Step 2: Generate questions in batches
    console.log('\n🤖 Step 2: Generating questions...')

    const batchSize = config.batchSize || 10
    const delayBetweenBatches = config.delayBetweenBatches || 5000
    const store = config.store !== false
    const saveToFile = config.saveToFile !== false

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(entities.length / batchSize)

      console.log(`\n${'─'.repeat(80)}`)
      console.log(`Batch ${batchNum}/${totalBatches} (Entities ${i + 1}-${Math.min(i + batchSize, entities.length)})`)

      for (const entity of batch) {
        console.log(`\n  Entity: ${entity.name} (${entity.entityType})`)

        // Determine formats
        let formats = config.formats
        if (!formats || formats.length === 0) {
          // Auto-select based on Bloom levels
          const allFormats = new Set<QuestionFormat>()
          config.bloomLevels.forEach(level => {
            getRecommendedFormats(level).forEach(format => allFormats.add(format))
          })
          formats = Array.from(allFormats).slice(0, 2) // Use top 2 recommended formats
        }

        // Generate questions for each Bloom level × format combination
        for (const bloomLevel of config.bloomLevels) {
          for (const format of formats) {
            result.totalQuestions++

            console.log(`    Generating: Bloom ${bloomLevel} - ${format}`)

            try {
              // Get full context (need to fetch)
              const { getContextById } = await import('../lib/graphrag/context')
              const context = await getContextById(entity.id)

              if (!context) {
                console.log(`    ❌ Context not found`)
                result.failureCount++
                result.questions.push({
                  entityId: entity.id,
                  entityName: entity.name,
                  bloomLevel,
                  format,
                  success: false,
                  error: 'Context not found'
                })
                continue
              }

              // Generate question
              const question = await generateQuestionWithRetry(
                context,
                bloomLevel,
                format,
                config.maxRetries || 3
              )

              const cost = (question.tokensUsed.input * 3 / 1000000) + (question.tokensUsed.output * 15 / 1000000)
              result.totalCost += cost
              result.totalTokens += question.tokensUsed.total

              console.log(`    ✅ Generated (${question.tokensUsed.total} tokens, $${cost.toFixed(6)})`)

              // Store if requested
              let questionId: string | undefined
              if (store) {
                const storageResult = await storeGeneratedQuestion(question, undefined, undefined, supabase)
                if (storageResult.success) {
                  questionId = storageResult.questionId
                  if (storageResult.isDuplicate) {
                    console.log(`    📋 Duplicate detected`)
                    result.duplicateCount++
                  } else {
                    console.log(`    💾 Stored: ${questionId}`)
                    result.successCount++
                  }
                } else {
                  console.log(`    ❌ Storage failed: ${storageResult.error}`)
                }
              } else {
                result.successCount++
              }

              result.questions.push({
                entityId: entity.id,
                entityName: entity.name,
                bloomLevel,
                format,
                success: true,
                questionId,
                cost,
                tokens: question.tokensUsed.total
              })

              // Small delay between questions
              await new Promise(resolve => setTimeout(resolve, 1000))

            } catch (error: any) {
              console.log(`    ❌ Failed: ${error.message}`)
              result.failureCount++
              result.questions.push({
                entityId: entity.id,
                entityName: entity.name,
                bloomLevel,
                format,
                success: false,
                error: error.message
              })
            }
          }
        }
      }

      // Save progress after each batch
      if (saveToFile) {
        saveProgress(result, outputFile)
      }

      // Delay between batches (except last batch)
      if (i + batchSize < entities.length) {
        console.log(`\n⏸️  Pausing ${delayBetweenBatches}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    // Final summary
    result.endTime = new Date()
    const duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000

    console.log(`\n\n${'='.repeat(80)}`)
    console.log('Batch Generation Complete')
    console.log('='.repeat(80))

    console.log(`\n📊 Summary:`)
    console.log(`   Total Entities: ${result.totalEntities}`)
    console.log(`   Total Questions: ${result.totalQuestions}`)
    console.log(`   Successful: ${result.successCount} (${Math.round(result.successCount / result.totalQuestions * 100)}%)`)
    console.log(`   Failed: ${result.failureCount} (${Math.round(result.failureCount / result.totalQuestions * 100)}%)`)
    console.log(`   Duplicates: ${result.duplicateCount}`)

    console.log(`\n💰 Cost:`)
    console.log(`   Total Tokens: ${result.totalTokens.toLocaleString()}`)
    console.log(`   Total Cost: $${result.totalCost.toFixed(4)}`)
    console.log(`   Avg Cost per Question: $${(result.totalCost / result.successCount).toFixed(6)}`)

    console.log(`\n⏱️  Performance:`)
    console.log(`   Duration: ${Math.round(duration)}s (${Math.round(duration / 60)} minutes)`)
    console.log(`   Questions/minute: ${Math.round(result.totalQuestions / (duration / 60))}`)

    if (saveToFile) {
      saveProgress(result, outputFile)
      console.log(`\n💾 Results saved to: ${outputFile}`)
    }

    console.log(`\n${'='.repeat(80)}\n`)

    return result

  } catch (error: any) {
    console.error('\n❌ Batch generation failed:', error)
    result.endTime = new Date()
    if (config.saveToFile !== false) {
      saveProgress(result, outputFile)
    }
    throw error
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Usage: npx tsx scripts/batch-generate-questions.ts [options]

Options:
  --domain <name>          Generate for specific domain
  --scope <tag>            Generate for specific scope tag
  --bloom <levels>         Comma-separated Bloom levels (e.g., "1,2,3")
  --formats <formats>      Comma-separated formats (e.g., "mcq_single,true_false")
  --limit <n>              Max entities to process
  --batch-size <n>         Process N entities at a time (default: 10)
  --delay <ms>             Delay between batches in ms (default: 5000)
  --no-store               Don't store in database
  --no-save                Don't save to file
  --output <file>          Output file path
  --resume <file>          Resume from previous run

Examples:
  # Generate questions for cryptography topics (Bloom 1-3)
  npx tsx scripts/batch-generate-questions.ts --scope cryptography --bloom 1,2,3 --limit 10

  # Generate for entire domain
  npx tsx scripts/batch-generate-questions.ts --domain "General Security Concepts" --bloom 2,3

  # Resume from previous run
  npx tsx scripts/batch-generate-questions.ts --resume batch-questions-12345.json
    `)
    process.exit(0)
  }

  // Parse arguments
  const config: BatchConfig = {
    bloomLevels: [2, 3], // Default
    batchSize: 10,
    delayBetweenBatches: 5000
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]

    switch (arg) {
      case '--domain':
        config.domain = next
        i++
        break
      case '--scope':
        config.scopeTag = next
        i++
        break
      case '--bloom':
        config.bloomLevels = next.split(',').map(n => parseInt(n.trim()))
        i++
        break
      case '--formats':
        config.formats = next.split(',').map(f => f.trim() as QuestionFormat)
        i++
        break
      case '--limit':
        config.limit = parseInt(next)
        i++
        break
      case '--batch-size':
        config.batchSize = parseInt(next)
        i++
        break
      case '--delay':
        config.delayBetweenBatches = parseInt(next)
        i++
        break
      case '--no-store':
        config.store = false
        break
      case '--no-save':
        config.saveToFile = false
        break
      case '--output':
        config.outputFile = next
        i++
        break
      case '--resume':
        config.resumeFromFile = next
        i++
        break
    }
  }

  batchGenerateQuestions(config)
    .then(result => {
      console.log('✅ Batch generation completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Batch generation failed:', error)
      process.exit(1)
    })
}
