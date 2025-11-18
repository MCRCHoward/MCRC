'use client'

import { useEffect } from 'react'

interface CalendlyWidgetProps {
  calendlyUrl: string
  height?: number
}

export function CalendlyWidget({ calendlyUrl, height = 760 }: CalendlyWidgetProps) {
  useEffect(() => {
    const scriptSrc = 'https://assets.calendly.com/assets/external/widget.js'
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`)

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = scriptSrc
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      // Keep script for future navigations; no cleanup necessary
    }
  }, [])

  return (
    <div
      className="calendly-inline-widget w-full"
      data-url={calendlyUrl}
      style={{ minWidth: '320px', height }}
    />
  )
}
