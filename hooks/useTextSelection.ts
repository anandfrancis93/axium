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
    const handleSelection = () => {
      const selectedText = window.getSelection()?.toString().trim()

      if (selectedText && selectedText.length > 0) {
        const range = window.getSelection()?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()

        if (rect) {
          setSelection({
            text: selectedText,
            x: rect.left + rect.width / 2, // Center of selection
            y: rect.top - 10, // Slightly above selection
          })
        }
      } else {
        setSelection(null)
      }
    }

    // Listen for selection changes
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)

    return () => {
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
