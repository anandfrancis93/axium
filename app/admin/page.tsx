import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HamburgerMenu from '@/components/HamburgerMenu'
import { AdminContent } from './AdminContent'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  let user = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (!user) {
      redirect('/login')
    }
  } catch (error) {
    console.error('Error checking user auth on admin page:', error)
    redirect('/login')
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="neuro-container mx-4 my-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0 flex-shrink">
              <h1 className="text-2xl font-bold text-blue-400">Admin Panel</h1>
              <div className="text-sm text-gray-500">Content Management</div>
            </div>
            <div className="flex-shrink-0">
              <HamburgerMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <AdminContent />
    </div>
  )
}
