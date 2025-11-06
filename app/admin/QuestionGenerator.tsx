'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecommendedFormats, type QuestionFormat } from '@/lib/utils/question-format'

type Chapter = {
  id: string
  name: string
  subjects: { name: string } | null
}

type GeneratedQuestion = {
  id: string
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correct_answer: string
  explanation: string
  bloom_level: number
  topic: string
  question_format?: string
}

const BLOOM_LEVELS = [
  { value: 1, label: 'Level 1: Remember', description: 'Recall facts and basic concepts' },
  { value: 2, label: 'Level 2: Understand', description: 'Explain ideas or concepts' },
  { value: 3, label: 'Level 3: Apply', description: 'Use information in new situations' },
  { value: 4, label: 'Level 4: Analyze', description: 'Draw connections among ideas' },
  { value: 5, label: 'Level 5: Evaluate', description: 'Justify a stand or decision' },
  { value: 6, label: 'Level 6: Create', description: 'Produce new or original work' },
]

// Common cybersecurity topics for random selection
const COMMON_TOPICS = [
  'security controls',
  'CIA triad',
  'threat actors',
  'vulnerabilities',
  'authentication',
  'encryption',
  'access control',
  'network security',
  'malware',
  'incident response',
  'risk management',
  'cryptography',
  'firewalls',
  'intrusion detection',
  'security policies',
  'physical security',
  'social engineering',
  'penetration testing',
  'security monitoring',
  'disaster recovery',
]

