'use client'

import { useState } from 'react'
import { SubjectManager } from './SubjectManager'
import { ChapterManager } from './ChapterManager'
import { QuestionGenerator } from './QuestionGenerator'
import { ChevronDownIcon } from '@/components/icons'

export function AdminContent() {
  const [expandedSections, setExpandedSections] = useState<{
    subjects: boolean
    chapters: boolean
    questions: boolean
    hierarchy: boolean
  }>({
    subjects: false,
    chapters: false,
    questions: false,
    hierarchy: false,
  })

  // Accordion behavior: only one section expanded at a time
  const toggleSection = (section: keyof typeof expandedSections) => {
    const currentState = expandedSections[section]

    // If clicking the currently expanded section, just collapse it
    if (currentState) {
      setExpandedSections(prev => ({
        ...prev,
        [section]: false
      }))
      return
    }

    // Otherwise, collapse all and expand the clicked one
    setExpandedSections({
      subjects: section === 'subjects',
      chapters: section === 'chapters',
      questions: section === 'questions',
      hierarchy: section === 'hierarchy'
    })
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Subjects */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => toggleSection('subjects')}
          className="w-full flex items-center justify-between mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-200">
            Subjects
          </h2>
          <ChevronDownIcon
            size={24}
            className={`text-gray-400 transition-transform ${expandedSections.subjects ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.subjects && <SubjectManager />}
      </div>

      {/* Chapters */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => toggleSection('chapters')}
          className="w-full flex items-center justify-between mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-200">
            Chapters
          </h2>
          <ChevronDownIcon
            size={24}
            className={`text-gray-400 transition-transform ${expandedSections.chapters ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.chapters && <ChapterManager />}
      </div>

      {/* Question Generator */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => toggleSection('questions')}
          className="w-full flex items-center justify-between mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-200">
            Generate AI Questions
          </h2>
          <ChevronDownIcon
            size={24}
            className={`text-gray-400 transition-transform ${expandedSections.questions ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.questions && <QuestionGenerator />}
      </div>

      {/* Content Hierarchy */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => toggleSection('hierarchy')}
          className="w-full flex items-center justify-between mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-200">
            Content Hierarchy
          </h2>
          <ChevronDownIcon
            size={24}
            className={`text-gray-400 transition-transform ${expandedSections.hierarchy ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections.hierarchy && (
          <div className="neuro-inset p-4 rounded-lg">
            <p className="text-sm text-gray-300 mb-2 font-medium">
              Subject → Chapter → Topic → Bloom Level (1-6)
            </p>
            <p className="text-xs text-gray-500 mt-3">
              1. Create subjects (e.g., "Computer Science", "Mathematics")<br />
              2. Add chapters to subjects (e.g., "Data Structures", "Algorithms")<br />
              3. Upload documents to chapters for RAG-powered learning<br />
              4. Topics and Bloom levels will be managed through the learning interface
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
