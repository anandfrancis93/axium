#!/usr/bin/env node

/**
 * Migrate Text Topics to Database IDs
 *
 * This script migrates existing text-based topics to use topic_id foreign keys.
 *
 * Steps:
 * 1. Apply SQL migration to add topic_id columns
 * 2. Run migration function to populate topic_id from text topics
 * 3. Verify migration success
 * 4. Optionally drop old TEXT columns
 *
 * Usage:
 * node scripts/migrate-topics-to-ids.mjs [--dry-run] [--drop-text-columns]
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

async function checkMigrationStatus() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION STATUS CHECK')
  console.log('='.repeat(60))

  // Check if topic_id columns exist
  const tables = ['user_topic_mastery', 'arm_stats', 'questions', 'user_dimension_coverage']

  for (const table of tables) {
    const { data, error } = await supabase.rpc('check_column_exists', {
      p_table_name: table,
      p_column_name: 'topic_id'
    }).single()

    if (error) {
      console.log(`❓ ${table}: Unable to check (might need to apply SQL migration first)`)
    } else {
      console.log(`${data ? '✅' : '❌'} ${table}: topic_id column ${data ? 'exists' : 'missing'}`)
    }
  }

  // Count rows with NULL topic_id
  console.log('\n📊 Rows needing migration:')

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .is('topic_id', null)

    if (!error) {
      console.log(`   ${table}: ${count || 0} rows`)
    }
  }

  // Count existing topics
  const { count: topicCount } = await supabase
    .from('topics')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📚 Current topics in database: ${topicCount || 0}`)
}

async function runMigration(dryRun = false) {
  console.log('\n' + '='.repeat(60))
  console.log(dryRun ? '🔍 DRY RUN: Migration Preview' : '🚀 RUNNING MIGRATION')
  console.log('='.repeat(60))

  if (dryRun) {
    // Preview: Get unique text topics that will be migrated
    const tables = ['user_topic_mastery', 'arm_stats', 'questions', 'user_dimension_coverage']
    const uniqueTopics = new Set()

    for (const table of tables) {
      const { data } = await supabase
        .from(table)
        .select('topic, chapter_id')
        .not('topic', 'is', null)

      if (data) {
        data.forEach(row => {
          if (row.topic && row.chapter_id) {
            uniqueTopics.add(`${row.topic} (${row.chapter_id})`)
          }
        })
      }
    }

    console.log(`\n📝 Found ${uniqueTopics.size} unique text topics:`)
    Array.from(uniqueTopics).slice(0, 20).forEach(topic => {
      console.log(`   • ${topic}`)
    })

    if (uniqueTopics.size > 20) {
      console.log(`   ... and ${uniqueTopics.size - 20} more`)
    }

    console.log('\n💡 Run without --dry-run to execute migration')
    return
  }

  // Run actual migration
  console.log('\n🔄 Running migration function...\n')

  const { data: results, error } = await supabase
    .rpc('migrate_text_topics_to_ids')

  if (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }

  console.log('✅ Migration completed:\n')
  results.forEach(result => {
    console.log(`   ${result.table_name}:`)
    console.log(`      • Rows migrated: ${result.rows_migrated}`)
    console.log(`      • Topics created: ${result.topics_created}`)
  })

  // Verify migration
  console.log('\n🔍 Verifying migration...\n')

  const tables = ['user_topic_mastery', 'arm_stats', 'questions', 'user_dimension_coverage']
  let allMigrated = true

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .is('topic_id', null)
      .not('topic', 'is', null)  // Has text but no ID

    if (count > 0) {
      console.log(`   ⚠️  ${table}: ${count} rows still have NULL topic_id`)
      allMigrated = false
    } else {
      console.log(`   ✅ ${table}: All rows migrated`)
    }
  }

  if (allMigrated) {
    console.log('\n✅ All data successfully migrated!')
  } else {
    console.log('\n⚠️  Some rows were not migrated. Check logs above.')
  }
}

async function dropTextColumns() {
  console.log('\n' + '='.repeat(60))
  console.log('⚠️  DROP TEXT COLUMNS')
  console.log('='.repeat(60))

  console.log('\nThis will permanently remove the old "topic" TEXT columns.')
  console.log('Make sure:')
  console.log('  1. Migration is complete (all topic_id populated)')
  console.log('  2. Application code is updated to use topic_id')
  console.log('  3. You have a database backup')

  const confirmed = await askConfirmation('\n⚠️  Type "yes" to drop TEXT columns: ')

  if (!confirmed) {
    console.log('\n✅ Cancelled. TEXT columns preserved.')
    return
  }

  const tables = ['user_topic_mastery', 'arm_stats', 'questions', 'user_dimension_coverage']

  console.log('\n🗑️  Dropping TEXT columns...\n')

  for (const table of tables) {
    const { error } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE ${table} DROP COLUMN IF EXISTS topic`
    })

    if (error) {
      console.error(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: topic column dropped`)
    }
  }

  console.log('\n🔒 Making topic_id NOT NULL...\n')

  for (const table of tables) {
    if (table === 'questions') continue // questions.topic_id can be NULL

    const { error } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE ${table} ALTER COLUMN topic_id SET NOT NULL`
    })

    if (error) {
      console.error(`   ❌ ${table}: ${error.message}`)
    } else {
      console.log(`   ✅ ${table}: topic_id is now NOT NULL`)
    }
  }

  console.log('\n✅ TEXT columns dropped. Migration complete!')
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const dropColumns = args.includes('--drop-text-columns')

  console.log('🔄 Topic Migration Tool')

  // Step 1: Check current status
  await checkMigrationStatus()

  // Step 2: Run migration (or dry run)
  if (!dropColumns) {
    const shouldMigrate = dryRun || await askConfirmation('\n🚀 Run migration? (yes/no): ')

    if (shouldMigrate) {
      await runMigration(dryRun)
    } else {
      console.log('\n✅ Cancelled.')
      process.exit(0)
    }
  }

  // Step 3: Optionally drop TEXT columns
  if (dropColumns && !dryRun) {
    await dropTextColumns()
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 Next Steps:')
  console.log('='.repeat(60))

  if (dryRun) {
    console.log('1. Run without --dry-run to execute migration')
  } else if (!dropColumns) {
    console.log('1. Update application code to use topic_id')
    console.log('2. Test thoroughly in development')
    console.log('3. Deploy updated code')
    console.log('4. Run with --drop-text-columns to finalize')
  } else {
    console.log('✅ Migration fully complete!')
    console.log('   • All tables use topic_id foreign keys')
    console.log('   • TEXT columns removed')
    console.log('   • Database is normalized')
  }
}

main().catch(console.error)
