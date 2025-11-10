import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginContent } from './LoginContent'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Check if user is already logged in
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect('/subjects')
    }
  } catch (error) {
    // If auth check fails, continue showing login page
    console.error('Error checking user auth on login page:', error)
  }

  return <LoginContent />
}
