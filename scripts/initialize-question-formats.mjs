import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initializeQuestionFormats() {
  try {
    console.log('📝 Initializing question formats for existing questions...\n')

    // Get all questions - we'll check format in code
    const { data: questions, error: fetchError} = await supabase
      .from('questions')
      .select('id, bloom_level, question_text, options, correct_answer, question_format')

    if (fetchError) {
      console.error('❌ Error fetching questions:', fetchError.message)
      process.exit(1)
    }

    if (!questions || questions.length === 0) {
      console.log('✅ No questions found')
      process.exit(0)
    }

    // Filter questions that need format assignment
    const questionsToUpdate = questions.filter(q =>
      !q.question_format ||
      q.question_format === 'mcq' ||
      !['mcq_single', 'mcq_multi', 'code', 'open_ended', 'diagram', 'fill_blank', 'true_false', 'matching', 'code_trace', 'code_debug'].includes(q.question_format)
    )

    if (questionsToUpdate.length === 0) {
      console.log('✅ All questions already have valid formats assigned')
      process.exit(0)
    }

    console.log(`Found ${questionsToUpdate.length} questions that need format assignment (out of ${questions.length} total)\n`)

    // Intelligent format assignment based on question characteristics
    let updated = 0
    let errors = 0

    for (const question of questionsToUpdate) {
      let assignedFormat = 'mcq_single' // default

      // Analyze question to determine format
      const questionText = question.question_text?.toLowerCase() || ''
      const hasOptions = question.options && Object.keys(question.options).length > 0

      if (!hasOptions) {
        // No options - likely open-ended or fill-blank
        if (questionText.includes('explain') || questionText.includes('describe') || questionText.includes('why')) {
          assignedFormat = 'open_ended'
        } else if (questionText.includes('_____') || questionText.includes('complete')) {
          assignedFormat = 'fill_blank'
        } else {
          assignedFormat = 'open_ended'
        }
      } else if (Object.keys(question.options).length === 2) {
        // Two options - likely true/false
        const optionValues = Object.values(question.options).map(v => v.toLowerCase())
        if (optionValues.includes('true') || optionValues.includes('false')) {
          assignedFormat = 'true_false'
        } else {
          assignedFormat = 'mcq_single'
        }
      } else {
        // Multiple options - check if multi-select or single-select
        const multiSelectIndicators = [
          'select all that apply',
          'which of the following are',
          'all of the following',
          'choose all',
          'multiple correct'
        ]
        const isMultiSelect = multiSelectIndicators.some(indicator =>
          questionText.includes(indicator)
        )

        // Check if correct_answer indicates multiple answers
        let correctAnswerIsMulti = false
        if (question.correct_answer) {
          const correctAnswer = typeof question.correct_answer === 'string'
            ? question.correct_answer
            : JSON.stringify(question.correct_answer)
          correctAnswerIsMulti = correctAnswer.includes(',') || correctAnswer.includes('[')
        }

        if (isMultiSelect || correctAnswerIsMulti) {
          assignedFormat = 'mcq_multi'
        } else if (questionText.includes('code') || questionText.includes('function') || questionText.includes('algorithm')) {
          if (questionText.includes('output') || questionText.includes('result') || questionText.includes('execute')) {
            assignedFormat = 'code_trace'
          } else if (questionText.includes('bug') || questionText.includes('error') || questionText.includes('fix')) {
            assignedFormat = 'code_debug'
          } else if (questionText.includes('write') || questionText.includes('implement')) {
            assignedFormat = 'code'
          } else {
            assignedFormat = 'mcq_single'
          }
        } else if (questionText.includes('diagram') || questionText.includes('graph') || questionText.includes('tree')) {
          assignedFormat = 'diagram'
        } else if (questionText.includes('match')) {
          assignedFormat = 'matching'
        } else {
          assignedFormat = 'mcq_single'
        }
      }

      // Update question with assigned format
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          question_format: assignedFormat,
          format_metadata: {}
        })
        .eq('id', question.id)

      if (updateError) {
        console.error(`❌ Error updating question ${question.id.substring(0, 8)}:`, updateError.message)
        errors++
      } else {
        updated++
        if (updated % 50 === 0) {
          console.log(`✅ Updated ${updated} questions...`)
        }
      }
    }

    console.log(`\n✅ Format initialization complete!`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Errors: ${errors}`)

    // Show format distribution
    console.log('\n📊 Format distribution:')
    const { data: distribution } = await supabase
      .from('questions')
      .select('question_format')

    if (distribution) {
      const formatCounts = {}
      distribution.forEach(q => {
        const format = q.question_format || 'unknown'
        formatCounts[format] = (formatCounts[format] || 0) + 1
      })

      Object.entries(formatCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([format, count]) => {
          console.log(`   ${format}: ${count}`)
        })
    }

  } catch (error) {
    console.error('❌ Initialization failed:', error.message)
    process.exit(1)
  }
}

async function initializeFormatPerformanceTracking() {
  try {
    console.log('\n📊 Initializing format performance tracking in user_progress...\n')

    // Get all user_progress records
    const { data: progressRecords, error: fetchError } = await supabase
      .from('user_progress')
      .select('id, user_id, subject_id, rl_metadata')

    if (fetchError) {
      console.error('❌ Error fetching user_progress:', fetchError.message)
      process.exit(1)
    }

    if (!progressRecords || progressRecords.length === 0) {
      console.log('✅ No user_progress records to update')
      return
    }

    console.log(`Found ${progressRecords.length} user_progress records\n`)

    let updated = 0
    let skipped = 0

    for (const record of progressRecords) {
      const metadata = record.rl_metadata || {}

      // Skip if format_performance already exists
      if (metadata.format_performance) {
        skipped++
        continue
      }

      // Initialize format tracking structure
      const updatedMetadata = {
        ...metadata,
        format_performance: {},
        format_preferences: {
          most_effective: [],
          least_effective: [],
          confidence_by_format: {}
        }
      }

      // Update record
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({ rl_metadata: updatedMetadata })
        .eq('id', record.id)

      if (updateError) {
        console.error(`❌ Error updating record ${record.id.substring(0, 8)}:`, updateError.message)
      } else {
        updated++
        if (updated % 50 === 0) {
          console.log(`✅ Updated ${updated} records...`)
        }
      }
    }

    console.log(`\n✅ Format tracking initialization complete!`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped (already initialized): ${skipped}`)

  } catch (error) {
    console.error('❌ Tracking initialization failed:', error.message)
    process.exit(1)
  }
}

// Run both initializations
async function main() {
  await initializeQuestionFormats()
  await initializeFormatPerformanceTracking()
  console.log('\n🎉 All initializations complete!')
  process.exit(0)
}

main()
