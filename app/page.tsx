import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/subjects')
    } else {
      redirect('/login')
    }
  } catch (error) {
    console.error('Error in root page:', error)
    // If auth check fails, redirect to login
    redirect('/login')
  }
}
