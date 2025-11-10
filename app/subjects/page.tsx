import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubjectsContent } from './SubjectsContent'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let user: any = null
  let subjects: any[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (!user) {
      redirect('/login')
    }

    // Fetch all subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select(`
        id,
        name,
        slug,
        description,
        created_at,
        chapters (count)
      `)
      .order('created_at', { ascending: false })

    if (!subjectsError) {
      subjects = subjectsData || []
    }

  } catch (error) {
    console.error('Error loading dashboard:', error)
    redirect('/login')
    return null
  }

  return <SubjectsContent subjects={subjects} />
}
