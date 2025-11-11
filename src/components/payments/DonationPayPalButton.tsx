'use client'

import { useEffect, useRef, useState } from 'react'
import { loadScript } from '@paypal/paypal-js'
import { toast } from 'sonner'
import { Loader2, Lock } from 'lucide-react'
import type { DonationInput } from '@/types/donation'
import { createPayPalDonationOrder, capturePayPalDonation } from '@/app/(frontend)/(default)/donate/donation-actions'
import { getPayPalConfig } from '@/lib/paypal-config'

interface DonationPayPalButtonProps {
  amount: number
  donationData: DonationInput
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function DonationPayPalButton({
  amount,
  donationData,
  onSuccess,
  onError,
}: DonationPayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const paypalButtonContainerRef = useRef<HTMLDivElement>(null)
  const paypalButtonsRef = useRef<{ render: (container: HTMLDivElement) => Promise<void> } | null>(null)

  useEffect(() => {
    let mounted = true

    async function initializePayPal() {
      try {
        // Get PayPal configuration
        const config = getPayPalConfig()

        // Load PayPal SDK
        const paypal = await loadScript({
          clientId: config.clientId,
          currency: (donationData.currency || 'USD').toUpperCase(),
        })

        if (!mounted || !paypalButtonContainerRef.current || !paypal || !paypal.Buttons) {
          return
        }

        // Render PayPal Smart Buttons
        paypalButtonsRef.current = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
          },
          createOrder: async () => {
            try {
              setIsProcessing(true)
              const { orderId } = await createPayPalDonationOrder(amount, donationData)
              return orderId
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Failed to create payment order. Please try again.'
              toast.error('Payment Error', {
                description: errorMessage,
                duration: 5000,
              })
              onError?.(error instanceof Error ? error : new Error(errorMessage))
              throw error
            } finally {
              setIsProcessing(false)
            }
          },
          onApprove: async (data: { orderID: string }) => {
            try {
              setIsProcessing(true)
              // capturePayPalDonation redirects, so this won't execute normally
              await capturePayPalDonation(data.orderID, donationData)
            } catch (error) {
              // Check if it's a redirect (Next.js redirect throws)
              if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                // Redirect is expected, let it happen
                return
              }
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Payment processing failed. Please try again or contact support.'
              toast.error('Payment Failed', {
                description: errorMessage,
                duration: 5000,
              })
              onError?.(error instanceof Error ? error : new Error(errorMessage))
            } finally {
              setIsProcessing(false)
            }
          },
          onCancel: () => {
            toast.info('Payment Cancelled', {
              description: 'You cancelled the payment. No charges were made.',
              duration: 3000,
            })
            setIsProcessing(false)
          },
          onError: (err: Record<string, unknown>) => {
            const errorMessage =
              (err.message as string) || (err.error as string) || 'An error occurred with PayPal. Please try again.'
            toast.error('Payment Error', {
              description: errorMessage,
              duration: 5000,
            })
            onError?.(new Error(errorMessage))
            setIsProcessing(false)
          },
        })

        if (paypalButtonContainerRef.current && paypalButtonsRef.current) {
          paypalButtonsRef.current.render(paypalButtonContainerRef.current).catch((err: Error) => {
            console.error('Error rendering PayPal buttons:', err)
            toast.error('Payment Error', {
              description: 'Failed to load payment buttons. Please refresh the page.',
              duration: 5000,
            })
          })
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing PayPal:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load payment system. Please try again.'
        toast.error('Payment System Error', {
          description: errorMessage,
          duration: 5000,
        })
        onError?.(error instanceof Error ? error : new Error(errorMessage))
        setIsLoading(false)
      }
    }

    initializePayPal()

    return () => {
      mounted = false
    }
  }, [amount, donationData, onSuccess, onError])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-sm text-muted-foreground">Loading payment options...</span>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="ml-2 text-sm">Processing payment...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <div ref={paypalButtonContainerRef} className="paypal-button-container" />
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden="true" />
        <span>Secure payment processing by PayPal</span>
      </div>
    </div>
  )
}

