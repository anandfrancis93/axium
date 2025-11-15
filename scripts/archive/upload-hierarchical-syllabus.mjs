#!/usr/bin/env node

/**
 * Upload Hierarchical Syllabus
 *
 * Parses a hierarchical text file and creates topics with proper parent-child relationships.
 *
 * Supported formats:
 * 1. Indentation (spaces or tabs)
 * 2. Bullets (-, •, o, *)
 * 3. Markdown headers (#, ##, ###)
 *
 * Example:
 * ```
 * Zero Trust
 *   Control Plane
 *     Adaptive identity
 *     Threat scope reduction
 *   Data Plane
 *     Implicit trust zones
 * ```
 *
 * Usage:
 * node scripts/upload-hierarchical-syllabus.mjs <chapter_id> <syllabus_file.txt>
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Parse hierarchical text into tree structure
function parseHierarchicalText(text) {
  const lines = text.split('\n').filter(line => line.trim())
  const tree = []
  const stack = [{ children: tree, level: -1 }]

  for (const line of lines) {
    // Detect indentation level
    const match = line.match(/^(\s*)(.+)$/)
    if (!match) continue

    const [, indent, content] = match
    const level = indent.length / 2 // Assuming 2 spaces per level

    // Clean up content (remove bullets, trim)
    const cleaned = content
      .replace(/^[-•o*]\s*/, '') // Remove bullet points
      .replace(/^#+\s*/, '')      // Remove markdown headers
      .trim()

    if (!cleaned) continue

    const node = {
      name: cleaned,
      children: [],
      level
    }

    // Pop stack until we find the parent
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    // Add to parent
    stack[stack.length - 1].children.push(node)

    // Push to stack
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

    // Insert topic
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

    console.log(`✓ Inserted: ${topic.full_name || topic.name}`)
    insertedIds.push(topic.id)

    // Insert children recursively
    if (item.children && item.children.length > 0) {
      await insertTopicsRecursive(item.children, chapterId, topic.id, 1)
    }
  }

  return insertedIds
}

// Main function
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: node upload-hierarchical-syllabus.mjs <chapter_id> <syllabus_file.txt>')
    console.error('\nExample syllabus format:')
    console.error('Zero Trust')
    console.error('  Control Plane')
    console.error('    Adaptive identity')
    console.error('    Threat scope reduction')
    console.error('  Data Plane')
    console.error('    Implicit trust zones')
    process.exit(1)
  }

  const [chapterId, syllabusFile] = args

  // Check if chapter exists
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, name, subject_id, subjects(name)')
    .eq('id', chapterId)
    .single()

  if (chapterError || !chapter) {
    console.error('Error: Chapter not found')
    process.exit(1)
  }

  console.log(`\n📚 Chapter: ${chapter.name}`)
  console.log(`📖 Subject: ${chapter.subjects.name}`)
  console.log(`📄 Reading syllabus from: ${syllabusFile}\n`)

  // Read syllabus file
  const syllabusPath = path.resolve(syllabusFile)
  if (!fs.existsSync(syllabusPath)) {
    console.error(`Error: File not found: ${syllabusPath}`)
    process.exit(1)
  }

  const text = fs.readFileSync(syllabusPath, 'utf-8')

  // Parse hierarchical structure
  console.log('🔍 Parsing hierarchical structure...\n')
  const tree = parseHierarchicalText(text)
  const flatList = flattenTree(tree)

  console.log(`Found ${flatList.length} topics\n`)

  // Insert topics
  console.log('💾 Inserting topics...\n')
  const insertedIds = await insertTopicsRecursive(flatList, chapterId)

  console.log(`\n✅ Successfully inserted ${insertedIds.length} topics!`)
  console.log('\nYou can now:')
  console.log('1. Upload PDFs covering these topics')
  console.log('2. Generate questions using the hierarchical context')
  console.log('3. View the hierarchy in the admin panel')
}

main().catch(console.error)
