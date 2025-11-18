/**
 * Test Anthropic API Credit Availability
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

async function testCredits() {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Reply with just "OK" if you receive this.'
      }]
    })

    console.log('✅ API Credits Available')
    const content = response.content[0]
    if (content.type === 'text') {
      console.log('Response:', content.text)
    }
    console.log('\n🎉 Ready to proceed with Phase 2 LLM extraction!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ API Error:', error.message)
    if (error.message.includes('credit') || error.message.includes('balance')) {
      console.error('\n⚠️  Credits exhausted. Please add credits at:')
      console.error('https://console.anthropic.com/settings/plans')
      console.error('\nEstimated cost for Phase 2 completion: $9-15')
    }
    process.exit(1)
  }
}

testCredits()
