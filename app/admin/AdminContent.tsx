'use client'

import { useState } from 'react'
import { SubjectManager } from './SubjectManager'
import { ChapterManager } from './ChapterManager'
import { QuestionGenerator } from './QuestionGenerator'

export function AdminContent() {
  const [expandedSections, setExpandedSections] = useState<{
    subjects: boolean
    chapters: boolean
    questions: boolean
    hierarchy: boolean
  }>({
    subjects: true,
    chapters: true,
    questions: true,
    hierarchy: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Subjects */}
      <div className="neuro-card mb-6">
        <button
          type="button"
          onClick={() => toggleSection('subjects')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-2xl font-semibold text-gray-200">
            Subjects
          </h2>
          <span className="text-gray-400 text-xl">
            {expandedSections.subjects ? '▼' : '▶'}
          </span>
        </button>
        {expandedSections.subjects && <SubjectManager />}
      </div>

      {/* Chapters */}
      <div className="neuro-card mb-6">
        <button
          type="button"
          onClick={() => toggleSection('chapters')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-2xl font-semibold text-gray-200">
            Chapters
          </h2>
          <span className="text-gray-400 text-xl">
            {expandedSections.chapters ? '▼' : '▶'}
          </span>
        </button>
        {expandedSections.chapters && <ChapterManager />}
      </div>

      {/* Question Generator */}
      <div className="neuro-card mb-6">
        <button
          type="button"
          onClick={() => toggleSection('questions')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-2xl font-semibold text-gray-200">
            Generate AI Questions
          </h2>
          <span className="text-gray-400 text-xl">
            {expandedSections.questions ? '▼' : '▶'}
          </span>
        </button>
        {expandedSections.questions && <QuestionGenerator />}
      </div>

      {/* Content Hierarchy */}
      <div className="neuro-card">
        <button
          type="button"
          onClick={() => toggleSection('hierarchy')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-200">
            Content Hierarchy
          </h3>
          <span className="text-gray-400 text-xl">
            {expandedSections.hierarchy ? '▼' : '▶'}
          </span>
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
