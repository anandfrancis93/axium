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
  subject_id: string
}

export function DocumentUpload() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadChapters(selectedSubject)
    } else {
      setChapters([])
      setSelectedChapter('')
    }
  }, [selectedSubject])

  const loadSubjects = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error loading subjects:', error)
      setMessage('Error loading subjects')
    } else {
      setSubjects(data || [])
    }
  }

  const loadChapters = async (subjectId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('chapters')
      .select('id, name, subject_id')
      .eq('subject_id', subjectId)
      .order('sequence_order')

    if (error) {
      console.error('Error loading chapters:', error)
      setMessage('Error loading chapters')
    } else {
      setChapters(data || [])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setMessage('')
      } else {
        setFile(null)
        setMessage('Please select a PDF file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !selectedChapter) {
      setMessage('Please select a chapter and file')
      return
    }

    setUploading(true)
    setMessage('Processing document... This may take a minute.')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('chapter_id', selectedChapter)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`✅ Success! Processed ${result.chunks_created} chunks from ${file.name}`)
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setMessage(`❌ Error: ${result.error || 'Failed to process document'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage('❌ Error uploading document')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Subject Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          1. Select Subject
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="neuro-input w-full"
          disabled={uploading}
        >
          <option value="">Choose a subject...</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        {subjects.length === 0 && (
          <p className="text-sm text-yellow-400 mt-1">
            No subjects found. You need to create subjects first.
          </p>
        )}
      </div>

      {/* Chapter Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          2. Select Chapter
        </label>
        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className="neuro-input w-full"
          disabled={!selectedSubject || uploading}
        >
          <option value="">Choose a chapter...</option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
        {selectedSubject && chapters.length === 0 && (
          <p className="text-sm text-yellow-400 mt-1">
            No chapters found. You need to create chapters for this subject first.
          </p>
        )}
      </div>

      {/* File Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          3. Select PDF File
        </label>
        <input
          id="file-input"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={!selectedChapter || uploading}
          className="neuro-input w-full"
        />
        {file && (
          <p className="text-sm text-green-400 mt-1">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || !selectedChapter || uploading}
        className={`neuro-btn-primary w-full ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {uploading ? 'Processing...' : 'Upload & Process Document'}
      </button>

      {/* Status Message */}
      {message && (
        <div className={`neuro-inset p-4 rounded-lg ${
          message.includes('✅') ? 'border-l-4 border-green-400' :
          message.includes('❌') ? 'border-l-4 border-red-400' :
          'border-l-4 border-yellow-400'
        }`}>
          <p className="text-sm text-gray-300">{message}</p>
        </div>
      )}
    </div>
  )
}
