/**
 * Google Analytics Event Tracking Utilities
 *
 * Provides helper functions for tracking custom events in Google Analytics 4.
 * Uses @next/third-parties/google for optimized event tracking.
 */

'use client'

import { sendGAEvent } from '@next/third-parties/google'

/**
 * Track a custom event in Google Analytics
 *
 * @param eventName - The name of the event (e.g., 'button_click', 'form_submit')
 * @param eventParams - Additional event parameters
 *
 * @example
 * trackEvent('form_submit', {
 *   form_type: 'mediation-self-referral',
 *   form_location: 'services/mediation/request'
 * })
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    category?: string
    label?: string
    value?: number
    [key: string]: string | number | boolean | undefined
  },
) {
  try {
    sendGAEvent('event', eventName, {
      ...eventParams,
    })
  } catch (_error) {
    // Silently fail in development or if GA is not available
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event tracked:', eventName, eventParams)
    }
  }
}

/**
 * Track form submission events
 */
export function trackFormSubmit(formType: string, formLocation?: string) {
  trackEvent('form_submit', {
    category: 'form',
    form_type: formType,
    form_location: formLocation || window.location.pathname,
  })
}

/**
 * Track button click events
 */
export function trackButtonClick(buttonLabel: string, buttonLocation?: string) {
  trackEvent('button_click', {
    category: 'engagement',
    label: buttonLabel,
    button_location: buttonLocation || window.location.pathname,
  })
}

/**
 * Track link click events (external links)
 */
export function trackLinkClick(url: string, linkText?: string) {
  trackEvent('link_click', {
    category: 'outbound',
    label: linkText || url,
    link_url: url,
  })
}

/**
 * Track file download events
 */
export function trackFileDownload(fileName: string, fileType?: string) {
  trackEvent('file_download', {
    category: 'download',
    label: fileName,
    file_type: fileType,
  })
}

/**
 * Track search events
 */
export function trackSearch(searchTerm: string, resultCount?: number) {
  trackEvent('search', {
    category: 'search',
    label: searchTerm,
    value: resultCount,
  })
}

/**
 * Track video play events
 */
export function trackVideoPlay(videoTitle: string, videoDuration?: number) {
  trackEvent('video_play', {
    category: 'video',
    label: videoTitle,
    video_duration: videoDuration,
  })
}

/**
 * Track donation events
 */
export function trackDonation(amount: number, donationType?: string) {
  trackEvent('donation', {
    category: 'donation',
    value: amount,
    donation_type: donationType,
  })
}

/**
 * Track service inquiry events
 */
export function trackServiceInquiry(serviceType: string, inquiryMethod?: string) {
  trackEvent('service_inquiry', {
    category: 'service',
    service_type: serviceType,
    inquiry_method: inquiryMethod,
  })
}

