import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateLearningGain, calculateMultiTopicMasteryUpdates, getDaysSinceLastPractice } from '@/lib/rl/mastery'
import { calculateReward, RecognitionMethod, calculateReadingTimeBreakdown } from '@/lib/rl/rewards'
import { findRelatedTopics } from '@/lib/rl/related-topics'
import { logRewardCalculation, logMasteryUpdate } from '@/lib/rl/decision-logger'

/**
 * POST /api/rl/submit-response
 *
 * Submit answer and update RL system
 *
 * Body:
 * - session_id: UUID of the learning session
 * - question_id: UUID of the question
 * - user_answer: User's selected answer (A, B, C, or D)
 * - confidence: Confidence level (1-5 or 'low'/'medium'/'high')
 * - recognition_method: How user arrived at answer ('memory', 'recognition', 'educated_guess', 'random')
 * - arm_selected: { topic_id, topic_name, bloom_level } from next-question response
 *
 * Returns:
 * - is_correct: boolean
 * - correct_answer: The correct answer
 * - explanation: Explanation text
 * - reward_components: Breakdown of reward
 * - mastery_updates: Changes in mastery
 * - session_progress: Updated progress
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      session_id,
      question_id,
      user_answer,
      confidence: rawConfidence,
      recognition_method,
      arm_selected,
      question_metadata, // For ephemeral questions
      response_time_seconds, // Time taken to answer (from frontend)
      time_taken_seconds // Alternative name (legacy support)
    } = body

    // Use whichever is provided
    const responseTime = response_time_seconds ?? time_taken_seconds

    // Validate all required inputs
    if (!session_id || !question_id || !user_answer) {
      return NextResponse.json(
        { error: 'session_id, question_id, and user_answer are required' },
        { status: 400 }
      )
    }

    // Validate confidence level is provided
    if (rawConfidence === null || rawConfidence === undefined) {
      return NextResponse.json(
        { error: 'confidence level is required - please select your confidence before submitting' },
        { status: 400 }
      )
    }

    // Validate recognition method is provided
    if (!recognition_method) {
      return NextResponse.json(
        { error: 'recognition_method is required - please select how you arrived at your answer' },
        { status: 400 }
      )
    }

    // Convert confidence to numeric (1-5)
    let confidence: number
    if (typeof rawConfidence === 'string') {
      const confidenceMap: { [key: string]: number } = {
        low: 2,
        medium: 3,
        high: 4
      }
      confidence = confidenceMap[rawConfidence.toLowerCase()] || 3
    } else {
      confidence = rawConfidence
    }

    // Try to get question from database first (for stored questions)
    let question: any = null
    const { data: dbQuestion } = await supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single()

    if (dbQuestion) {
      // Question exists in database (stored question)
      question = dbQuestion
    } else if (question_metadata && question_metadata.correct_answer) {
      // Fallback to question_metadata (for ephemeral questions)
      question = {
        id: question_metadata.question_id,
        correct_answer: question_metadata.correct_answer,
        explanation: question_metadata.explanation,
        bloom_level: question_metadata.bloom_level,
        topic: question_metadata.topic,
        primary_topic: question_metadata.topic,
        secondary_topics: null,
        topic_weights: null
      }
    } else {
      return NextResponse.json(
        { error: 'Question not found in database and no question_metadata provided' },
        { status: 404 }
      )
    }

    // Check if correct
    const isCorrect = user_answer === question.correct_answer

    // Get session
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Multi-topic support: Check for core_topics array (new schema)
    // Fall back to topic_id for single-topic questions (backward compatibility)
    const coreTopics = question.core_topics && question.core_topics.length > 0
      ? question.core_topics
      : [question.topic_id || arm_selected?.topic_id]

    const relatedTopics = question.related_topics || []

    // Validate at least one core topic exists
    if (!coreTopics || coreTopics.length === 0 || !coreTopics[0]) {
      return NextResponse.json(
        { error: 'Question must have at least one core topic' },
        { status: 400 }
      )
    }

    // Process each core topic independently
    const masteryUpdates = []
    const rewardsByTopic = []
    let totalReward = 0

    for (const topicId of coreTopics) {
      // Get current mastery for this topic
      const { data: masteryData } = await supabase
        .from('user_topic_mastery')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', session.chapter_id)
        .eq('topic_id', topicId)
        .eq('bloom_level', question.bloom_level)
        .single()

      const currentMastery = masteryData?.mastery_score || 0
      const currentStreak = masteryData?.current_streak || 0

      // Get days since last practice for reward calculation
      const daysSince = getDaysSinceLastPractice(masteryData?.last_practiced_at || null)

      // Calculate new streak value
      const newStreak = isCorrect ? currentStreak + 1 : 0

      // First calculate reward components that don't depend on mastery change
      const preliminaryReward = calculateReward({
        learningGain: 0, // Temporarily 0 - will recalculate after mastery change
        isCorrect,
        confidence,
        currentMastery,
        daysSinceLastPractice: daysSince,
        recognitionMethod: recognition_method as RecognitionMethod,
        responseTimeSeconds: responseTime,
        bloomLevel: question.bloom_level,
        questionText: question.question_text,
        options: question.options,
        questionFormat: question.question_format,
        currentStreak: currentStreak
      })

      // Calculate mastery change using quality-weighted approach
      const learningGain = calculateLearningGain(
        preliminaryReward.calibration,
        preliminaryReward.recognition,
        question.bloom_level
      )
      const newMastery = Math.max(0, Math.min(100, currentMastery + learningGain))

      // Now recalculate with actual learning gain
      const rewardComponents = calculateReward({
        learningGain: learningGain, // Actual mastery change!
        isCorrect,
        confidence,
        currentMastery,
        daysSinceLastPractice: daysSince,
        recognitionMethod: recognition_method as RecognitionMethod,
        responseTimeSeconds: responseTime,
        bloomLevel: question.bloom_level,
        questionText: question.question_text,
        options: question.options,
        questionFormat: question.question_format,
        currentStreak: currentStreak
      })

      // Update mastery for this topic
      const { error: masteryError } = await supabase.rpc('update_topic_mastery_by_id', {
        p_user_id: user.id,
        p_topic_id: topicId,
        p_bloom_level: question.bloom_level,
        p_chapter_id: session.chapter_id,
        p_is_correct: isCorrect,
        p_confidence: confidence,
        p_learning_gain: learningGain,
        p_weight: 1.0,
        p_new_streak: newStreak
      })

      if (masteryError) {
        console.error('Error updating mastery for topic:', topicId, masteryError)
      } else {
        console.log('Successfully updated mastery for topic:', topicId, 'bloom:', question.bloom_level)
      }

      // Check if user just unlocked next Bloom level for this topic
      let unlockedLevel: number | null = null
      if (question.bloom_level < 6) {
        // Get updated mastery data for current level
        const { data: updatedMastery } = await supabase
          .from('user_topic_mastery')
          .select('mastery_score')
          .eq('user_id', user.id)
          .eq('topic_id', topicId)
          .eq('bloom_level', question.bloom_level)
          .single()

        // Check if this level now meets unlock requirement (80% mastery)
        if (updatedMastery && updatedMastery.mastery_score >= 80.0) {

          // Check if next level was previously locked
          const { data: nextLevelMastery } = await supabase
            .from('user_topic_mastery')
            .select('questions_attempted')
            .eq('user_id', user.id)
            .eq('topic_id', topicId)
            .eq('bloom_level', question.bloom_level + 1)
            .single()

          // If next level doesn't exist yet or has 0 attempts, it's newly unlocked
          if (!nextLevelMastery || nextLevelMastery.questions_attempted === 0) {
            unlockedLevel = question.bloom_level + 1
            console.log(`🎉 Unlocked Bloom Level ${unlockedLevel} for topic ${topicId}`)
          }
        }
      }

      // Update RL arm stats for this topic
      const { error: armStatsError } = await supabase.rpc('update_arm_stats_by_id', {
        p_user_id: user.id,
        p_chapter_id: session.chapter_id,
        p_topic_id: topicId,
        p_bloom_level: question.bloom_level,
        p_reward: rewardComponents.total
      })

      if (armStatsError) {
        console.error('Error updating arm stats for topic:', topicId, armStatsError)
      } else {
        console.log('Successfully updated arm stats for topic:', topicId, 'bloom:', question.bloom_level)
      }

      // Get topic details for display
      const { data: topicData } = await supabase
        .from('topics')
        .select('name, full_name, depth')
        .eq('id', topicId)
        .single()

      const topicName = topicData?.name || 'Unknown'
      const topicFullName = topicData?.full_name || topicName
      const topicDepth = topicData?.depth || 0

      // Store mastery update
      masteryUpdates.push({
        topic_id: topicId,
        topic_name: topicName,
        topic_full_name: topicFullName,
        topic_depth: topicDepth,
        bloom_level: question.bloom_level,
        old_mastery: Math.round(currentMastery * 10) / 10,
        new_mastery: Math.round(newMastery * 10) / 10,
        change: Math.round(learningGain * 10) / 10,
        unlocked_level: unlockedLevel  // Will be null or the newly unlocked Bloom level
      })

      // Store reward breakdown for this topic
      rewardsByTopic.push({
        topic_id: topicId,
        topic_name: topicName,
        reward_components: rewardComponents,
        current_streak: currentStreak,
        new_streak: newStreak
      })

      totalReward += rewardComponents.total
    }

    // Validate question_id is a valid UUID (not ephemeral)
    // All questions should now be stored in database for spaced repetition
    if (question_id && question_id.toString().startsWith('ephemeral-')) {
      return NextResponse.json(
        { error: 'Ephemeral questions are not supported. Question must be stored in database.' },
        { status: 400 }
      )
    }

    // Store user response (only columns that exist in schema)
    // Use first core topic for backward compatibility with single topic_id column
    const { data: response, error: responseError } = await supabase
      .from('user_responses')
      .insert({
        session_id,
        question_id: question_id,
        user_id: user.id,
        topic_id: coreTopics[0], // First core topic for backward compatibility
        bloom_level: question.bloom_level,
        user_answer,
        is_correct: isCorrect,
        confidence: confidence,
        reward: totalReward, // Combined total reward
        time_taken_seconds: responseTime, // Use schema column name
        // created_at will be set by database default
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error storing response:', responseError)
      throw new Error(`Failed to store response: ${responseError.message}`)
    }

    // Log reward calculation and mastery updates for transparency
    console.log('Starting transparency logging for', masteryUpdates.length, 'topics')

    for (let i = 0; i < masteryUpdates.length; i++) {
      const masteryUpdate = masteryUpdates[i]
      const rewardInfo = rewardsByTopic[i]

      console.log(`Logging topic ${i + 1}/${masteryUpdates.length}:`, masteryUpdate.topic_name)

      try {
        console.log('Attempting to log reward calculation...')
        await logRewardCalculation({
          userId: user.id,
          sessionId: session_id,
          responseId: response.id,
          questionId: question_id,
          topicId: masteryUpdate.topic_id,
          bloomLevel: question.bloom_level,
          isCorrect,
          confidence,
          responseTimeSeconds: responseTime || 0,
          rewardComponents: rewardInfo.reward_components
        })
        console.log('✓ Reward calculation logged successfully')
      } catch (error) {
        console.error('✗ Failed to log reward calculation:', error)
        console.error('  userId:', user.id)
        console.error('  sessionId:', session_id)
        console.error('  responseId:', response.id)
        console.error('  questionId:', question_id)
        console.error('  topicId:', masteryUpdate.topic_id)
        console.error('  Reward components:', JSON.stringify(rewardInfo.reward_components, null, 2))
      }

      try {
        console.log('Attempting to log mastery update...')
        await logMasteryUpdate({
          userId: user.id,
          sessionId: session_id,
          responseId: response.id,
          topicId: masteryUpdate.topic_id,
          bloomLevel: question.bloom_level,
          oldMastery: masteryUpdate.old_mastery,
          newMastery: masteryUpdate.new_mastery,
          formula: `EMA: ${masteryUpdate.change.toFixed(3)} (learning gain) → ${masteryUpdate.old_mastery.toFixed(1)} to ${masteryUpdate.new_mastery.toFixed(1)}`
        })
        console.log('✓ Mastery update logged successfully')
      } catch (error) {
        console.error('✗ Failed to log mastery update:', error)
        console.error('  oldMastery:', masteryUpdate.old_mastery)
        console.error('  newMastery:', masteryUpdate.new_mastery)
        console.error('  Mastery update:', JSON.stringify(masteryUpdate, null, 2))
      }
    }

    console.log('Transparency logging complete')

    // Track dimension coverage for comprehensive mastery with unique question tracking
    // Track for all core topics
    if (question.dimension && question.bloom_level) {
      const scoreForDimension = isCorrect ? 100 : 0
      const questionId = question.id.toString()

      for (const topicId of coreTopics) {
        console.log('Tracking dimension coverage for topic:', topicId, 'dimension:', question.dimension)

        const { data: existingCoverage } = await supabase
          .from('user_dimension_coverage')
          .select('*')
          .eq('user_id', user.id)
          .eq('chapter_id', session.chapter_id)
          .eq('topic_id', topicId)
          .eq('bloom_level', question.bloom_level)
          .eq('dimension', question.dimension)
          .single()

        if (existingCoverage) {
          // Check if this is a unique question (not a spaced repetition repeat)
          const uniqueQuestions = existingCoverage.unique_questions_answered || []
          const isNewQuestion = !uniqueQuestions.includes(questionId)

          // Add to unique questions array if new
          const updatedUniqueQuestions = isNewQuestion
            ? [...uniqueQuestions, questionId]
            : uniqueQuestions

          // Calculate new average score (only count unique questions for mastery)
          const newTimesTested = existingCoverage.times_tested + 1
          const newTotalAttempts = (existingCoverage.total_attempts || existingCoverage.times_tested) + 1

          // For average score, we want to track performance across unique questions
          // If this is a repeat, we still update the average to reflect current performance
          const newAvgScore = (
            (existingCoverage.average_score * existingCoverage.times_tested) + scoreForDimension
          ) / newTimesTested

          const { error: updateError } = await supabase
            .from('user_dimension_coverage')
            .update({
              times_tested: newTimesTested,
              total_attempts: newTotalAttempts,
              unique_questions_answered: updatedUniqueQuestions,
              average_score: newAvgScore,
              last_tested_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCoverage.id)

          if (updateError) {
            console.error('Error updating dimension coverage for topic:', topicId, updateError)
          } else {
            console.log('Successfully updated dimension coverage for topic:', topicId)
          }
        } else {
          // Insert new coverage record
          const { error: insertError } = await supabase
            .from('user_dimension_coverage')
            .insert({
              user_id: user.id,
              chapter_id: session.chapter_id,
              topic_id: topicId,
              bloom_level: question.bloom_level,
              dimension: question.dimension,
              times_tested: 1,
              total_attempts: 1,
              unique_questions_answered: [questionId],
              average_score: scoreForDimension,
              last_tested_at: new Date().toISOString()
            })

          if (insertError) {
            console.error('Error inserting dimension coverage for topic:', topicId, insertError)
          } else {
            console.log('Successfully inserted dimension coverage for topic:', topicId)
          }
        }
      }
    } else {
      console.log('Skipping dimension coverage tracking - missing required field (dimension or bloom_level)')
    }

    // Update session progress
    const newScore = session.score + (isCorrect ? 1 : 0)
    const newQuestionsAnswered = session.questions_answered + 1
    const isComplete = newQuestionsAnswered >= session.total_questions

    await supabase
      .from('learning_sessions')
      .update({
        score: newScore,
        questions_answered: newQuestionsAnswered,
        ...(isComplete ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', session_id)

    // Find related topics using hybrid semantic + hierarchy approach
    // Use the first core topic as the primary topic for finding related topics
    const primaryTopicId = coreTopics[0]
    const relatedTopicsDiscovered = await findRelatedTopics(primaryTopicId, 4)

    // Get full details for related topics
    const relatedTopicsWithHierarchy = []
    if (relatedTopicsDiscovered.length > 0) {
      const relatedTopicIds = relatedTopicsDiscovered.map(t => t.id)
      const { data: relatedTopicsData } = await supabase
        .from('topics')
        .select('id, name, full_name, depth, parent_topic_id')
        .in('id', relatedTopicIds)

      if (relatedTopicsData) {
        relatedTopicsWithHierarchy.push(...relatedTopicsData)
      }
    }

    // Calculate reading time breakdown for transparency
    let readingTimeBreakdown = null
    if (responseTime) {
      readingTimeBreakdown = calculateReadingTimeBreakdown(
        responseTime,
        question.question_text,
        question.options
      )
    }

    return NextResponse.json({
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      response_time_seconds: responseTime,
      reading_time_breakdown: readingTimeBreakdown, // { readingTime, thinkingTime }

      // Multi-topic support
      mastery_updates: masteryUpdates, // Array of all core topics
      rewards_by_topic: rewardsByTopic, // Individual rewards per topic
      related_topics: relatedTopicsWithHierarchy, // Display only with hierarchy info
      total_reward: totalReward, // Combined total

      // Legacy fields for backward compatibility (first topic)
      reward_components: rewardsByTopic[0]?.reward_components,
      current_streak: rewardsByTopic[0]?.current_streak,
      new_streak: rewardsByTopic[0]?.new_streak,
      mastery_update: masteryUpdates[0],

      session_progress: {
        questions_answered: newQuestionsAnswered,
        total_questions: session.total_questions,
        current_score: newScore,
        is_complete: isComplete
      }
    })
  } catch (error) {
    console.error('Error in POST /api/rl/submit-response:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
