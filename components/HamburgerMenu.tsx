'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MenuIcon, LogOutIcon, UserIcon } from '@/components/icons'

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadUserData()

    // Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadUserData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Try to get full name from user metadata (Google OAuth provides this)
      const fullName = user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim()

      setUserName(fullName || user.email?.split('@')[0] || 'User')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
  return (
    <div className="relative z-50">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div ref={menuRef} className="relative z-50">
        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`neuro-btn p-3 flex items-center gap-2 transition-all duration-200 ${isOpen ? 'bg-white/5 text-blue-400' : 'text-gray-400'}`}
          aria-label="Menu"
        >
          <MenuIcon size={20} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-72 neuro-card origin-top-right animate-scale-in overflow-hidden shadow-2xl ring-1 ring-white/10">
            {/* User Info */}
            <div className="p-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="neuro-inset w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon size={18} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-200 truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    Signed in
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group"
              >
                <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <LogOutIcon size={18} />
                </div>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
  )
}
