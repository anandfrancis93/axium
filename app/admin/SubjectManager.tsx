'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Subject = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading subjects:', error)
      setMessage('Error loading subjects')
    } else {
      setSubjects(data || [])
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setMessage('Subject name is required')
      return
    }

    setLoading(true)
    setMessage('')

    // Generate slug from name
    const slug = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const supabase = createClient()
    const { error } = await supabase
      .from('subjects')
      .insert({
        name: name.trim(),
        slug,
        description: description.trim() || null,
      })

    if (error) {
      console.error('Error creating subject:', error)
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Subject created successfully')
      setName('')
      setDescription('')
      loadSubjects()
    }

    setLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"? This will also delete all its chapters and related data.`)) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting subject:', error)
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Deleted subject "${name}"`)
      loadSubjects()
    }
  }

  return (
    <div className="space-y-4">
      {/* Create Form */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Subject Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Computer Science"
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
            placeholder="Brief description of this subject"
            className="neuro-input w-full"
            rows={2}
            disabled={loading}
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="neuro-btn w-full text-blue-400"
        >
          {loading ? 'Creating...' : 'Create Subject'}
        </button>

        {message && (
          <div className={`neuro-inset p-3 rounded-lg text-sm ${
            message.startsWith('Error') ? 'text-red-400' : 'text-green-400'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* List */}
      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Existing Subjects ({subjects.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-custom">
          {subjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No subjects yet. Create one above.
            </p>
          ) : (
            subjects.map((subject) => (
              <div
                key={subject.id}
                className="neuro-raised p-3 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-200">
                      {subject.name}
                    </div>
                    {subject.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {subject.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(subject.id, subject.name)}
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
