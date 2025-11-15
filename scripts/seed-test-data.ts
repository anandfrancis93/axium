/**
 * Seed Test Data
 *
 * Creates a simple test subject/chapter/topic for immediate testing
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedTestData() {
  console.log('🌱 Seeding test data...\n')

  // 1. Create Subject
  console.log('Creating subject: CompTIA Security+')
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .upsert({
      name: 'CompTIA Security+',
      slug: 'comptia-security-plus',
      description: 'Test subject for quiz functionality'
    }, {
      onConflict: 'slug'
    })
    .select()
    .single()

  if (subjectError) {
    console.error('Error creating subject:', subjectError)
    return
  }

  console.log('✓ Subject created:', subject.id)

  // 2. Create Chapter
  console.log('\nCreating chapter: General Security Concepts')
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .upsert({
      subject_id: subject.id,
      name: 'General Security Concepts',
      slug: 'general-security-concepts',
      chapter_order: 1
    }, {
      onConflict: 'subject_id,slug'
    })
    .select()
    .single()

  if (chapterError) {
    console.error('Error creating chapter:', chapterError)
    return
  }

  console.log('✓ Chapter created:', chapter.id)

  // 3. Create Topics
  const topics = [
    { name: 'CIA Triad', order: 1 },
    { name: 'Authentication Methods', order: 2 },
    { name: 'Encryption Fundamentals', order: 3 },
    { name: 'Network Security', order: 4 },
    { name: 'Threat Actors', order: 5 }
  ]

  console.log('\nCreating topics...')
  for (const topic of topics) {
    const { data, error } = await supabase
      .from('topics')
      .upsert({
        chapter_id: chapter.id,
        name: topic.name,
        slug: topic.name.toLowerCase().replace(/\s+/g, '-'),
        topic_order: topic.order
      }, {
        onConflict: 'chapter_id,slug'
      })
      .select()
      .single()

    if (error) {
      console.error(`Error creating topic ${topic.name}:`, error)
    } else {
      console.log(`✓ Topic created: ${topic.name} (${data.id})`)
    }
  }

  console.log('\n✅ Test data seeded successfully!')
  console.log('\nYou can now:')
  console.log('1. Go to https://axium-mauve.vercel.app/learn/select')
  console.log('2. Select: CompTIA Security+ → General Security Concepts → Any Topic')
  console.log('3. Choose a Bloom Level (1-6)')
  console.log('4. Start Quiz!')
  console.log('\nQuestions will be generated on-the-fly using GraphRAG + xAI Grok')
}

seedTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
