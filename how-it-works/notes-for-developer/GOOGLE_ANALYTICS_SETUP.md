# Google Analytics Setup for Next.js 15

This guide covers setting up Google Analytics 4 (GA4) in Next.js 15 using industry-standard best practices.

## Prerequisites

- Google Analytics 4 property created in [Google Analytics](https://analytics.google.com/)
- Your GA4 Measurement ID (format: `G-XXXXXXXXXX`)

## Method 1: Using Next.js Third-Party Scripts (Recommended)

Next.js 15 includes built-in support for Google Analytics via the `@next/third-parties` package, which provides optimized loading and better performance.

### Step 1: Install the Package

```bash
pnpm add @next/third-parties
```

### Step 2: Add Your Measurement ID to Environment Variables: Complete

Add to your `.env.local` file:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GA_STREAM_ID=
```

### Step 3: Add Google Analytics to Your Root Layout

Update `src/app/(frontend)/layout.tsx`:

```tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Your existing content */}
        {children}
        
        {/* Add Google Analytics */}
        {gaMeasurementId && <GoogleAnalytics gaId={gaMeasurementId} />}
      </body>
    </html>
  )
}
```

### Benefits of This Method

- ✅ Automatic script optimization
- ✅ Built-in consent management support
- ✅ Better Core Web Vitals
- ✅ TypeScript support
- ✅ Works with Next.js App Router


## Best Practices

### 1. Environment Variables

Always use environment variables for your Measurement ID:

```env
# .env.local (local development)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# .env.production (production)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YYYYYYYYYY
```

### 2. Consent Management

For GDPR compliance, implement consent management:

```tsx
'use client'

import { useEffect, useState } from 'react'

export function GoogleAnalyticsWithConsent() {
  const [consent, setConsent] = useState<boolean | null>(null)

  useEffect(() => {
    // Check for existing consent
    const hasConsent = localStorage.getItem('analytics-consent') === 'true'
    setConsent(hasConsent)
  }, [])

  if (consent === null || !consent) {
    return null // Don't load GA until consent is given
  }

  return <GoogleAnalytics />
}
```

### 3. Development Mode

Disable GA in development:

```tsx
const GA_MEASUREMENT_ID = 
  process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID 
    : undefined
```

### 4. Performance Optimization

- Use `strategy="afterInteractive"` for GA scripts (loads after page becomes interactive)
- Consider using `strategy="lazyOnload"` for non-critical analytics
- Use `@next/third-parties` for automatic optimization

## Verification

1. **Real-time Reports**: Go to Google Analytics → Reports → Realtime
2. **Browser DevTools**: Check Network tab for requests to `google-analytics.com`
3. **Google Tag Assistant**: Install the Chrome extension to verify tags

## Recommended Approach

For Next.js 15, we recommend **Method 1** (`@next/third-parties`) because:

- ✅ Official Next.js support
- ✅ Automatic optimization
- ✅ Better performance
- ✅ TypeScript support
- ✅ Future-proof

## Additional Resources

- [Next.js Third-Party Scripts Documentation](https://nextjs.org/docs/app/api-reference/components/third-parties)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)

