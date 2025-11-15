/**
 * Generate Initial Test Question Set
 *
 * This script generates ~50 questions covering:
 * - Multiple domains (General Security Concepts, Threats/Vuln, Security Operations)
 * - Multiple Bloom levels (2-4)
 * - Multiple formats (MCQ Single, MCQ Multi, True/False)
 *
 * Run: npx tsx scripts/generate-test-set.ts
 */

import { batchGenerateQuestions } from './batch-generate-questions'

async function generateTestSet() {
  console.log('='.repeat(80))
  console.log('Generating Initial Test Question Set (~50 questions)')
  console.log('='.repeat(80))

  const configs = [
    {
      name: 'Cryptography Topics (Bloom 2-3)',
      config: {
        scopeTag: 'cryptography',
        bloomLevels: [2, 3],
        formats: ['mcq_single', 'true_false'] as any[],
        limit: 10,
        batchSize: 5,
        delayBetweenBatches: 3000,
        outputFile: 'test-questions-cryptography.json'
      }
    },
    {
      name: 'Network Security Topics (Bloom 2-3)',
      config: {
        scopeTag: 'network-security',
        bloomLevels: [2, 3],
        formats: ['mcq_single', 'mcq_multi'] as any[],
        limit: 10,
        batchSize: 5,
        delayBetweenBatches: 3000,
        outputFile: 'test-questions-network.json'
      }
    },
    {
      name: 'Incident Response Topics (Bloom 3-4)',
      config: {
        scopeTag: 'incident-response',
        bloomLevels: [3, 4],
        formats: ['mcq_multi', 'true_false'] as any[],
        limit: 5,
        batchSize: 5,
        delayBetweenBatches: 3000,
        outputFile: 'test-questions-incident-response.json'
      }
    }
  ]

  let totalQuestions = 0
  let totalCost = 0
  let totalSuccess = 0
  let totalFailed = 0

  for (const { name, config } of configs) {
    console.log(`\n\n${'='.repeat(80)}`)
    console.log(`Generating: ${name}`)
    console.log('='.repeat(80))

    try {
      const result = await batchGenerateQuestions(config)

      totalQuestions += result.totalQuestions
      totalCost += result.totalCost
      totalSuccess += result.successCount
      totalFailed += result.failureCount

      console.log(`✅ ${name} complete: ${result.successCount}/${result.totalQuestions} questions`)

    } catch (error: any) {
      console.error(`❌ ${name} failed:`, error.message)
    }

    // Delay between categories
    console.log(`\n⏸️  Pausing 5s before next category...`)
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  // Final summary
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('Test Set Generation Complete')
  console.log('='.repeat(80))

  console.log(`\n📊 Overall Summary:`)
  console.log(`   Total Questions: ${totalQuestions}`)
  console.log(`   Successful: ${totalSuccess} (${Math.round(totalSuccess / totalQuestions * 100)}%)`)
  console.log(`   Failed: ${totalFailed} (${Math.round(totalFailed / totalQuestions * 100)}%)`)
  console.log(`   Total Cost: $${totalCost.toFixed(4)}`)

  console.log(`\n📁 Output Files:`)
  configs.forEach(c => console.log(`   - ${c.config.outputFile}`))

  console.log(`\n✅ Test set ready for QA review and testing!`)
  console.log('='.repeat(80) + '\n')
}

generateTestSet()
  .catch(error => {
    console.error('❌ Test set generation failed:', error)
    process.exit(1)
  })
