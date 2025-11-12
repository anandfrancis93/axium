'use client'

import { useState } from 'react'
import { SubjectManager } from './SubjectManager'
import { ChapterManager } from './ChapterManager'
import { QuestionGenerator } from './QuestionGenerator'

type Tab = 'subjects' | 'chapters' | 'questions' | 'hierarchy' | 'system'

export function AdminContent() {
  const [activeTab, setActiveTab] = useState<Tab>('subjects')
  const [recalculating, setRecalculating] = useState(false)
  const [recalcResult, setRecalcResult] = useState<any>(null)

  const handleRecalculateMastery = async () => {
    if (!confirm('This will recalculate all mastery scores from raw response data. This may take a few minutes. Continue?')) {
      return
    }

    setRecalculating(true)
    setRecalcResult(null)

    try {
      const response = await fetch('/api/admin/recalculate-mastery', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to recalculate mastery')
      }

      setRecalcResult(data)
      alert(`Success! Updated ${data.totalUpdated} records for ${data.usersProcessed} users.`)
    } catch (error: any) {
      console.error('Error recalculating mastery:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setRecalculating(false)
    }
  }

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
        <button
          onClick={() => setActiveTab('system')}
          className={`neuro-btn px-6 py-3 whitespace-nowrap ${activeTab === 'system' ? 'text-blue-400' : 'text-gray-400'}`}
        >
          System
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
      {activeTab === 'system' && (
        <div className="neuro-card">
          <h2 className="text-2xl font-semibold text-gray-200 mb-6">System Operations</h2>

          {/* Recalculate Mastery Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-300 mb-4">Recalculate All Mastery Scores</h3>
            <div className="neuro-inset p-6 rounded-lg mb-4">
              <p className="text-sm text-gray-300 mb-3">
                This operation will recalculate all <span className="text-blue-400 font-medium">user_topic_mastery.mastery_score</span> values from raw response data.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 mb-4 list-disc list-inside">
                <li>Fetches all responses in chronological order</li>
                <li>Uses actual reward components (calibration + recognition)</li>
                <li>Applies proper learning gain formula: qualityScore × bloomMultiplier</li>
                <li>Allows negative scores to accurately reflect poor performance</li>
                <li>Updates questions_attempted and questions_correct counts</li>
              </ul>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 mb-4">
                <p className="text-xs text-yellow-400">
                  <strong>Warning:</strong> This operation may take several minutes for users with many responses.
                  It will process all users in the system.
                </p>
              </div>
            </div>

            <button
              onClick={handleRecalculateMastery}
              disabled={recalculating}
              className="neuro-btn text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
            >
              {recalculating ? 'Recalculating...' : 'Recalculate All Mastery Scores'}
            </button>

            {recalcResult && (
              <div className="mt-6 neuro-inset p-6 rounded-lg">
                <h4 className="text-sm font-semibold text-green-400 mb-3">✓ Recalculation Complete</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Users Processed:</span>
                    <span className="text-gray-200 font-medium ml-2">{recalcResult.usersProcessed}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Records Updated:</span>
                    <span className="text-gray-200 font-medium ml-2">{recalcResult.totalUpdated}</span>
                  </div>
                </div>

                {recalcResult.errors && recalcResult.errors.length > 0 && (
                  <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded p-3">
                    <p className="text-xs text-red-400 font-semibold mb-2">⚠️ Errors Encountered ({recalcResult.errors.length}):</p>
                    <div className="max-h-32 overflow-y-auto text-xs font-mono text-red-300 space-y-2">
                      {recalcResult.errors.map((err: any, idx: number) => (
                        <div key={idx} className="pb-2 border-b border-red-500/20 last:border-0">
                          <div className="font-semibold">{err.error}</div>
                          <div className="text-gray-400">{err.details}</div>
                          {err.data && (
                            <div className="text-gray-500 text-xs mt-1">
                              {JSON.stringify(err.data)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recalcResult.results && recalcResult.results.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Sample Results (first 20):</p>
                    <div className="max-h-48 overflow-y-auto text-xs font-mono text-gray-400 space-y-1">
                      {recalcResult.results.map((r: any, idx: number) => (
                        <div key={idx}>
                          {r.topic}: L{r.bloomLevel} = {r.mastery >= 0 ? '+' : ''}{r.mastery.toFixed(1)}%
                          ({r.correct}/{r.attempts})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
