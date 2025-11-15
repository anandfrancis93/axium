#!/usr/bin/env node

/**
 * Delete All Topics for a Chapter
 *
 * Safely deletes all topics and associated data for a chapter.
 * Cascades to:
 * - user_progress
 * - user_topic_mastery
 * - user_dimension_coverage
 * - arm_stats
 * - questions
 * - user_responses (via questions)
 * - knowledge_chunks (if topic-specific)
 *
 * Usage:
 * node scripts/delete-chapter-topics.mjs <chapter_id>
 */

import { createClient } from '@supabase/supabase-js'
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

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: node delete-chapter-topics.mjs <chapter_id>')
    console.error('\nThis will DELETE ALL topics and associated data for the chapter.')
    console.error('This action CANNOT be undone!')
    process.exit(1)
  }

  const [chapterId] = args

  // Get chapter info
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, name, subject_id, subjects(name)')
    .eq('id', chapterId)
    .single()

  if (chapterError || !chapter) {
    console.error('Error: Chapter not found')
    process.exit(1)
  }

  console.log('\n⚠️  WARNING: DESTRUCTIVE OPERATION ⚠️')
  console.log('=' .repeat(50))
  console.log(`📖 Subject: ${chapter.subjects.name}`)
  console.log(`📚 Chapter: ${chapter.name}`)
  console.log(`🆔 Chapter ID: ${chapter.id}`)
  console.log('=' .repeat(50))

  // Count topics
  const { count: topicCount } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)

  console.log(`\n📝 Topics to delete: ${topicCount}`)

  // Count associated data
  const { data: topics } = await supabase
    .from('topics')
    .select('id')
    .eq('chapter_id', chapterId)

  const topicIds = topics?.map(t => t.id) || []

  if (topicIds.length > 0) {
    const { count: progressCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .in('topic_id', topicIds)

    const { count: masteryCount } = await supabase
      .from('user_topic_mastery')
      .select('*', { count: 'exact', head: true })
      .in('topic_id', topicIds)

    const { count: dimensionCount } = await supabase
      .from('user_dimension_coverage')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)

    const { count: armCount } = await supabase
      .from('arm_stats')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)

    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .in('topic_id', topicIds)

    console.log('\n📊 Associated data to be deleted:')
    console.log(`   • User progress records: ${progressCount}`)
    console.log(`   • User mastery records: ${masteryCount}`)
    console.log(`   • Dimension coverage records: ${dimensionCount}`)
    console.log(`   • Thompson Sampling arm stats: ${armCount}`)
    console.log(`   • Questions: ${questionCount}`)
  }

  console.log('\n⚠️  This will:')
  console.log('   1. Delete all topics for this chapter')
  console.log('   2. Delete all user progress for these topics')
  console.log('   3. Delete all questions and responses')
  console.log('   4. Delete all RL statistics')
  console.log('   5. Reset all learning progress for this chapter')
  console.log('\n❌ THIS CANNOT BE UNDONE!')

  const confirmed = await askConfirmation('\n⚠️  Type "yes" to confirm deletion: ')

  if (!confirmed) {
    console.log('\n✅ Cancelled. No data was deleted.')
    process.exit(0)
  }

  console.log('\n🗑️  Deleting data...\n')

  // Delete in order (respect foreign keys)

  // 1. Delete user responses (via questions cascade)
  console.log('Deleting questions and user responses...')
  const { error: questionsError } = await supabase
    .from('questions')
    .delete()
    .in('topic_id', topicIds)

  if (questionsError) {
    console.error('Error deleting questions:', questionsError)
  }

  // 2. Delete arm stats
  console.log('Deleting Thompson Sampling arm stats...')
  const { error: armError } = await supabase
    .from('arm_stats')
    .delete()
    .eq('chapter_id', chapterId)

  if (armError) {
    console.error('Error deleting arm stats:', armError)
  }

  // 3. Delete dimension coverage
  console.log('Deleting dimension coverage...')
  const { error: dimensionError } = await supabase
    .from('user_dimension_coverage')
    .delete()
    .eq('chapter_id', chapterId)

  if (dimensionError) {
    console.error('Error deleting dimension coverage:', dimensionError)
  }

  // 4. Delete user topic mastery
  console.log('Deleting user topic mastery...')
  const { error: masteryError } = await supabase
    .from('user_topic_mastery')
    .delete()
    .in('topic_id', topicIds)

  if (masteryError) {
    console.error('Error deleting mastery:', masteryError)
  }

  // 5. Delete user progress
  console.log('Deleting user progress...')
  const { error: progressError } = await supabase
    .from('user_progress')
    .delete()
    .in('topic_id', topicIds)

  if (progressError) {
    console.error('Error deleting progress:', progressError)
  }

  // 6. Finally, delete topics (cascades to children via foreign key)
  console.log('Deleting topics...')
  const { error: topicsError } = await supabase
    .from('topics')
    .delete()
    .eq('chapter_id', chapterId)

  if (topicsError) {
    console.error('Error deleting topics:', topicsError)
    process.exit(1)
  }

  console.log('\n✅ Successfully deleted all topics and associated data!')
  console.log('\nYou can now upload a new hierarchical syllabus:')
  console.log(`   node scripts/upload-hierarchical-syllabus.mjs ${chapterId} your-syllabus.txt`)
}

main().catch(console.error)
