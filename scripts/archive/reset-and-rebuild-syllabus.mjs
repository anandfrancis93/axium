#!/usr/bin/env node

/**
 * Reset and Rebuild Syllabus (All-in-One)
 *
 * Complete clean slate: deletes everything and uploads new hierarchical syllabus
 *
 * Steps:
 * 1. Delete all knowledge chunks (RAG embeddings)
 * 2. Delete all topics and associated data (progress, questions, etc.)
 * 3. Upload new hierarchical syllabus from file
 *
 * Usage:
 * node scripts/reset-and-rebuild-syllabus.mjs <chapter_id> <syllabus_file.txt>
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Prompt for confirmation
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

// Parse hierarchical text into tree structure
function parseHierarchicalText(text) {
  const lines = text.split('\n').filter(line => line.trim())
  const tree = []
  const stack = [{ children: tree, level: -1 }]

  for (const line of lines) {
    const match = line.match(/^(\s*)(.+)$/)
    if (!match) continue

    const [, indent, content] = match
    const level = indent.length / 2

    const cleaned = content
      .replace(/^[-•o*]\s*/, '')
      .replace(/^#+\s*/, '')
      .trim()

    if (!cleaned) continue

    const node = {
      name: cleaned,
      children: [],
      level
    }

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    stack[stack.length - 1].children.push(node)
    stack.push(node)
  }

  return tree
}

// Convert tree to flat list with parent references
function flattenTree(tree, parentId = null, result = []) {
  for (const node of tree) {
    const item = {
      name: node.name,
      parent_id: parentId,
      children: []
    }
    result.push(item)

    if (node.children && node.children.length > 0) {
      flattenTree(node.children, item, item.children)
    }
  }
  return result
}

