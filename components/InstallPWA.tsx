'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }
  }

  if (!showInstallButton) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="neuro-card p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-200 mb-1">
            Install Axium
          </div>
          <div className="text-xs text-gray-400">
            Add to home screen for quick access
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInstallButton(false)}
            className="neuro-btn text-gray-400 px-3 py-2 text-sm"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="neuro-btn text-blue-400 px-4 py-2 text-sm font-medium"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
