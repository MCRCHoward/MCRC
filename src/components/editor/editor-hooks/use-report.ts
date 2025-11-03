import { useCallback } from 'react'

export function useReport(): (arg0: string) => void {
  return useCallback((content: string) => {
    // Only log to console, no visual feedback
    console.log(content)
  }, [])
}
