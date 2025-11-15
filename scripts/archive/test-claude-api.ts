import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testClaudeAPI() {
  console.log('\n' + '='.repeat(80))
  console.log('Testing Claude API for Question Generation')
  console.log('='.repeat(80))

  const apiKey = process.env.ANTHROPIC_API_KEY

  console.log('\n📋 Configuration Check:')
  console.log(`  API Key: ${apiKey ? '✅ Set (' + apiKey.substring(0, 20) + '...)' : '❌ Missing'}`)

  if (!apiKey) {
    console.error('\n❌ Missing ANTHROPIC_API_KEY in .env.local')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  try {
    console.log('\n🤖 Testing Claude API with simple question generation...')

    const testContext = {
      topic: 'Encryption',
      summary: 'Encryption transforms data into unreadable format using algorithms to protect confidentiality.',
      domain: 'General Security Concepts',
      related: ['Hashing', 'Digital Signatures', 'PKI']
    }

    const prompt = `You are an expert educator creating a multiple-choice question for cybersecurity learning.

Context:
Topic: ${testContext.topic}
Summary: ${testContext.summary}
Domain: ${testContext.domain}
Related Concepts: ${testContext.related.join(', ')}

Generate ONE multiple-choice question (single answer) at Bloom Level 2 (Understand) that tests conceptual understanding of ${testContext.topic}.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "question": "The question text here?",
  "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
  "correctAnswer": "A",
  "explanation": "Why option A is correct and others are wrong"
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    console.log('✅ Claude API call successful!')

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('\n📝 Claude Response:')
    console.log(responseText)

    // Try to parse as JSON
    try {
      const questionData = JSON.parse(responseText)
      console.log('\n✅ Response is valid JSON')
      console.log('\n📋 Generated Question:')
      console.log(`  Question: ${questionData.question}`)
      console.log(`  Options: ${questionData.options?.length || 0} options`)
      console.log(`  Correct: ${questionData.correctAnswer}`)
      console.log(`  Has Explanation: ${questionData.explanation ? 'Yes' : 'No'}`)
    } catch (parseError) {
      console.log('\n⚠️  Response is not JSON - will need parsing logic')
    }

    console.log('\n💰 Token Usage:')
    console.log(`  Input: ${message.usage.input_tokens}`)
    console.log(`  Output: ${message.usage.output_tokens}`)
    console.log(`  Total: ${message.usage.input_tokens + message.usage.output_tokens}`)

    console.log('\n' + '='.repeat(80))
    console.log('✅ Claude API test passed!')
    console.log('='.repeat(80) + '\n')

  } catch (error: any) {
    console.error('\n❌ Claude API test failed:')
    console.error(`  Error: ${error.message}`)
    if (error.status) {
      console.error(`  Status: ${error.status}`)
    }
    throw error
  }
}

testClaudeAPI()