export function QuestionGenerator() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState('')
  const [topic, setTopic] = useState('')
  const [bloomLevel, setBloomLevel] = useState(1)
  const [questionFormat, setQuestionFormat] = useState<QuestionFormat>('mcq_single')
  const [numQuestions, setNumQuestions] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [recommendedFormats, setRecommendedFormats] = useState(getRecommendedFormats(1))

  useEffect(() => {
    loadChapters()
  }, [])

  useEffect(() => {
    if (selectedChapter) {
      loadTopicsFromChapter()
    }
  }, [selectedChapter])

  useEffect(() => {
    // Update recommended formats when Bloom level changes
    setRecommendedFormats(getRecommendedFormats(bloomLevel))
    // Auto-select first recommended format if current format isn't ideal
    const recommended = getRecommendedFormats(bloomLevel)
    if (recommended.length > 0 && !recommended.find(f => f.key === questionFormat)) {
      setQuestionFormat(recommended[0].key)
    }
  }, [bloomLevel])

  const loadChapters = async () => {
    const supabase = createClient()
    const { data, error} = await supabase
      .from('chapters')
      .select(`
        id,
        name,
        subjects (name)
      `)
      .order('name')

    if (error) {
      console.error('Error loading chapters:', error)
    } else {
      setChapters((data as any) || [])
    }
  }

  const loadTopicsFromChapter = async () => {
    if (!selectedChapter) return

    setLoadingTopics(true)
    setExtractedTopics([])

    try {
      const response = await fetch(`/api/chapters/${selectedChapter}/topics`)
      const result = await response.json()

      if (response.ok && result.topics) {
        setExtractedTopics(result.topics)
        console.log(`Loaded ${result.topics.length} topics from chapter`)
      } else {
        console.error('Failed to load topics:', result.error)
        // Fall back to common topics if extraction fails
        setExtractedTopics(COMMON_TOPICS)
      }
    } catch (error) {
      console.error('Error loading topics:', error)
      // Fall back to common topics
      setExtractedTopics(COMMON_TOPICS)
    }

    setLoadingTopics(false)
  }

  const handleGenerate = async (customTopic?: string, customBloomLevel?: number, customFormat?: QuestionFormat) => {
    const topicToUse = customTopic || topic
    const bloomLevelToUse = customBloomLevel || bloomLevel
    const formatToUse = customFormat || questionFormat

    if (!selectedChapter || !topicToUse.trim()) {
      setMessage('Please select a chapter and enter a topic')
      return
    }

    setLoading(true)
    setMessage('Generating questions with AI...')
    setGeneratedQuestions([])

    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapter_id: selectedChapter,
          topic: topicToUse.trim(),
          bloom_level: bloomLevelToUse,
          question_format: formatToUse,
          num_questions: numQuestions,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`Generated ${result.questions.length} question(s) using ${result.chunks_used} knowledge chunks`)
        setGeneratedQuestions(result.questions)
      } else {
        setMessage(`Error: ${result.error}`)
        console.error('Generation error:', result)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      setMessage('Failed to generate questions. Check console for details.')
    }

    setLoading(false)
  }

  const handleRandomGenerate = async () => {
    console.log('Random button clicked, selectedChapter:', selectedChapter)

    if (!selectedChapter) {
      setMessage('Please select a chapter first')
      return
    }

    if (loadingTopics) {
      setMessage('Loading topics from your content...')
      return
    }

    const topicsToUse = extractedTopics.length > 0 ? extractedTopics : COMMON_TOPICS

    if (topicsToUse.length === 0) {
      setMessage('No topics found. Upload content to this chapter first.')
      return
    }

    try {
      // Pick random topic from extracted topics
      const randomTopic = topicsToUse[Math.floor(Math.random() * topicsToUse.length)]

      // Pick random Bloom level (1-6)
      const randomBloomLevel = Math.floor(Math.random() * 6) + 1

      // Pick random format from recommended formats for this Bloom level
      const formatsForLevel = getRecommendedFormats(randomBloomLevel)
      const randomFormat = formatsForLevel.length > 0
        ? formatsForLevel[Math.floor(Math.random() * formatsForLevel.length)].key
        : 'mcq_single'

      console.log('Random values:', { randomTopic, randomBloomLevel, randomFormat, topicsSource: extractedTopics.length > 0 ? 'chapter content' : 'fallback' })

      // Update form fields (for visual feedback)
      setTopic(randomTopic)
      setBloomLevel(randomBloomLevel)
      setQuestionFormat(randomFormat)

      // Show selection info before generating
      const bloomLevelName = BLOOM_LEVELS.find(l => l.value === randomBloomLevel)?.label || `Level ${randomBloomLevel}`
      const formatInfo = getRecommendedFormats(randomBloomLevel).find(f => f.key === randomFormat)
      setMessage(`Random selection: ${randomTopic} - ${bloomLevelName} - ${formatInfo?.name || randomFormat}\n\nGenerating question...`)

      // Small delay to show the selection
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate immediately with the random values
      await handleGenerate(randomTopic, randomBloomLevel, randomFormat)
    } catch (error) {
      console.error('Error in handleRandomGenerate:', error)
      setMessage('Error generating random question')
    }
  }

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Chapter *
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="neuro-input w-full"
              disabled={loading}
            >
              <option value="">Select a chapter...</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.subjects?.name || 'Unknown'} - {chapter.name}
                </option>
              ))}
            </select>
            {chapters.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Create a chapter and upload content first
              </p>
            )}
            {loadingTopics && (
              <p className="text-xs text-blue-400 mt-1">
                Extracting topics from chapter content...
              </p>
            )}
            {!loadingTopics && extractedTopics.length > 0 && (
              <p className="text-xs text-green-400 mt-1">
                Found {extractedTopics.length} topics from your content
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., CIA Triad, Security Controls, Threat Actors"
              className="neuro-input w-full"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              AI will search your uploaded content for relevant material
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bloom's Taxonomy Level *
            </label>
            <select
              value={bloomLevel}
              onChange={(e) => setBloomLevel(parseInt(e.target.value))}
              className="neuro-input w-full"
              disabled={loading}
            >
              {BLOOM_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Question Format *
            </label>
            <select
              value={questionFormat}
              onChange={(e) => setQuestionFormat(e.target.value as QuestionFormat)}
              className="neuro-input w-full"
              disabled={loading}
            >
              {recommendedFormats.map((format) => (
                <option key={format.key} value={format.key}>
                  {format.name} - {format.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Showing formats recommended for Bloom Level {bloomLevel}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Number of Questions
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
              className="neuro-input w-full"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRandomGenerate}
              disabled={loading || !selectedChapter}
              className="neuro-btn"
            >
              Random Question
            </button>
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !selectedChapter || !topic.trim()}
              className="neuro-btn text-blue-400"
            >
              {loading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>

          {message && (
            <div className={`neuro-inset p-3 rounded-lg text-sm whitespace-pre-line ${
              message.startsWith('Error') || message.includes('Failed') ? 'text-red-400' :
              message.includes('Please select') || message.includes('No topics') ? 'text-yellow-400' :
              message.includes('Random selection') ? 'text-blue-400' :
              message.includes('Generated') ? 'text-green-400' :
              'text-blue-400'
            }`}>
              {message}
            </div>
          )}
        </div>

      {/* Generated Questions Display */}
      {generatedQuestions.length > 0 && (
        <div className="neuro-card">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Generated Questions ({generatedQuestions.length})
          </h3>

          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => (
              <div key={q.id} className="neuro-raised p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded neuro-inset text-purple-400">
                        Bloom Level {q.bloom_level}
                      </span>
                      <span className="text-xs px-2 py-1 rounded neuro-inset text-blue-400">
                        {q.topic}
                      </span>
                    </div>
                    <p className="text-gray-200 font-medium mb-3">
                      {q.question_text}
                    </p>

                    <div className="space-y-2 mb-3">
                      {Object.entries(q.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`neuro-inset p-2 rounded text-sm ${
                            key === q.correct_answer
                              ? 'text-green-400 ring-1 ring-green-400/50'
                              : 'text-gray-400'
                          }`}
                        >
                          <span className="font-bold">{key}.</span> {value}
                          {key === q.correct_answer && ' (correct)'}
                        </div>
                      ))}
                    </div>

                    <div className="neuro-inset p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Explanation:</p>
                      <p className="text-sm text-gray-300">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