// Insert topics recursively
async function insertTopicsRecursive(items, chapterId, parentTopicId = null, sequenceOrder = 1) {
  const insertedIds = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    const { data: topic, error } = await supabase
      .from('topics')
      .insert({
        chapter_id: chapterId,
        name: item.name,
        parent_topic_id: parentTopicId,
        sequence_order: sequenceOrder + i,
        description: `Hierarchical topic: ${item.name}`
      })
      .select()
      .single()

    if (error) {
      console.error(`Error inserting topic "${item.name}":`, error)
      continue
    }

    console.log(`  ✓ ${topic.full_name || topic.name}`)
    insertedIds.push(topic.id)

    if (item.children && item.children.length > 0) {
      await insertTopicsRecursive(item.children, chapterId, topic.id, 1)
    }
  }

  return insertedIds
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: node reset-and-rebuild-syllabus.mjs <chapter_id> <syllabus_file.txt>')
    console.error('\n⚠️  WARNING: This will DELETE EVERYTHING and rebuild from scratch!')
    console.error('\nExample syllabus format:')
    console.error('Zero Trust')
    console.error('  Control Plane')
    console.error('    Adaptive identity')
    console.error('  Data Plane')
    console.error('    Implicit trust zones')
    process.exit(1)
  }

  const [chapterId, syllabusFile] = args

  // ============================================
  // STEP 0: Validate inputs
  // ============================================

  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, name, subject_id, subjects(name)')
    .eq('id', chapterId)
    .single()

  if (chapterError || !chapter) {
    console.error('Error: Chapter not found')
    process.exit(1)
  }

  const syllabusPath = path.resolve(syllabusFile)
  if (!fs.existsSync(syllabusPath)) {
    console.error(`Error: File not found: ${syllabusPath}`)
    process.exit(1)
  }

  const syllabusText = fs.readFileSync(syllabusPath, 'utf-8')
  const tree = parseHierarchicalText(syllabusText)
  const flatList = flattenTree(tree)

  console.log('\n' + '='.repeat(60))
  console.log('⚠️  COMPLETE RESET AND REBUILD')
  console.log('='.repeat(60))
  console.log(`📖 Subject: ${chapter.subjects.name}`)
  console.log(`📚 Chapter: ${chapter.name}`)
  console.log(`🆔 Chapter ID: ${chapter.id}`)
  console.log(`📄 Syllabus: ${syllabusFile}`)
  console.log(`📝 New topics: ${flatList.length}`)
  console.log('='.repeat(60))

  // Count existing data
  const { count: chunkCount } = await supabase
    .from('knowledge_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)

  const { count: topicCount } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)

  console.log('\n📊 Current data (will be DELETED):')
  console.log(`   • Knowledge chunks (RAG): ${chunkCount}`)
  console.log(`   • Topics: ${topicCount}`)

  if (topicCount > 0) {
    const { data: topics } = await supabase
      .from('topics')
      .select('id')
      .eq('chapter_id', chapterId)

    const topicIds = topics?.map(t => t.id) || []

    const { count: progressCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .in('topic_id', topicIds)

    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .in('topic_id', topicIds)

    console.log(`   • User progress: ${progressCount}`)
    console.log(`   • Questions: ${questionCount}`)
  }

  console.log('\n⚠️  This will:')
  console.log('   1. Delete all knowledge chunks (RAG embeddings)')
  console.log('   2. Delete all topics')
  console.log('   3. Delete all user progress and questions')
  console.log('   4. Upload new hierarchical syllabus')
  console.log('\n❌ THIS CANNOT BE UNDONE!')

  const confirmed = await askConfirmation('\n⚠️  Type "yes" to continue: ')

  if (!confirmed) {
    console.log('\n✅ Cancelled. No changes made.')
    process.exit(0)
  }

  // ============================================
  // STEP 1: Delete knowledge chunks
  // ============================================

  console.log('\n' + '='.repeat(60))
  console.log('STEP 1/3: Deleting knowledge chunks...')
  console.log('='.repeat(60))

  const { error: chunksError } = await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('chapter_id', chapterId)

  if (chunksError) {
    console.error('Error deleting chunks:', chunksError)
  } else {
    console.log(`✅ Deleted ${chunkCount} knowledge chunks`)
  }

  // ============================================
  // STEP 2: Delete topics and all associated data
  // ============================================

  console.log('\n' + '='.repeat(60))
  console.log('STEP 2/3: Deleting topics and associated data...')
  console.log('='.repeat(60))

  if (topicCount > 0) {
    const { data: topics } = await supabase
      .from('topics')
      .select('id')
      .eq('chapter_id', chapterId)

    const topicIds = topics?.map(t => t.id) || []

    // Delete in correct order (respect foreign keys)
    console.log('  • Deleting questions...')
    await supabase.from('questions').delete().in('topic_id', topicIds)

    console.log('  • Deleting arm stats...')
    await supabase.from('arm_stats').delete().eq('chapter_id', chapterId)

    console.log('  • Deleting dimension coverage...')
    await supabase.from('user_dimension_coverage').delete().eq('chapter_id', chapterId)

    console.log('  • Deleting user mastery...')
    await supabase.from('user_topic_mastery').delete().in('topic_id', topicIds)

    console.log('  • Deleting user progress...')
    await supabase.from('user_progress').delete().in('topic_id', topicIds)

    console.log('  • Deleting topics...')
    const { error: topicsError } = await supabase
      .from('topics')
      .delete()
      .eq('chapter_id', chapterId)

    if (topicsError) {
      console.error('Error deleting topics:', topicsError)
      process.exit(1)
    }

    console.log(`✅ Deleted ${topicCount} topics and all associated data`)
  } else {
    console.log('✅ No topics to delete')
  }

  // ============================================
  // STEP 3: Upload new hierarchical syllabus
  // ============================================

  console.log('\n' + '='.repeat(60))
  console.log('STEP 3/3: Uploading new hierarchical syllabus...')
  console.log('='.repeat(60))
  console.log()

  const insertedIds = await insertTopicsRecursive(flatList, chapterId)

  console.log('\n' + '='.repeat(60))
  console.log('✅ SUCCESS!')
  console.log('='.repeat(60))
  console.log(`📝 Inserted ${insertedIds.length} topics with hierarchy`)
  console.log('\n📋 Next steps:')
  console.log('   1. Upload PDFs at /admin to populate RAG knowledge base')
  console.log('   2. Generate questions at /admin')
  console.log('   3. Start learning at /subjects/[subject]/[chapter]/quiz')
  console.log('\n✨ Your hierarchical syllabus is ready!')
}

main().catch(console.error)
