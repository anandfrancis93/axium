'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckIcon, XIcon } from '@/components/icons'
import HamburgerMenu from '@/components/HamburgerMenu'
import { Tooltip } from '@/components/Tooltip'
import Modal from '@/components/Modal'

type ConfidenceLevel = 'low' | 'medium' | 'high'
type RecognitionMethod = 'memory' | 'recognition' | 'educated_guess' | 'random'

type Step = 'confidence' | 'options' | 'recognition' | 'feedback'

export default function LearnPage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const chapter = params.chapter as string

  const [chapterId, setChapterId] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [question, setQuestion] = useState<any>(null)
  const [questionMetadata, setQuestionMetadata] = useState<any>(null)
  const [armSelected, setArmSelected] = useState<any>(null)
  const [decisionContext, setDecisionContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 4-step flow state
  const [currentStep, setCurrentStep] = useState<Step>('confidence')
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [recognitionMethod, setRecognitionMethod] = useState<RecognitionMethod | null>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [showEndSessionModal, setShowEndSessionModal] = useState(false)

  // Response time tracking
  const [questionShownAt, setQuestionShownAt] = useState<number | null>(null)

  useEffect(() => {
    fetchChapterAndStart()
  }, [])

  const fetchChapterAndStart = async () => {
    try {
      const supabase = createClient()
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('id')
        .eq('slug', chapter)
        .single()

      if (!chapterData) {
        setError('Chapter not found')
        setLoading(false)
        return
      }

      setChapterId(chapterData.id)
      await startSession(chapterData.id)
    } catch (err: any) {
      console.error('Error fetching chapter:', err)
      setError(err.message)
      setLoading(false)
      }
  }

  const startSession = async (chapId: string) => {
    try {
      setLoading(true)
      setError('')

      // Start new session (unlimited questions)
      const response = await fetch('/api/rl/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapId,
          num_questions: 999999  // Effectively unlimited
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start session')
      }

      setSession(data)

      // Get first question
      await getNextQuestion(data.session_id)

    } catch (err: any) {
      console.error('Error starting session:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const getNextQuestion = async (sessionId: string) => {
    try {
      const response = await fetch('/api/rl/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get question')
      }

      if (data.session_complete) {
        router.push(`/session-complete/${sessionId}`)
        return
      }

      setQuestion(data.question)
      setQuestionMetadata(data.question_metadata) // Store for submission
      setArmSelected(data.arm_selected)
      setDecisionContext(data.decision_context) // Store for transparency

      // Record when question is shown for response time tracking
      setQuestionShownAt(Date.now())

      // Reset state for new question
      setCurrentStep('confidence')
      setConfidence(null)
      setSelectedAnswer(null)
      setRecognitionMethod(null)
      setFeedback(null)
      setLoading(false)

    } catch (err: any) {
      console.error('Error getting question:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleConfidenceSubmit = () => {
    if (!confidence) return
    setCurrentStep('options')
  }

  const handleAnswerSubmit = () => {
    if (!selectedAnswer) return
    setCurrentStep('recognition')
  }

  const handleRecognitionSubmit = async () => {
    if (!recognitionMethod || !session || !question) return

    try {
      setLoading(true)

      // Calculate response time in seconds
      const responseTimeSeconds = questionShownAt
        ? (Date.now() - questionShownAt) / 1000
        : null

      const response = await fetch('/api/rl/submit-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          question_id: question.id,
          user_answer: selectedAnswer,
          confidence,
          recognition_method: recognitionMethod,
          arm_selected: armSelected,
          question_metadata: questionMetadata, // Include for ephemeral questions
          response_time_seconds: responseTimeSeconds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response')
      }

      setFeedback(data)
      setCurrentStep('feedback')
      setLoading(false)

    } catch (err: any) {
      console.error('Error submitting response:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleNextQuestion = () => {
    if (!session) return
    setLoading(true)
    getNextQuestion(session.session_id)
  }

  const getMasteryTooltip = (oldMastery: number, newMastery: number, change: number) => {
    let oldLevel = ''
    let newLevel = ''
    let interpretation = ''

    // Interpret old mastery
    if (oldMastery === 0) {
      oldLevel = 'No prior knowledge'
    } else if (oldMastery < 20) {
      oldLevel = 'Just getting started'
    } else if (oldMastery < 40) {
      oldLevel = 'Early stages of learning'
    } else if (oldMastery < 60) {
      oldLevel = 'Building understanding'
    } else if (oldMastery < 80) {
      oldLevel = 'Good progress'
    } else {
      oldLevel = 'Strong mastery'
    }

    // Interpret new mastery
    if (newMastery < 20) {
      newLevel = 'Just getting started'
    } else if (newMastery < 40) {
      newLevel = 'Early stages of learning'
    } else if (newMastery < 60) {
      newLevel = 'Building understanding'
    } else if (newMastery < 80) {
      newLevel = 'Good progress, keep practicing'
    } else {
      newLevel = 'Ready to advance to next level'
    }

    // Interpret the change
    if (change >= 30) {
      interpretation = 'Excellent progress!'
    } else if (change >= 15) {
      interpretation = 'Strong improvement'
    } else if (change >= 5) {
      interpretation = 'Steady progress'
    } else if (change > 0) {
      interpretation = 'Small improvement'
    } else if (change === 0) {
      interpretation = 'No change'
    } else if (change > -10) {
      interpretation = 'Slight decrease'
    } else {
      interpretation = 'Needs review'
    }

    return `Before: ${oldMastery}% (${oldLevel})
After: ${newMastery}% (${newLevel})
Change: ${change >= 0 ? '+' : ''}${change}%

${interpretation}

Mastery grows with correct answers and confidence calibration`
  }

  const getRewardLabel = (component: string, value: number): string => {
    switch (component) {
      case 'learningGain':
        if (value >= 8) return 'major breakthrough'
        if (value >= 5) return 'strong improvement'
        if (value >= 2) return 'steady growth'
        if (value >= 0) return 'slight progress'
        if (value >= -3) return 'minor slip'
        return 'significant drop'

      case 'calibration':
        if (value >= 4) return 'confidence matched performance'
        if (value >= 2) return 'good self-assessment'
        if (value >= 0) return 'somewhat accurate'
        if (value >= -2) return 'overconfident or underconfident'
        return 'confidence wildly off'

      case 'recognition':
        if (value >= 5) return 'knew from memory'
        if (value >= 3) return 'recognized answer'
        if (value >= 1) return 'reasoned it out'
        if (value >= -1) return 'lucky guess'
        if (value >= -2) return 'thought wrong was right'
        return 'false confidence'

      case 'spacing':
        if (value >= 4) return '1+ week retention'
        if (value >= 2) return '3-7 day retention'
        if (value >= 1) return '1-3 day retention'
        return 'first time or same day'

      case 'responseTime':
        if (value === 0) return 'not tracked'
        if (value >= 5) return 'instant recall'
        if (value >= 3) return 'thoughtful pace'
        if (value >= 1) return 'took some time'
        if (value > 0) return 'acceptable speed'
        if (value >= -1) return 'overthinking'
        return 'rushed answer'

      case 'streak':
        if (value >= 5) return '10+ in a row!'
        if (value >= 3) return '5-9 in a row'
        if (value >= 2) return '3-4 in a row'
        if (value >= 1) return '2 in a row'
        return 'streak starting'

      default:
        return ''
    }
  }

  const getRewardTooltip = (component: string, value: number) => {
    let description = ''
    let interpretation = ''
    let scale = ''

    switch (component) {
      case 'learningGain':
        description = 'Learning Gain: How much your mastery improved'
        scale = 'Range: -10 to +10 points'
        if (value >= 8) {
          interpretation = 'Excellent! Significant mastery improvement'
        } else if (value >= 5) {
          interpretation = 'Very good progress on this topic'
        } else if (value >= 2) {
          interpretation = 'Steady progress'
        } else if (value >= 0) {
          interpretation = 'Small progress'
        } else if (value >= -3) {
          interpretation = 'Slight setback, review recommended'
        } else {
          interpretation = 'Major gap identified, needs focused review'
        }
        break

      case 'calibration':
        description = 'Calibration: How well your confidence matched your performance'
        scale = 'Range: -5 to +5 points'
        if (value >= 4) {
          interpretation = 'Perfect calibration! Your confidence matched your answer'
        } else if (value >= 2) {
          interpretation = 'Good calibration'
        } else if (value >= 0) {
          interpretation = 'Decent calibration'
        } else if (value >= -2) {
          interpretation = 'Over/under confident - work on self-assessment'
        } else {
          interpretation = 'Poor calibration - confidence did not match performance'
        }
        break

      case 'recognition':
        description = 'Recognition: Reward for your answer method (memory vs guessing)'
        scale = 'Range: 0 to +5 points'
        if (value >= 5) {
          interpretation = 'Maximum bonus! You knew it from memory'
        } else if (value >= 3) {
          interpretation = 'Good! You recognized the correct answer'
        } else if (value >= 1) {
          interpretation = 'You made an educated guess'
        } else {
          interpretation = 'Random guess - no bonus awarded'
        }
        break

      case 'spacing':
        description = 'Spacing: Rewards topic retention over time (not same question, but same concept at this Bloom level)'
        scale = 'Range: 0 to +5 points'
        if (value >= 4) {
          interpretation = 'Excellent! You retained this topic after 1+ week without practice'
        } else if (value >= 2) {
          interpretation = 'Good topic retention after 3-7 days'
        } else if (value >= 1) {
          interpretation = 'Decent retention after 1-3 days'
        } else {
          interpretation = 'First time practicing this topic or same-day review (no spacing bonus)'
        }
        break

      case 'responseTime':
        description = 'Response Time: Reward for retrieval fluency'
        scale = 'Range: -3 to +5 points (adjusted for Bloom level and question length)'
        if (value >= 5) {
          interpretation = 'Fluent mastery! Fast, confident retrieval'
        } else if (value >= 3) {
          interpretation = 'Solid knowledge - thoughtful retrieval'
        } else if (value >= 1) {
          interpretation = 'Slower retrieval - still learning'
        } else if (value >= 0) {
          interpretation = 'Expected pace for this difficulty'
        } else if (value >= -1) {
          interpretation = 'Too slow or overthinking'
        } else {
          interpretation = 'Rushed answer - slow down and think'
        }
        break

      case 'streak':
        description = 'Streak: Consecutive correct answers for this topic'
        scale = 'Range: 0 to +5 points'
        if (value >= 5) {
          interpretation = 'Outstanding streak! 10+ correct in a row'
        } else if (value >= 3) {
          interpretation = 'Excellent streak! 5-9 correct in a row'
        } else if (value >= 2) {
          interpretation = 'Good streak - 3-4 correct in a row'
        } else if (value >= 1) {
          interpretation = 'Building momentum - 2 correct in a row'
        } else {
          interpretation = 'First correct or streak just broke'
        }
        break

      case 'total':
        description = 'Total Reward: Combined score from all components'
        scale = 'Range: -21 to +35 points'
        if (value >= 25) {
          interpretation = 'Outstanding! Maximum learning effectiveness'
        } else if (value >= 20) {
          interpretation = 'Excellent learning performance'
        } else if (value >= 15) {
          interpretation = 'Very good progress'
        } else if (value >= 10) {
          interpretation = 'Good progress'
        } else if (value >= 5) {
          interpretation = 'Positive progress'
        } else if (value >= 0) {
          interpretation = 'Small gain - keep practicing'
        } else if (value >= -5) {
          interpretation = 'Room for improvement'
        } else {
          interpretation = 'Needs focused review and practice'
        }
        break

      default:
        description = 'Reward component'
        interpretation = 'Value: ' + value
        scale = ''
    }

    return `${description}

Value: ${value.toFixed(1)} points
${scale}

${interpretation}`
  }

  if (loading && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="neuro-card max-w-md text-center">
          <div className="text-blue-400 text-lg mb-2">Loading...</div>
          <div className="text-gray-500 text-sm">Preparing your adaptive learning session</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="neuro-card max-w-md">
          <div className="text-red-400 text-lg mb-4">Error</div>
          <div className="text-gray-400 mb-6">{error}</div>
          <button onClick={() => router.push('/subjects')} className="neuro-btn">
            Back to Subjects
          </button>
        </div>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="neuro-card mb-6">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0 flex-shrink">
              <div className="text-sm text-gray-500 mb-1">Question {feedback?.session_progress?.questions_answered || 1}</div>
              <div className="text-2xl font-bold text-gray-200">
                Score: {feedback?.session_progress?.current_score || 0}/{feedback?.session_progress?.questions_answered || 0}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3">
              <HamburgerMenu />
            </div>
          </div>
        </div>

        {/* Main Question Card */}
        <div className="neuro-card">
          {/* Question Text */}
          <div className="mb-8">
            <p className="text-xl text-gray-200 leading-relaxed">
              {question.question_text}
            </p>
          </div>

          {/* STEP 1: Confidence Selection */}
          {currentStep === 'confidence' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                How confident are you about this answer?
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {(['low', 'medium', 'high'] as ConfidenceLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={`neuro-raised p-6 text-center transition-all ${
                      confidence === level ? 'ring-2 ring-blue-400' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-200 capitalize">{level}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleConfidenceSubmit}
                disabled={!confidence}
                className="neuro-btn text-blue-400 w-full py-4 text-lg disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2: Answer Options */}
          {currentStep === 'options' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                Select your answer:
              </h3>
              <div className="space-y-3 mb-6">
                {Object.entries(question.options as { [key: string]: string }).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAnswer(key)}
                    className={`neuro-raised p-4 w-full text-left transition-all ${
                      selectedAnswer === key ? 'ring-2 ring-blue-400' : ''
                    }`}
                  >
                    <span className="font-bold text-blue-400 mr-3">{key}.</span>
                    <span className="text-gray-200">{value}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer}
                className="neuro-btn text-blue-400 w-full py-4 text-lg disabled:opacity-50"
              >
                Submit Answer →
              </button>
            </div>
          )}

          {/* STEP 3: Recognition Method */}
          {currentStep === 'recognition' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-4">
                How did you arrive at your answer?
              </h3>
              <div className="space-y-3 mb-6">
                {[
                  { value: 'memory', label: 'I knew the answer from memory before seeing the options' },
                  { value: 'recognition', label: "I wasn't sure, but recognized the right answer in the options" },
                  { value: 'educated_guess', label: 'I narrowed it down and made an educated guess' },
                  { value: 'random', label: 'I guessed randomly' }
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setRecognitionMethod(method.value as RecognitionMethod)}
                    className={`neuro-raised p-4 w-full text-left transition-all hover:shadow-lg ${
                      recognitionMethod === method.value ? 'ring-2 ring-blue-400 bg-blue-500/10' : ''
                    }`}
                  >
                    <span className="text-gray-200">{method.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleRecognitionSubmit}
                disabled={!recognitionMethod || loading}
                className="neuro-btn text-blue-400 w-full py-4 text-lg disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Get Feedback →'}
              </button>
            </div>
          )}

          {/* STEP 4: Feedback */}
          {currentStep === 'feedback' && feedback && (
            <div>
              {/* Show options with user's selection highlighted */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">
                  Your Answer:
                </h3>
                <div className="space-y-3">
                  {Object.entries(question.options as { [key: string]: string }).map(([key, value]) => {
                    const isSelected = selectedAnswer === key
                    const isCorrect = feedback.correct_answer === key
                    return (
                      <div
                        key={key}
                        className={`neuro-inset p-4 w-full text-left ${
                          isSelected
                            ? feedback.is_correct
                              ? 'ring-2 ring-green-400 bg-green-500/10'
                              : 'ring-2 ring-red-400 bg-red-500/10'
                            : isCorrect
                            ? 'ring-2 ring-green-400 bg-green-500/5'
                            : ''
                        }`}
                      >
                        <span className="font-bold text-gray-200 mr-3">{key}.</span>
                        <span className="text-gray-200">{value}</span>
                        {isSelected && (
                          <span className={`ml-3 text-sm ${feedback.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                            (Your answer)
                          </span>
                        )}
                        {!isSelected && isCorrect && (
                          <span className="ml-3 text-sm text-green-400">(Correct answer)</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Correctness */}
              <div className={`neuro-inset p-6 rounded-lg mb-6 ${
                feedback.is_correct ? 'ring-2 ring-green-400' : 'ring-2 ring-red-400'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    feedback.is_correct ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {feedback.is_correct ? (
                      <CheckIcon size={28} className="text-green-400" />
                    ) : (
                      <XIcon size={28} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-200">
                      {feedback.is_correct ? 'Correct!' : 'Incorrect'}
                    </div>
                  </div>
                </div>

                <div className="neuro-raised p-6 mt-4">
                  <div className="text-sm text-gray-500 mb-4">Explanation:</div>
                  <div className="space-y-4">
                    {(() => {
                      // Parse the explanation into sections
                      const text = feedback.explanation
                      type Section = { header: string; bullets: string[] }
                      const sections: Section[] = []

                      // Type guard to help TypeScript narrow types
                      const isValidSection = (s: Section | undefined): s is Section => {
                        return s !== undefined && Array.isArray(s.bullets) && s.bullets.length > 0
                      }

                      // First, try to identify section headers by looking for common patterns
                      // Split by newlines first if they exist, otherwise by period+space
                      const rawLines = text.includes('\n')
                        ? text.split('\n').filter((l: string) => l.trim())
                        : text.split(/\.\s+/).filter((l: string) => l.trim())

                      let currentSection: Section | undefined = undefined

                      rawLines.forEach((line: string) => {
                        const trimmed = line.trim()
                        if (!trimmed) return

                        // Remove leading bullet symbols if present
                        const cleanedLine = trimmed.replace(/^[•\-\*]\s*/, '')

                        // Check if this is a section header (any capitalized phrase with colon at end)
                        // Match lines that start with capital letter and end with colon
                        const headerMatch = cleanedLine.match(/^([A-Z][^:]{10,}):\s*(.*)$/)

                        if (headerMatch) {
                          // Save previous section
                          if (isValidSection(currentSection)) {
                            sections.push(currentSection)
                          }
                          // Start new section
                          const header = headerMatch[1] + ':'
                          const content = headerMatch[2]
                          currentSection = { header, bullets: content ? [content] : [] }
                        } else if (currentSection) {
                          // Add as bullet to current section (split by periods if it's a long line)
                          if (cleanedLine.length > 150 && cleanedLine.includes('. ')) {
                            // Split long lines by periods
                            const subBullets = cleanedLine.split(/\.\s+/).filter((s: string) => s.trim())
                            currentSection.bullets.push(...subBullets.map((s: string) => s.trim()))
                          } else {
                            currentSection.bullets.push(cleanedLine)
                          }
                        } else {
                          // No section yet, create a default one
                          currentSection = { header: '', bullets: [cleanedLine] }
                        }
                      })

                      // Add last section
                      if (isValidSection(currentSection)) {
                        sections.push(currentSection)
                      }

                      // If no sections parsed, fall back to simple splitting by sentences
                      if (sections.length === 0) {
                        const sentences = text.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 0)
                        return sentences.map((sentence: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <div className="text-gray-200 text-sm leading-relaxed">{sentence.trim()}</div>
                          </div>
                        ))
                      }

                      // Render sections with headers
                      return sections.map((section, sIdx) => {
                        // Special handling for "Fundamental Question:" - show first bullet inline with header
                        const isFundamentalQuestion = section.header.match(/^Fundamental Question:/i)
                        const firstBullet = section.bullets[0]
                        const remainingBullets = section.bullets.slice(1)

                        return (
                          <div key={sIdx} className="space-y-2">
                            {section.header && (
                              <div className="text-blue-400 font-semibold text-sm mb-1">
                                {isFundamentalQuestion && firstBullet
                                  ? `${section.header} ${firstBullet}`
                                  : section.header}
                              </div>
                            )}
                            <div className="space-y-2">
                              {(isFundamentalQuestion ? remainingBullets : section.bullets).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-start gap-3 ml-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                                  <div className="text-gray-200 text-sm leading-relaxed">{bullet}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>

              {/* Decision Explainer - Why This Question Was Selected */}
              {decisionContext && (
                <div className="neuro-inset p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Why This Question?
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    {decisionContext.reasoning}
                  </p>
                  <p className="text-xs text-gray-500">
                    {decisionContext.alternatives_count} other topic{decisionContext.alternatives_count !== 1 ? 's' : ''} {decisionContext.alternatives_count !== 1 ? 'were' : 'was'} considered by Thompson Sampling
                  </p>
                </div>
              )}

              {/* Mastery Updates */}
              <div className="neuro-inset p-4 rounded-lg mb-6">
                <div className="text-sm font-medium text-gray-400 mb-3">Mastery Changes:</div>
                <div className="space-y-2">
                  {feedback.mastery_updates?.map((update: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-gray-300">{update.topic_name || update.topic}</span>
                      <Tooltip content={getMasteryTooltip(update.old_mastery, update.new_mastery, update.change)}>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{update.old_mastery}%</span>
                          <span className="text-gray-600">→</span>
                          <span className="text-blue-400 font-medium">{update.new_mastery}%</span>
                          <span className={`text-sm ${update.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ({update.change >= 0 ? '+' : ''}{update.change}%)
                          </span>
                        </div>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic Details - Shows primary topic in full context */}
              {feedback.mastery_updates && feedback.mastery_updates.length > 0 && (
                <div className="neuro-inset p-4 rounded-lg mb-6">
                  <div className="text-sm font-medium text-gray-400 mb-3">Topic Details:</div>
                  <div className="space-y-1 font-mono text-sm">
                    {(() => {
                      const primaryTopic = feedback.mastery_updates[0]
                      const trees: React.ReactNode[] = []

                      // Parse the full hierarchical path
                      // Example: "Domain > Objective > Parent > Topic"
                      const parts = primaryTopic.topic_full_name
                        ? primaryTopic.topic_full_name.split(' > ')
                        : [primaryTopic.topic_name]

                      // Display each level with proper tree structure
                      parts.forEach((part: string, level: number) => {
                        const isPrimaryTopic = level === parts.length - 1
                        const color = isPrimaryTopic ? 'text-blue-400 font-semibold' : 'text-gray-500'

                        trees.push(
                          <div
                            key={level}
                            className={color}
                            style={{ marginLeft: `${level * 1.5}rem` }}
                          >
                            {level > 0 && '└─ '}{part}
                          </div>
                        )
                      })

                      return trees
                    })()}
                  </div>
                </div>
              )}

              {/* Reward Breakdown - Show per topic if multi-topic, otherwise show single */}
              {feedback.rewards_by_topic && feedback.rewards_by_topic.length > 1 ? (
                // Multi-topic: Separate sections per topic
                <>
                  {feedback.rewards_by_topic.map((topicReward: any, topicIdx: number) => (
                    <div key={topicIdx} className="neuro-inset p-4 rounded-lg mb-6">
                      <div className="text-sm font-medium text-gray-400 mb-3">
                        Reward Components ({topicReward.topic_name}):
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <Tooltip content={getRewardTooltip('learningGain', topicReward.reward_components?.learningGain || 0)}>
                          <div>
                            Learning Gain: <span className="text-blue-400">{topicReward.reward_components?.learningGain?.toFixed(1)}</span>
                            <span className="text-gray-200 text-xs ml-1">({getRewardLabel('learningGain', topicReward.reward_components?.learningGain || 0)})</span>
                          </div>
                        </Tooltip>
                        <Tooltip content={getRewardTooltip('calibration', topicReward.reward_components?.calibration || 0)}>
                          <div>
                            Calibration: <span className="text-purple-400">{topicReward.reward_components?.calibration?.toFixed(1)}</span>
                            <span className="text-gray-200 text-xs ml-1">({getRewardLabel('calibration', topicReward.reward_components?.calibration || 0)})</span>
                          </div>
                        </Tooltip>
                        <Tooltip content={getRewardTooltip('recognition', topicReward.reward_components?.recognition || 0)}>
                          <div>
                            Recognition: <span className="text-green-400">{topicReward.reward_components?.recognition?.toFixed(1)}</span>
                            <span className="text-gray-200 text-xs ml-1">({getRewardLabel('recognition', topicReward.reward_components?.recognition || 0)})</span>
                          </div>
                        </Tooltip>
                        <Tooltip content={getRewardTooltip('spacing', topicReward.reward_components?.spacing || 0)}>
                          <div>
                            Spacing: <span className="text-yellow-400">{topicReward.reward_components?.spacing?.toFixed(1)}</span>
                            <span className="text-gray-200 text-xs ml-1">({getRewardLabel('spacing', topicReward.reward_components?.spacing || 0)})</span>
                          </div>
                        </Tooltip>
                        <Tooltip content={getRewardTooltip('responseTime', topicReward.reward_components?.responseTime || 0)}>
                          <div>
                            Response Time: <span className="text-cyan-400">{topicReward.reward_components?.responseTime?.toFixed(1)}</span>
                            <span className="text-gray-200 text-xs ml-1">
                              ({feedback.response_time_seconds ? `${feedback.response_time_seconds.toFixed(1)}s, ${getRewardLabel('responseTime', topicReward.reward_components?.responseTime || 0)}` : getRewardLabel('responseTime', topicReward.reward_components?.responseTime || 0)})
                            </span>
                          </div>
                        </Tooltip>
                        <Tooltip content={getRewardTooltip('streak', topicReward.reward_components?.streak || 0)}>
                          <div>
                            Streak: <span className="text-orange-400">{topicReward.reward_components?.streak?.toFixed(1)}</span>
                            <span className="text-gray-200 text-xs ml-1">
                              ({topicReward.new_streak !== undefined ? `${topicReward.new_streak} correct, ${getRewardLabel('streak', topicReward.reward_components?.streak || 0)}` : getRewardLabel('streak', topicReward.reward_components?.streak || 0)})
                            </span>
                          </div>
                        </Tooltip>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <Tooltip content={getRewardTooltip('total', topicReward.reward_components?.total || 0)}>
                          <div className="font-medium">Topic Reward: <span className="text-blue-400">{topicReward.reward_components?.total?.toFixed(1)}</span></div>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                  <div className="neuro-inset p-4 rounded-lg mb-6 bg-gray-800/30">
                    <div className="text-lg font-bold text-center">
                      Combined Total: <span className="text-blue-400">{feedback.total_reward?.toFixed(1)}</span> points
                    </div>
                  </div>
                </>
              ) : (
                // Single topic: Show as before
                <div className="neuro-inset p-4 rounded-lg mb-6">
                  <div className="text-sm font-medium text-gray-400 mb-3">Reward Components:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Tooltip content={getRewardTooltip('learningGain', feedback.reward_components?.learningGain || 0)}>
                      <div>
                        Learning Gain: <span className="text-blue-400">{feedback.reward_components?.learningGain?.toFixed(1)}</span>
                        <span className="text-gray-200 text-xs ml-1">({getRewardLabel('learningGain', feedback.reward_components?.learningGain || 0)})</span>
                      </div>
                    </Tooltip>
                    <Tooltip content={getRewardTooltip('calibration', feedback.reward_components?.calibration || 0)}>
                      <div>
                        Calibration: <span className="text-purple-400">{feedback.reward_components?.calibration?.toFixed(1)}</span>
                        <span className="text-gray-200 text-xs ml-1">({getRewardLabel('calibration', feedback.reward_components?.calibration || 0)})</span>
                      </div>
                    </Tooltip>
                    <Tooltip content={getRewardTooltip('recognition', feedback.reward_components?.recognition || 0)}>
                      <div>
                        Recognition: <span className="text-green-400">{feedback.reward_components?.recognition?.toFixed(1)}</span>
                        <span className="text-gray-200 text-xs ml-1">({getRewardLabel('recognition', feedback.reward_components?.recognition || 0)})</span>
                      </div>
                    </Tooltip>
                    <Tooltip content={getRewardTooltip('spacing', feedback.reward_components?.spacing || 0)}>
                      <div>
                        Spacing: <span className="text-yellow-400">{feedback.reward_components?.spacing?.toFixed(1)}</span>
                        <span className="text-gray-200 text-xs ml-1">({getRewardLabel('spacing', feedback.reward_components?.spacing || 0)})</span>
                      </div>
                    </Tooltip>
                    <Tooltip content={getRewardTooltip('responseTime', feedback.reward_components?.responseTime || 0)}>
                      <div>
                        Response Time: <span className="text-cyan-400">{feedback.reward_components?.responseTime?.toFixed(1)}</span>
                        <span className="text-gray-200 text-xs ml-1">
                          ({feedback.response_time_seconds ? `${feedback.response_time_seconds.toFixed(1)}s, ${getRewardLabel('responseTime', feedback.reward_components?.responseTime || 0)}` : getRewardLabel('responseTime', feedback.reward_components?.responseTime || 0)})
                        </span>
                      </div>
                    </Tooltip>
                    <Tooltip content={getRewardTooltip('streak', feedback.reward_components?.streak || 0)}>
                      <div>
                        Streak: <span className="text-orange-400">{feedback.reward_components?.streak?.toFixed(1)}</span>
                        <span className="text-gray-200 text-xs ml-1">
                          ({feedback.new_streak !== undefined ? `${feedback.new_streak} correct, ${getRewardLabel('streak', feedback.reward_components?.streak || 0)}` : getRewardLabel('streak', feedback.reward_components?.streak || 0)})
                        </span>
                      </div>
                    </Tooltip>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <Tooltip content={getRewardTooltip('total', feedback.reward_components?.total || 0)}>
                      <div className="font-medium">Total Reward: <span className="text-blue-400">{feedback.reward_components?.total?.toFixed(1)}</span></div>
                    </Tooltip>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleNextQuestion}
                  className="neuro-btn text-blue-400 flex-1 py-4 text-lg"
                >
                  Next Question →
                </button>
                <button
                  onClick={() => setShowEndSessionModal(true)}
                  className="neuro-btn text-gray-300 px-6 py-4 text-lg"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End Session Confirmation Modal */}
      <Modal
        isOpen={showEndSessionModal}
        onClose={() => setShowEndSessionModal(false)}
        title="End Session"
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-center">
            Are you sure you want to end this session?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEndSessionModal(false)}
              className="neuro-btn text-gray-300 flex-1 py-3"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowEndSessionModal(false)
                router.replace(`/performance/${subject}/${chapter}`)
              }}
              className="neuro-btn text-red-400 flex-1 py-3"
            >
              End Session
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
