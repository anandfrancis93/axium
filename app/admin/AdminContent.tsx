'use client'

import { useState } from 'react'
import { SubjectManager } from './SubjectManager'
import { ChapterManager } from './ChapterManager'
import { QuestionGenerator } from './QuestionGenerator'

type Tab = 'subjects' | 'chapters' | 'questions' | 'hierarchy'

export function AdminContent() {
  const [activeTab, setActiveTab] = useState<Tab>('subjects')

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`neuro-btn px-6 py-3 whitespace-nowrap ${activeTab === 'subjects' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          Subjects
        </button>
        <button
          onClick={() => setActiveTab('chapters')}
          className={`neuro-btn px-6 py-3 whitespace-nowrap ${activeTab === 'chapters' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          Chapters
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`neuro-btn px-6 py-3 whitespace-nowrap ${activeTab === 'questions' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          Generate Questions
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`neuro-btn px-6 py-3 whitespace-nowrap ${activeTab === 'hierarchy' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          Hierarchy
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'subjects' && <SubjectManager />}
      {activeTab === 'chapters' && <ChapterManager />}
      {activeTab === 'questions' && <QuestionGenerator />}
      {activeTab === 'hierarchy' && (
        <div className="neuro-card">
          <h2 className="text-2xl font-semibold text-gray-200 mb-6">Content Hierarchy</h2>
          <div className="neuro-inset p-6 rounded-lg">
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
        </div>
      )}
    </main>
  )
}
