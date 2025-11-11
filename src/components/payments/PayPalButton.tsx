'use client'

import { useEffect, useRef, useState } from 'react'
import { loadScript } from '@paypal/paypal-js'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { EventRegistrationInput } from '@/types/event-registration'
import { createPayPalOrder, capturePayPalOrder } from '@/app/(frontend)/(default)/events/[slug]/paypal-actions'
import { getPayPalConfig } from '@/lib/paypal-config'

interface PayPalButtonProps {
  eventId: string
  registrationData: EventRegistrationInput
  amount: number // Used for display/validation, passed to PayPal SDK
  currency: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function PayPalButton({
  eventId,
  registrationData,
  amount: _amount, // Used for display/validation, passed to PayPal SDK
  currency,
  onSuccess,
  onError,
}: PayPalButtonProps) {
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
          currency: currency.toUpperCase(),
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
              const { orderId } = await createPayPalOrder(eventId, registrationData)
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
              await capturePayPalOrder(data.orderID, eventId, registrationData)

              toast.success('Payment Successful!', {
                description: 'Your registration has been confirmed.',
                duration: 5000,
              })

              onSuccess?.()
            } catch (error) {
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
  }, [eventId, registrationData, currency, onSuccess, onError])

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
    <div className="w-full">
      <div ref={paypalButtonContainerRef} className="paypal-button-container" />
    </div>
  )
}

