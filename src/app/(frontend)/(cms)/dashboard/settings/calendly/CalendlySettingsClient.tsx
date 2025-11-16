'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  disconnectCalendly,
  createCalendlyWebhookAction,
  deleteCalendlyWebhookAction,
} from '@/lib/actions/calendly-settings-actions'
import type { CalendlySettings, CalendlyWebhookSubscription } from '@/types/calendly'
import { toast } from 'sonner'
import { Link2, X, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react'

interface CalendlySettingsClientProps {
  settings: CalendlySettings | null
  webhooks?: CalendlyWebhookSubscription[]
}

export function CalendlySettingsClient({
  settings,
  webhooks = [],
}: CalendlySettingsClientProps) {
  const router = useRouter()
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false)
  const [isDeletingWebhook, setIsDeletingWebhook] = useState<string | null>(null)

  const handleConnect = () => {
    // Redirect to authorize endpoint
    window.location.href = '/api/calendly/authorize'
  }

  const handleDisconnect = async () => {
    if (
      !confirm('Are you sure you want to disconnect Calendly? This will remove all stored tokens.')
    ) {
      return
    }

    setIsDisconnecting(true)
    try {
      await disconnectCalendly()
      toast.success('Calendly disconnected successfully')
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to disconnect Calendly'
      toast.error(errorMessage)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleCreateWebhook = async () => {
    setIsCreatingWebhook(true)
    try {
      const webhookUrl = '/api/calendly/webhook'
      const subscription = await createCalendlyWebhookAction(webhookUrl)
      if (subscription) {
        toast.success('Webhook created successfully')
        router.refresh()
      } else {
        toast.error(
          'Failed to create webhook. Check server logs for details. Make sure CALENDLY_PERSONAL_ACCESS_TOKEN is set and NEXT_PUBLIC_SERVER_URL is configured (use ngrok for local development).',
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create webhook'
      
      // Provide more helpful error messages
      if (errorMessage.includes('NEXT_PUBLIC_SERVER_URL')) {
        toast.error(
          'Webhook creation requires NEXT_PUBLIC_SERVER_URL. For local development, use ngrok: "ngrok http 3000" then set NEXT_PUBLIC_SERVER_URL to the ngrok URL.',
          { duration: 8000 },
        )
      } else if (errorMessage.includes('CALENDLY_PERSONAL_ACCESS_TOKEN')) {
        toast.error(
          'Personal Access Token not configured. Set CALENDLY_PERSONAL_ACCESS_TOKEN in your .env.local file.',
          { duration: 8000 },
        )
      } else if (errorMessage.includes('organization')) {
        toast.error(
          'Could not get organization information. Make sure your Personal Access Token has organization access.',
          { duration: 8000 },
        )
      } else {
        toast.error(errorMessage, { duration: 8000 })
      }
    } finally {
      setIsCreatingWebhook(false)
    }
  }

  const handleDeleteWebhook = async (webhookUri: string) => {
    if (!confirm('Are you sure you want to delete this webhook subscription?')) {
      return
    }

    setIsDeletingWebhook(webhookUri)
    try {
      const success = await deleteCalendlyWebhookAction(webhookUri)
      if (success) {
        toast.success('Webhook deleted successfully')
        router.refresh()
      } else {
        toast.error('Failed to delete webhook. Check server logs.')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete webhook'
      toast.error(errorMessage)
    } finally {
      setIsDeletingWebhook(null)
    }
  }

  // Connection status button
  if (!settings?.connected) {
    return (
      <Button variant="default" size="sm" onClick={handleConnect}>
        <Link2 className="h-4 w-4 mr-2" />
        Connect Calendly
      </Button>
    )
  }

  // Webhook management section
  const webhookUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://mcrchoward.org/api/calendly/webhook'
      : 'http://localhost:3000/api/calendly/webhook (use ngrok for testing)'

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-medium text-foreground">OAuth Connection</div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
        >
          <X className="h-4 w-4 mr-2" />
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        </Button>
      </div>

      {/* Webhook Section */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground">Webhook URL</div>
            <div className="text-sm text-muted-foreground font-mono mt-1">{webhookUrl}</div>
          </div>
          {webhooks.length > 0 ? (
            <Badge variant="default">Active ({webhooks.length})</Badge>
          ) : (
            <Badge variant="secondary">Not Configured</Badge>
          )}
        </div>

        {webhooks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Active Webhooks:</div>
            {webhooks.map((webhook) => (
              <div
                key={webhook.uri}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {webhook.callback_url}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Events: {webhook.events.join(', ')} • State: {webhook.state}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteWebhook(webhook.uri)}
                  disabled={isDeletingWebhook === webhook.uri}
                >
                  {isDeletingWebhook === webhook.uri ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateWebhook}
          disabled={isCreatingWebhook}
        >
          {isCreatingWebhook ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </>
          )}
        </Button>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Webhooks automatically update inquiry records when Calendly events occur (invitee created
            or canceled).
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium mb-1">
              Local Development Setup Required
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                For local testing, you need to expose your server using ngrok. Run{' '}
                <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">ngrok http 3000</code>{' '}
                and set <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">NEXT_PUBLIC_SERVER_URL</code> to the ngrok URL in your <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">.env.local</code> file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

