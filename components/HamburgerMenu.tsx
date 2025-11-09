'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MenuIcon, LogOutIcon, UserIcon, SettingsIcon } from '@/components/icons'

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
    <div ref={menuRef} className="relative">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="neuro-btn p-3 flex items-center gap-2"
        aria-label="Menu"
      >
        <MenuIcon size={20} className="text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 neuro-card z-50">
          {/* User Info */}
          <div className="neuro-inset p-4 rounded-lg mb-3 flex items-center gap-3">
            <div className="neuro-inset w-10 h-10 rounded-full flex items-center justify-center">
              <UserIcon size={18} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">
                {userName}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <Link
            href="/admin"
            onClick={() => setIsOpen(false)}
            className="neuro-btn w-full flex items-center gap-3 px-4 py-3 text-blue-400 hover:text-blue-300 transition-colors mb-2"
          >
            <SettingsIcon size={18} />
            <span>Admin</span>
          </Link>

          <Link
            href="/rl-analytics"
            onClick={() => setIsOpen(false)}
            className="neuro-btn w-full flex items-center gap-3 px-4 py-3 text-purple-400 hover:text-purple-300 transition-colors mb-2"
          >
            <span className="text-lg">📊</span>
            <span>RL Analytics</span>
          </Link>

          <Link
            href="/audit"
            onClick={() => setIsOpen(false)}
            className="neuro-btn w-full flex items-center gap-3 px-4 py-3 text-yellow-400 hover:text-yellow-300 transition-colors mb-2"
          >
            <span className="text-lg">🔍</span>
            <span>Audit Log</span>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="neuro-btn w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOutIcon size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
