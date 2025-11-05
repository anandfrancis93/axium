'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOutIcon } from '@/components/icons'

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="neuro-btn px-6 py-2 text-sm font-medium flex items-center gap-2"
    >
      <LogOutIcon size={16} />
      <span>Sign Out</span>
    </button>
  )
}
