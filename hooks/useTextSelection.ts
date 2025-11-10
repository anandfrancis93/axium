import { useState, useEffect } from 'react'

export interface TextSelection {
  text: string
  x: number
  y: number
}

/**
 * Hook to detect text selection and get position for floating toolbar
 */
export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelection | null>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleSelection = () => {
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId)

      // On mobile, selection might not be ready immediately
      // Add a small delay to ensure selection is finalized
      timeoutId = setTimeout(() => {
        const selectedText = window.getSelection()?.toString().trim()

        if (selectedText && selectedText.length > 0) {
          const range = window.getSelection()?.getRangeAt(0)
          const rect = range?.getBoundingClientRect()

          if (rect) {
            // On mobile, position below selection to avoid native UI conflict
            // On desktop, position above
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

            setSelection({
              text: selectedText,
              x: rect.left + rect.width / 2, // Center of selection
              y: isMobile ? rect.bottom + 10 : rect.top - 10, // Below on mobile, above on desktop
            })
          }
        } else {
          setSelection(null)
        }
      }, 100) // 100ms delay for mobile selection to finalize
    }

    // Listen for selection changes
    // selectionchange works better for mobile
    document.addEventListener('selectionchange', handleSelection)
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      document.removeEventListener('selectionchange', handleSelection)
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
    }
  }, [])

  const clearSelection = () => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  return { selection, clearSelection }
}
