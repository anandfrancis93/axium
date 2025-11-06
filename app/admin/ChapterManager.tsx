'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Subject = {
  id: string
  name: string
}

type Chapter = {
  id: string
  name: string
  description: string | null
  subject_id: string
  sequence_order: number
  subjects: { name: string }
}

export function ChapterManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [contentText, setContentText] = useState('')
  const [useTextInput, setUseTextInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSubjects()
    loadChapters()
  }, [])

  const loadSubjects = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error loading subjects:', error)
    } else {
      setSubjects(data || [])
    }
  }

  const loadChapters = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('chapters')
      .select(`
        *,
        subjects (name)
      `)
      .order('sequence_order')

    if (error) {
      console.error('Error loading chapters:', error)
      setMessage('Error loading chapters')
    } else {
      setChapters(data || [])
    }
  }

  const handleCreate = async () => {
    if (!selectedSubject || !name.trim()) {
      setMessage('Subject and chapter name are required')
      return
    }

    setLoading(true)
    setMessage('Creating chapter...')

    const supabase = createClient()

    // Get the next sequence order for this subject
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('sequence_order')
      .eq('subject_id', selectedSubject)
      .order('sequence_order', { ascending: false })
      .limit(1)

    const nextOrder = existingChapters && existingChapters.length > 0
      ? existingChapters[0].sequence_order + 1
      : 1

    const { data: newChapter, error } = await supabase
      .from('chapters')
      .insert({
        subject_id: selectedSubject,
        name: name.trim(),
        description: description.trim() || null,
        sequence_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating chapter:', error)
      setMessage(`Error: ${error.message}`)
      setLoading(false)
      return
    }

    // If content is provided (text or file), upload it
    if (contentText.trim() || file) {
      setMessage('Chapter created! Now processing content...')

      try {
        const formData = new FormData()

        if (contentText.trim()) {
          // Use text input
          formData.append('text', contentText.trim())
        } else if (file) {
          // Use file upload
          formData.append('file', file)
        }

        formData.append('chapter_id', newChapter.id)

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (response.ok) {
          setMessage(`Chapter created and content processed! Created ${result.chunks_created} chunks.`)
        } else {
          setMessage(`Chapter created but content processing failed: ${result.error}`)
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError)
        setMessage('Chapter created but content processing failed')
      }
    } else {
      setMessage('Chapter created successfully')
    }

    // Reset form
    setName('')
    setDescription('')
    setFile(null)
    setContentText('')
    setUseTextInput(false)
    const fileInput = document.getElementById('chapter-file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''

    loadChapters()
    setLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete chapter "${name}"? This will also delete all its topics and related data.`)) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting chapter:', error)
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Deleted chapter "${name}"`)
      loadChapters()
    }
  }

  return (
    <div className="space-y-4">
      {/* Create Form */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Subject *
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="neuro-input w-full"
            disabled={loading}
          >
            <option value="">Select a subject...</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {subjects.length === 0 && (
            <p className="text-xs text-yellow-400 mt-1">
              Create a subject first
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Chapter Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Data Structures"
            className="neuro-input w-full"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this chapter"
            className="neuro-input w-full"
            rows={2}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Add Content (optional)
          </label>

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setUseTextInput(false)
                setContentText('')
              }}
              className={`neuro-btn text-xs px-3 py-1 ${!useTextInput ? 'text-blue-400' : ''}`}
              disabled={loading}
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setUseTextInput(true)
                setFile(null)
              }}
              className={`neuro-btn text-xs px-3 py-1 ${useTextInput ? 'text-blue-400' : ''}`}
              disabled={loading}
            >
              Paste Text
            </button>
          </div>

          {!useTextInput ? (
            <>
              <input
                id="chapter-file-input"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const selectedFile = e.target.files[0]
                    if (selectedFile.type === 'application/pdf') {
                      setFile(selectedFile)
                    } else {
                      setFile(null)
                      setMessage('Please select a PDF file')
                    }
                  }
                }}
                disabled={loading}
                className="neuro-input w-full"
              />
              {file && (
                <p className="text-sm text-green-400 mt-1">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Note: PDF upload currently has issues in production. Use "Paste Text" instead.
              </p>
            </>
          ) : (
            <>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="Paste your content here (objectives, syllabus, study notes, etc.)"
                className="neuro-input w-full"
                rows={6}
                disabled={loading}
              />
              {contentText && (
                <p className="text-sm text-green-400 mt-1">
                  {contentText.length} characters
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Paste the text content from your PDFs or documents
              </p>
            </>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !selectedSubject || !name.trim()}
          className="neuro-btn w-full text-blue-400"
        >
          {loading ? 'Processing...' : (file || contentText) ? 'Create Chapter & Process Content' : 'Create Chapter'}
        </button>

        {message && (
          <div className={`neuro-inset p-3 rounded-lg text-sm ${
            message.startsWith('Error') || message.includes('failed') ? 'text-red-400' : 'text-green-400'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* List */}
      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Existing Chapters ({chapters.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-custom">
          {chapters.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No chapters yet. Create one above.
            </p>
          ) : (
            chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="neuro-raised p-3 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-200">
                      {chapter.name}
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      {chapter.subjects.name} • Order: {chapter.sequence_order}
                    </div>
                    {chapter.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {chapter.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(chapter.id, chapter.name)}
                    className="neuro-btn text-xs px-2 py-1 text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
