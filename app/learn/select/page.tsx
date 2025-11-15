/**
 * Topic Selection Page
 *
 * Select a topic and Bloom level to practice
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopicSelector from './TopicSelector'

export default async function SelectTopicPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch all subjects with chapters and topics
  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      chapters (
        id,
        name,
        chapter_order,
        topics (
          id,
          name,
          topic_order
        )
      )
    `)
    .order('name')

  // Fetch user progress
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('topic_id, current_bloom_level, mastery_scores')
    .eq('user_id', user.id)

  const progressMap = new Map(
    (userProgress || []).map(p => [p.topic_id, p])
  )

  return (
    <div className="min-h-screen neuro-container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-200 mb-2">Select a Topic to Practice</h1>
          <p className="text-gray-500">Choose a topic and Bloom level to start your learning session</p>
        </div>

        <TopicSelector
          subjects={subjects || []}
          progressMap={progressMap}
        />
      </div>
    </div>
  )
}
