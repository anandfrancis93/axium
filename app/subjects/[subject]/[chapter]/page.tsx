import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChapterContent } from './ChapterContent'

export const dynamic = 'force-dynamic'

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ subject: string, chapter: string }>
}) {
  const { subject: subjectSlug, chapter: chapterSlug } = await params

  let subject: any = null
  let chapter: any = null
  let user: any = null

  try {
    const supabase = await createClient()
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData

    if (!user) {
      redirect('/login')
    }

    // Get subject details by slug
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name, slug, description')
      .eq('slug', subjectSlug)
      .single()

    if (!subjectData) {
      redirect('/subjects')
    }

    subject = subjectData

    // Get chapter details by slug and subject_id
    const { data: chapterData } = await supabase
      .from('chapters')
      .select('id, name, slug, description, created_at')
      .eq('slug', chapterSlug)
      .eq('subject_id', subject.id)
      .single()

    if (!chapterData) {
      redirect(`/subjects/${subjectSlug}`)
    }

    chapter = chapterData

  } catch (error) {
    console.error('Error loading chapter:', error)
    redirect('/subjects')
    return null
  }

  return <ChapterContent subject={subject} chapter={chapter} />
}
