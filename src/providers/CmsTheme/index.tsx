'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type CmsTheme = 'light' | 'dark'

const CMS_THEME_STORAGE_KEY = 'cms-theme'
const DEFAULT_THEME: CmsTheme = 'light'

interface CmsThemeContextType {
  theme: CmsTheme
  setTheme: (theme: CmsTheme) => void
}

const CmsThemeContext = createContext<CmsThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
})

export function CmsThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<CmsTheme>(DEFAULT_THEME)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CMS_THEME_STORAGE_KEY)
    const initialTheme: CmsTheme = stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME
    setThemeState(initialTheme)
  }, [])

  const setTheme = (newTheme: CmsTheme) => {
    setThemeState(newTheme)
    localStorage.setItem(CMS_THEME_STORAGE_KEY, newTheme)
  }

  return <CmsThemeContext.Provider value={{ theme, setTheme }}>{children}</CmsThemeContext.Provider>
}

export function useCmsTheme(): CmsThemeContextType {
  const context = useContext(CmsThemeContext)
  if (!context) {
    throw new Error('useCmsTheme must be used within CmsThemeProvider')
  }
  return context
}

