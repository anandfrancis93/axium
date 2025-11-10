import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubjectContent } from './SubjectContent'

export const dynamic = 'force-dynamic'

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject: subjectSlug } = await params

  let subject: any = null
  let chapters: any[] = []
  let user: any = null

  try {
    const supabase = await createClient()
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData

    if (!user) {
      redirect('/login')
    }

    // Get subject details by slug
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', subjectSlug)
      .single()

    if (subjectError || !subjectData) {
      redirect('/subjects')
    }

    subject = subjectData

    // Get chapters for this subject
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select(`
        id,
        name,
        slug,
        description,
        created_at,
        questions (count)
      `)
      .eq('subject_id', subject.id)
      .order('created_at', { ascending: true })

    chapters = chaptersData || []

  } catch (error) {
    console.error('Error loading subject:', error)
    redirect('/subjects')
    return null
  }

  return <SubjectContent subject={subject} chapters={chapters} />
}
