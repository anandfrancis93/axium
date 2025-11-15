/**
 * TopicSelector Component
 *
 * Client component for selecting topics and Bloom levels
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Target, TrendingUp } from 'lucide-react'

interface Topic {
  id: string
  name: string
  topic_order: number
}

interface Chapter {
  id: string
  name: string
  chapter_order: number
  topics: Topic[]
}

interface Subject {
  id: string
  name: string
  chapters: Chapter[]
}

interface TopicSelectorProps {
  subjects: Subject[]
  progressMap: Map<string, any>
}

export default function TopicSelector({ subjects, progressMap }: TopicSelectorProps) {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedBloomLevel, setSelectedBloomLevel] = useState<number>(1)

  const currentSubject = subjects.find(s => s.id === selectedSubject)
  const currentChapter = currentSubject?.chapters.find(c => c.id === selectedChapter)

  function handleStartQuiz() {
    if (!selectedTopic) {
      alert('Please select a topic')
      return
    }

    router.push(`/learn?topicId=${selectedTopic}&bloomLevel=${selectedBloomLevel}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Step 1: Select Subject */}
      <div className="neuro-card p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <span className="neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-400">
            1
          </span>
          Select Subject
        </h2>

        <div className="space-y-2">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => {
                setSelectedSubject(subject.id)
                setSelectedChapter(null)
                setSelectedTopic(null)
              }}
              className={`
                w-full text-left p-4 rounded-lg transition-all flex items-center justify-between
                ${selectedSubject === subject.id
                  ? 'neuro-raised border-2 border-blue-400 text-blue-400'
                  : 'neuro-inset text-gray-300 hover:border-blue-400/30 border-2 border-transparent'
                }
              `}
            >
              <span className="font-medium">{subject.name}</span>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Chapter */}
      <div className="neuro-card p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <span className="neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-400">
            2
          </span>
          Select Chapter
        </h2>

        {!selectedSubject ? (
          <p className="text-sm text-gray-500 text-center py-8">Select a subject first</p>
        ) : (
          <div className="space-y-2">
            {currentSubject?.chapters
              .sort((a, b) => a.chapter_order - b.chapter_order)
              .map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    setSelectedChapter(chapter.id)
                    setSelectedTopic(null)
                  }}
                  className={`
                    w-full text-left p-4 rounded-lg transition-all flex items-center justify-between
                    ${selectedChapter === chapter.id
                      ? 'neuro-raised border-2 border-blue-400 text-blue-400'
                      : 'neuro-inset text-gray-300 hover:border-blue-400/30 border-2 border-transparent'
                    }
                  `}
                >
                  <span>{chapter.name}</span>
                  <ChevronRight size={20} />
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Step 3: Select Topic */}
      <div className="neuro-card p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <span className="neuro-inset w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-blue-400">
            3
          </span>
          Select Topic
        </h2>

        {!selectedChapter ? (
          <p className="text-sm text-gray-500 text-center py-8">Select a chapter first</p>
        ) : (
          <div className="space-y-2">
            {currentChapter?.topics
              .sort((a, b) => a.topic_order - b.topic_order)
              .map((topic) => {
                const progress = progressMap.get(topic.id)
                const hasProgress = !!progress

                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`
                      w-full text-left p-4 rounded-lg transition-all
                      ${selectedTopic === topic.id
                        ? 'neuro-raised border-2 border-blue-400 text-blue-400'
                        : 'neuro-inset text-gray-300 hover:border-blue-400/30 border-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span>{topic.name}</span>
                      {hasProgress && (
                        <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full">
                          L{progress.current_bloom_level}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      {/* Bloom Level Selection & Start */}
      {selectedTopic && (
        <div className="lg:col-span-3 neuro-card p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Target size={20} className="text-blue-400" />
            Select Bloom Level
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedBloomLevel(level)}
                className={`
                  p-4 rounded-lg transition-all text-center
                  ${selectedBloomLevel === level
                    ? 'neuro-raised border-2 border-blue-400'
                    : 'neuro-inset hover:border-blue-400/30 border-2 border-transparent'
                  }
                `}
              >
                <div className={`text-2xl font-bold mb-1 ${selectedBloomLevel === level ? 'text-blue-400' : 'text-gray-300'}`}>
                  {level}
                </div>
                <div className="text-xs text-gray-500">
                  {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'][level - 1]}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleStartQuiz}
            className="neuro-btn text-blue-400 w-full py-4 text-lg font-semibold"
          >
            Start Quiz →
          </button>
        </div>
      )}
    </div>
  )
}
