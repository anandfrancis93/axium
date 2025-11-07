#!/usr/bin/env node

/**
 * Simple Upload - No deletion, just upload hierarchical topics
 * Usage: node scripts/simple-upload-syllabus.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const CHAPTER_ID = '0517450a-61b2-4fa2-a425-5846b21ba4b0'
const SYLLABUS_FILE = 'security-plus-syllabus.md'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function parseHierarchicalText(text) {
  const lines = text.split('\n').filter(line => line.trim())
  const tree = []
  const stack = [{ children: tree, level: -1 }]

  for (const line of lines) {
    // Count # symbols for markdown headers
    const headerMatch = line.match(/^(#+)\s+(.+)$/)
    if (!headerMatch) continue

    const [, hashes, content] = headerMatch
    const level = hashes.length - 1 // # = 0, ## = 1, ### = 2, etc.
    const name = content.trim()

    const node = { name, children: [], level }

    // Pop stack to find parent at correct level
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    stack[stack.length - 1].children.push(node)
    stack.push(node)
  }

  return tree
}

async function insertTopicsRecursive(items, chapterId, parentTopicId = null, sequenceOrder = 1) {
  let count = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    // Check if topic already exists
    let query = supabase
      .from('topics')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('name', item.name)

    if (parentTopicId) {
      query = query.eq('parent_topic_id', parentTopicId)
    } else {
      query = query.is('parent_topic_id', null)
    }

    const { data: existing } = await query.single()

    let topic
    if (existing) {
      // Topic already exists, use it
      topic = existing
      console.log(`⊙ ${topic.full_name || topic.name} (exists)`)
    } else {
      // Insert new topic
      const { data: newTopic, error } = await supabase
        .from('topics')
        .insert({
          chapter_id: chapterId,
          name: item.name,
          parent_topic_id: parentTopicId,
          sequence_order: sequenceOrder + i
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error inserting topic "${item.name}":`, error.message)
        continue
      }

      topic = newTopic
      count++
      console.log(`✓ ${topic.full_name || topic.name}`)
    }

    // Process children
    if (item.children.length > 0) {
      const childCount = await insertTopicsRecursive(item.children, chapterId, topic.id, 1)
      count += childCount
    }
  }

  return count
}

async function main() {
  console.log('📚 Simple Syllabus Upload')
  console.log('='.repeat(60))

  // Read syllabus file
  console.log(`\n📖 Reading: ${SYLLABUS_FILE}`)
  const content = readFileSync(SYLLABUS_FILE, 'utf-8')

  // Parse hierarchy
  console.log('🔍 Parsing hierarchy...')
  const tree = parseHierarchicalText(content)

  // Count topics
  function countNodes(nodes) {
    let count = 0
    for (const node of nodes) {
      count++
      count += countNodes(node.children)
    }
    return count
  }
  const totalTopics = countNodes(tree)

  console.log(`📊 Found ${totalTopics} topics to upload`)
  console.log('\n🚀 Uploading...\n')

  // Upload
  const inserted = await insertTopicsRecursive(tree, CHAPTER_ID)

  console.log('\n' + '='.repeat(60))
  console.log(`✅ SUCCESS! Uploaded ${inserted} topics`)
  console.log('\n📋 Next steps:')
  console.log('   1. Upload PDFs at /admin')
  console.log('   2. Generate questions at /admin')
  console.log('   3. Start learning!')
}

main().catch(console.error)
