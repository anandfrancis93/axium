/**
 * Quiz Start API Endpoint
 *
 * POST /api/quiz/start
 *
 * Starts a new quiz session with questions for a specific topic/Bloom level
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { QuizStartParams, QuizQuestion } from '@/lib/types/quiz'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: QuizStartParams = await request.json()
    const {
      topicId,
      bloomLevel = 1,
      questionCount = 10,
      useRecommendations = false
    } = body

    // Get recommended topic if not specified
    let selectedTopicId = topicId
    if (useRecommendations && !topicId) {
      // TODO: Call RL recommendation engine
      // For now, select a random topic the user has progress on
      const { data: progressTopics } = await supabase
        .from('user_progress')
        .select('topic_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (progressTopics) {
        selectedTopicId = progressTopics.topic_id
      }
    }

    if (!selectedTopicId) {
      return NextResponse.json(
        { error: 'Topic ID is required or no progress found for recommendations' },
        { status: 400 }
      )
    }

    // Fetch questions for the topic and Bloom level
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', selectedTopicId)
      .eq('bloom_level', bloomLevel)
      .limit(questionCount)

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this topic and Bloom level' },
        { status: 404 }
      )
    }

    // Get topic info
    const { data: topic } = await supabase
      .from('topics')
      .select('name')
      .eq('id', selectedTopicId)
      .single()

    // Create session (simplified - stored in memory for now)
    const session = {
      id: crypto.randomUUID(),
      userId: user.id,
      topicId: selectedTopicId,
      topicName: topic?.name || 'Unknown Topic',
      bloomLevel,
      startedAt: new Date().toISOString(),
      questions: questions.map((q: any) => ({
        id: q.id,
        topic_id: q.topic_id,
        bloom_level: q.bloom_level,
        question_format: q.question_format,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_score: q.difficulty_score,
        metadata: q.metadata,
        startedAt: new Date()
      })),
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: questions.length,
      isComplete: false
    }

    return NextResponse.json({
      success: true,
      session,
      firstQuestion: session.questions[0]
    })

  } catch (error) {
    console.error('Error in quiz start:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
