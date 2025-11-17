/**
 * Generate Topic Descriptions using AI
 *
 * Uses hierarchical context (parent path) to generate accurate descriptions
 * for topics that currently have empty descriptions.
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
})

async function generateDescription(topicName, parentName, hierarchyLevel, subjectName) {
  const contextByLevel = {
    3: `This is a Topic (### level heading) under the learning objective "${parentName}" in ${subjectName}.`,
    4: `This is a Subtopic (#### level heading) under the topic "${parentName}" in ${subjectName}.`,
    5: `This is a Sub-subtopic (##### level heading) under "${parentName}" in ${subjectName}.`
  }

  const context = contextByLevel[hierarchyLevel] || `This is a topic under "${parentName}" in ${subjectName}.`

  const prompt = `You are a cybersecurity curriculum expert. Generate a concise, accurate description (1-2 sentences, max 150 characters) for the following topic.

**Topic Name:** ${topicName}
**Hierarchical Context:** ${context}
**Subject:** ${subjectName}

**Instructions:**
- Use the hierarchical context to understand what this topic means
- Write a clear, specific description (not generic)
- Focus on cybersecurity/security concepts
- Keep it under 150 characters
- Do NOT start with "This topic covers..." or "This section..."
- Just describe what it IS

**Example:**
Topic: "Accounting" under "Summarize fundamental security concepts"
Description: "Logging and tracking user activities, audit trails, and security events. Part of AAA framework."

Topic: "Age" under "Password best practices"
Description: "Password age policies including minimum/maximum age, expiration, and rotation requirements."

Now generate the description for: "${topicName}"`

  try {
    const completion = await xai.chat.completions.create({
      model: 'grok-2-1212',
      messages: [
        {
          role: 'system',
          content: 'You are a cybersecurity curriculum expert. Generate concise, accurate topic descriptions. Return ONLY the description text, no extra formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const description = completion.choices[0]?.message?.content?.trim()
    if (!description) {
      throw new Error('Empty response from AI')
    }

    // Remove quotes if AI added them
    return description.replace(/^["']|["']$/g, '').substring(0, 250)
  } catch (error) {
    console.error(`Error generating description for "${topicName}":`, error.message)
    return null
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('Generate Topic Descriptions')
  console.log('='.repeat(60))

  // Get limit from command line argument (default: 20 for testing)
  const limit = parseInt(process.argv[2]) || 20
  const testMode = !process.argv[2] || limit < 100

  if (testMode) {
    console.log(`\n⚠️  TEST MODE: Processing only ${limit} topics`)
    console.log(`To process all topics, run: node scripts/generate-topic-descriptions.mjs 999999\n`)
  }

  // Fetch topics without descriptions (only level 3+: topics, subtopics, sub-subtopics)
  // Level 1 = Domain (#), Level 2 = Objective (##) - these don't need descriptions
  let query = supabase
    .from('topics')
    .select(`
      id,
      name,
      hierarchy_level,
      parent_topic_id,
      chapters (
        name,
        subjects (
          name
        )
      )
    `)
    .or('description.is.null,description.eq.')
    .gte('hierarchy_level', 3)  // Only process level 3+ (###, ####, #####)
    .order('hierarchy_level')

  if (limit) {
    query = query.limit(limit)
  }

  const { data: topics, error } = await query

  if (error) {
    console.error('Error fetching topics:', error)
    process.exit(1)
  }

  console.log(`\nFound ${topics.length} topics without descriptions${testMode ? ' (limited for testing)' : ''}\n`)

  // Fetch parent names in bulk
  const parentIds = [...new Set(topics.filter(t => t.parent_topic_id).map(t => t.parent_topic_id))]
  const { data: parents } = await supabase
    .from('topics')
    .select('id, name')
    .in('id', parentIds)

  const parentMap = new Map(parents?.map(p => [p.id, p.name]) || [])

  let processedCount = 0
  let errorCount = 0
  const batchSize = 5 // Process in batches to avoid rate limits

  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize)

    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(topics.length / batchSize)}...`)

    for (const topic of batch) {
      const parentName = topic.parent_topic_id
        ? parentMap.get(topic.parent_topic_id)
        : topic.chapters?.name || 'Unknown'
      const subjectName = topic.chapters?.subjects?.name || 'Unknown'

      console.log(`  [${topic.hierarchy_level}] ${topic.name}`)
      console.log(`      Parent: ${parentName}`)

      const description = await generateDescription(
        topic.name,
        parentName,
        topic.hierarchy_level,
        subjectName
      )

      if (description) {
        const { error: updateError } = await supabase
          .from('topics')
          .update({ description })
          .eq('id', topic.id)

        if (updateError) {
          console.error(`      ❌ Failed to update: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`      ✅ "${description.substring(0, 80)}${description.length > 80 ? '...' : ''}"`)
          processedCount++
        }
      } else {
        console.log(`      ⚠️  Skipped (generation failed)`)
        errorCount++
      }

      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Summary:')
  console.log('='.repeat(60))
  console.log(`Total topics: ${topics.length}`)
  console.log(`Successfully processed: ${processedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log('\n✅ Done!')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
