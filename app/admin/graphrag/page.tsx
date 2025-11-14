/**
 * GraphRAG Admin Page
 *
 * - Enable/disable GraphRAG
 * - Switch between RAG modes (vector, graph, hybrid, side-by-side)
 * - Trigger indexing for chapters
 * - View indexing job status
 * - Test and compare both RAG systems
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, GitBranch, Zap, Play, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function GraphRAGAdminPage() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<'vector' | 'graph' | 'hybrid' | 'side-by-side'>('vector')
  const [chapters, setChapters] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [testingChapterId, setTestingChapterId] = useState<string | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [topics, setTopics] = useState<any[]>([])
  const [bloomLevel, setBloomLevel] = useState<number>(4)
  const [generatedQuestion, setGeneratedQuestion] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [indexedChapters, setIndexedChapters] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Check if enabled (from env)
      const envEnabled = process.env.NEXT_PUBLIC_ENABLE_GRAPH_RAG === 'true'
      setEnabled(envEnabled)

      // Load chapters
      const chaptersRes = await fetch('/api/chapters')
      if (chaptersRes.ok) {
        const data = await chaptersRes.json()
        setChapters(data)
      }

      // Load indexing jobs
      if (envEnabled) {
        const jobsRes = await fetch('/api/graphrag/index')
        if (jobsRes.ok) {
          const data = await jobsRes.json()
          setJobs(data.jobs || [])
        }

        // Load chapters that have entities (for question generation)
        const indexedRes = await fetch('/api/graphrag/indexed-chapters')
        if (indexedRes.ok) {
          const data = await indexedRes.json()
          setIndexedChapters(data.chapterIds || [])
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function triggerIndexing(chapterId: string) {
    // Cost warning for full indexing
    const confirmed = confirm(
      '⚠️ EXPENSIVE OPERATION WARNING ⚠️\n\n' +
      'This will process ALL chunks in this chapter using Claude API.\n\n' +
      'Estimated cost: $1-2 for ~800 chunks\n' +
      'Estimated time: 30-60 minutes\n\n' +
      'Are you SURE you want to proceed?\n\n' +
      'Click OK to proceed, or Cancel to stop.'
    )
    if (!confirmed) return

    try {
      const res = await fetch('/api/graphrag/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, mode: 'full' })
      })

      if (res.ok) {
        alert('✅ Indexing started! This will run in the background. Refresh the page to see progress.')
        loadData()
      } else {
        const data = await res.json()
        alert(`❌ Failed to start indexing: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to start indexing')
    }
  }

  async function triggerTestIndexing(chapterId: string) {
    // Prevent multiple clicks
    if (testingChapterId) {
      alert('Test indexing already in progress. Please wait...')
      return
    }

    // Cost warning
    const confirmed = confirm(
      '⚠️ COST WARNING ⚠️\n\n' +
      'This will process 10 chunks using Claude API.\n\n' +
      'Estimated cost: ~$0.35 per run\n\n' +
      'Click OK to proceed, or Cancel to stop.'
    )
    if (!confirmed) return

    setTestingChapterId(chapterId)
    try {
      const res = await fetch('/api/graphrag/index-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId })
      })

      if (res.ok) {
        const data = await res.json()
        alert(
          `✅ Test indexing completed!\n\nStats:\n- Chunks: ${data.stats.chunks_processed}\n- Entities: ${data.stats.entities_extracted}\n- Relationships: ${data.stats.relationships_extracted}`
        )
        loadData()
      } else {
        const data = await res.json()
        alert(`❌ Failed: ${data.error}\n\nDetails: ${data.details || 'No details available'}`)
      }
    } catch (error) {
      alert('❌ Failed to start test indexing')
    } finally {
      setTestingChapterId(null)
    }
  }

  async function loadTopicsForChapter(chapterId: string) {
    if (!chapterId) {
      setTopics([])
      setSelectedTopicId('')
      return
    }

    try {
      const res = await fetch(`/api/topics?chapterId=${chapterId}`)
      if (res.ok) {
        const data = await res.json()
        setTopics(data)
        // Auto-select first topic
        if (data.length > 0) {
          setSelectedTopicId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load topics:', error)
    }
  }

  async function generateGraphRAGQuestion() {
    if (!selectedChapterId) {
      alert('Please select a chapter first')
      return
    }

    if (!selectedTopicId) {
      alert('Please select a topic first')
      return
    }

    setGenerating(true)
    setGeneratedQuestion(null)

    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: selectedChapterId,
          topicId: selectedTopicId,
          bloomLevel,
          useGraphRAG: true
        })
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedQuestion(data)
      } else {
        const data = await res.json()
        alert(`Failed to generate question: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to generate question')
    } finally {
      setGenerating(false)
    }
  }

  function getJobStatus(chapterId: string) {
    const job = jobs.find(j => j.chapter_id === chapterId)
    if (!job) return null
    return job
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-green-400 text-sm">
            <CheckCircle size={16} />
            Completed
          </span>
        )
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 text-blue-400 text-sm">
            <Clock size={16} />
            Running...
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-red-400 text-sm">
            <XCircle size={16} />
            Failed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-yellow-400 text-sm">
            <Clock size={16} />
            Pending
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="neuro-btn text-gray-300 inline-flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-200">GraphRAG Management</h1>
          </div>
        </div>

        {/* Feature Status */}
        <div className="neuro-card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
              <GitBranch size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-200">Feature Status</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300 font-medium">GraphRAG Enabled</div>
                <div className="text-sm text-gray-500">
                  {enabled
                    ? 'GraphRAG is enabled. You can index chapters and test graph-based retrieval.'
                    : 'GraphRAG is disabled. Set NEXT_PUBLIC_ENABLE_GRAPH_RAG=true in .env.local to enable.'}
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  enabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700/20 text-gray-500'
                }`}
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            {!enabled && (
              <div className="neuro-inset p-4 rounded-lg">
                <div className="text-sm text-yellow-400 mb-2">To enable GraphRAG:</div>
                <code className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded block">
                  # In .env.local
                  <br />
                  NEXT_PUBLIC_ENABLE_GRAPH_RAG=true
                </code>
                <div className="text-xs text-gray-500 mt-2">
                  Then restart your dev server
                </div>
              </div>
            )}
          </div>
        </div>

        {enabled && (
          <>
            {/* RAG Mode Selection */}
            <div className="neuro-card mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">RAG Mode</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setMode('vector')}
                  className={`neuro-btn p-4 text-left ${
                    mode === 'vector' ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="text-gray-300 font-medium mb-1">Vector Only</div>
                  <div className="text-xs text-gray-500">
                    Current production RAG (fast, simple)
                  </div>
                </button>

                <button
                  onClick={() => setMode('graph')}
                  className={`neuro-btn p-4 text-left ${
                    mode === 'graph' ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="text-gray-300 font-medium mb-1">Graph Only</div>
                  <div className="text-xs text-gray-500">
                    GraphRAG only (experimental, better reasoning)
                  </div>
                </button>

                <button
                  onClick={() => setMode('hybrid')}
                  className={`neuro-btn p-4 text-left ${
                    mode === 'hybrid' ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="text-gray-300 font-medium mb-1">Hybrid</div>
                  <div className="text-xs text-gray-500">
                    Vector for Bloom 1-3, Graph for 4-6
                  </div>
                </button>

                <button
                  onClick={() => setMode('side-by-side')}
                  className={`neuro-btn p-4 text-left ${
                    mode === 'side-by-side' ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="text-gray-300 font-medium mb-1">Side-by-Side</div>
                  <div className="text-xs text-gray-500">
                    Compare both results (admin only)
                  </div>
                </button>
              </div>

              <div className="mt-4 p-4 neuro-inset rounded-lg">
                <div className="text-sm text-gray-400">
                  <strong className="text-blue-400">Current Mode:</strong> {mode}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Note: Mode selection is UI-only. To fully enable, update lib/config/features.ts
                </div>
              </div>
            </div>

            {/* Chapter Indexing */}
            <div className="neuro-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                  <Database size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Chapter Indexing
                </h2>
              </div>

              <div className="space-y-4">
                {chapters.length === 0 ? (
                  <div className="text-gray-500 text-sm">No chapters found</div>
                ) : (
                  chapters.map(chapter => {
                    const job = getJobStatus(chapter.id)

                    return (
                      <div
                        key={chapter.id}
                        className="neuro-inset p-4 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-gray-200 font-medium mb-1">
                            {chapter.name}
                          </div>
                          {job && (
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(job.status)}
                              </div>
                              {job.status === 'completed' && (
                                <div>
                                  Entities: {job.entities_extracted} | Relationships:{' '}
                                  {job.relationships_extracted}
                                </div>
                              )}
                              {job.status === 'running' && (
                                <div>
                                  Progress: {job.processed_chunks}/{job.total_chunks}{' '}
                                  chunks
                                </div>
                              )}
                              {job.status === 'failed' && (
                                <div className="text-red-400">
                                  Error: {job.error_message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => triggerTestIndexing(chapter.id)}
                            disabled={testingChapterId === chapter.id}
                            className="neuro-btn text-green-400 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Play size={18} />
                            {testingChapterId === chapter.id ? 'Testing...' : 'Test (10 chunks)'}
                          </button>
                          <button
                            onClick={() => triggerIndexing(chapter.id)}
                            disabled={job?.status === 'running'}
                            className="neuro-btn text-blue-400 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Play size={18} />
                            {job?.status === 'running' ? 'Indexing...' : 'Full Index'}
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* GraphRAG Question Generator */}
            <div className="neuro-card mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="neuro-inset w-12 h-12 rounded-xl flex items-center justify-center">
                  <GitBranch size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-200">
                  Test GraphRAG Question Generation
                </h2>
              </div>

              <div className="space-y-4">
                {/* Chapter Selection */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Select Indexed Chapter
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => {
                      const chapterId = e.target.value
                      setSelectedChapterId(chapterId)
                      loadTopicsForChapter(chapterId)
                    }}
                    className="neuro-input w-full"
                  >
                    <option value="">Choose a chapter...</option>
                    {chapters
                      .filter(ch => indexedChapters.includes(ch.id))
                      .map(chapter => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </option>
                      ))}
                  </select>
                  {chapters.filter(ch => indexedChapters.includes(ch.id)).length === 0 && (
                    <div className="text-sm text-yellow-400 mt-2">
                      No indexed chapters found. Run "Test (10 chunks)" on a chapter first.
                    </div>
                  )}
                </div>

                {/* Topic Selection */}
                {selectedChapterId && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Select Topic
                    </label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="neuro-input w-full"
                    >
                      <option value="">Choose a topic...</option>
                      {topics.map(topic => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Bloom Level Selection */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Bloom Level (GraphRAG works best at levels 4-6)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(level => (
                      <button
                        key={level}
                        onClick={() => setBloomLevel(level)}
                        className={`neuro-btn p-3 text-center ${
                          bloomLevel === level ? 'ring-2 ring-blue-400' : ''
                        }`}
                      >
                        <div className="text-gray-300 font-medium">Level {level}</div>
                        <div className="text-xs text-gray-500">
                          {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'][level - 1]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateGraphRAGQuestion}
                  disabled={generating || !selectedChapterId || !selectedTopicId}
                  className="neuro-btn text-blue-400 inline-flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={18} />
                  {generating ? 'Generating...' : 'Generate GraphRAG Question'}
                </button>

                {/* Generated Question Display */}
                {generatedQuestion && (
                  <div className="neuro-inset p-6 rounded-lg mt-6">
                    <div className="text-sm text-green-400 mb-3 font-medium">
                      ✅ Question Generated Successfully
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Question:</div>
                        <div className="text-gray-200">{generatedQuestion.question}</div>
                      </div>
                      {generatedQuestion.options && (
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Options:</div>
                          <div className="space-y-1">
                            {generatedQuestion.options.map((opt: string, idx: number) => (
                              <div
                                key={idx}
                                className={`p-2 rounded ${
                                  generatedQuestion.correctAnswer === opt
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-gray-800/50 text-gray-300'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}. {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {generatedQuestion.context && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Retrieved Context (from Knowledge Graph):
                          </div>
                          <div className="text-xs text-gray-400 bg-black/30 p-3 rounded max-h-40 overflow-y-auto">
                            {generatedQuestion.context}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
