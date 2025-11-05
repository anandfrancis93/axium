import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { selectArmThompsonSampling } from '@/lib/rl/thompson-sampling'

/**
 * POST /api/rl/next-question
 *
 * Get next question using Thompson Sampling RL
 *
 * Body:
 * - session_id: UUID of the learning session
 *
 * Returns:
 * - question: Full question object
 * - session_progress: Current progress in session
 * - arm_selected: Which (topic, bloom_level) was chosen
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session is complete
    if (session.questions_answered >= session.total_questions) {
      return NextResponse.json({
        session_complete: true,
        final_score: session.score,
        questions_answered: session.questions_answered
      })
    }

    // Use Thompson Sampling to select next arm (topic, bloom_level)
    const selectedArm = await selectArmThompsonSampling(user.id, session.chapter_id)

    if (!selectedArm) {
      return NextResponse.json(
        { error: 'No available questions for this chapter. Upload content and generate questions first.' },
        { status: 404 }
      )
    }

    console.log('Selected arm:', selectedArm)

    // Get questions for this arm
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('chapter_id', session.chapter_id)
      .eq('bloom_level', selectedArm.bloomLevel)
      .or(`primary_topic.eq.${selectedArm.topic},topic.eq.${selectedArm.topic}`)

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json(
        { error: 'Failed to fetch questions: ' + questionsError.message },
        { status: 500 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found for topic "${selectedArm.topic}" at Bloom level ${selectedArm.bloomLevel}` },
        { status: 404 }
      )
    }

    // Filter to questions user hasn't answered yet in this session
    const { data: previousResponses } = await supabase
      .from('user_responses')
      .select('question_id')
      .eq('session_id', session_id)

    const answeredQuestionIds = new Set(previousResponses?.map(r => r.question_id) || [])
    const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id))

    // If all questions for this arm were answered, fall back to any question from arm
    const availableQuestions = unansweredQuestions.length > 0 ? unansweredQuestions : questions

    // Randomly select a question
    const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]

    // Return question WITHOUT the correct answer
    const { correct_answer, ...questionWithoutAnswer } = selectedQuestion

    return NextResponse.json({
      question: questionWithoutAnswer,
      session_progress: {
        session_id: session.id,
        questions_answered: session.questions_answered,
        total_questions: session.total_questions,
        current_score: session.score
      },
      arm_selected: {
        topic: selectedArm.topic,
        bloom_level: selectedArm.bloomLevel
      }
    })
  } catch (error) {
    console.error('Error in POST /api/rl/next-question:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
