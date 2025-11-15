import type { Metadata } from 'next'
import Script from 'next/script'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { cn } from '@/utilities/ui'
import { InitTheme } from '../../providers/Theme/InitTheme/index'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { GoogleAnalytics } from '@next/third-parties/google'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async`}
            strategy="lazyOnload"
            id="google-maps-script"
            // Note: Next.js Script component handles async loading via strategy="lazyOnload"
            // The &loading=async parameter is a Google Maps API parameter for optimal loading
          />
        )}
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
        <Analytics />
        {gaMeasurementId && <GoogleAnalytics gaId={gaMeasurementId} />}
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@mcrc',
  },
}
