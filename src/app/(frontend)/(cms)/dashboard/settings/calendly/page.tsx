import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCalendlySettings, listCalendlyWebhooksAction } from '@/lib/actions/calendly-settings-actions'
import { getEventTypes } from '@/lib/calendly-service'
import { CalendlySettingsClient } from './CalendlySettingsClient'
import { requireRole } from '@/lib/custom-auth'
import { CheckCircle2, XCircle, Link2, Calendar } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CalendlySettingsPage() {
  await requireRole('admin') // Admin only

  const settings = await getCalendlySettings()
  const eventTypes = settings?.connected ? await getEventTypes() : []
  const webhooks = settings?.connected ? await listCalendlyWebhooksAction() : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calendly Settings</h1>
        <p className="text-muted-foreground">
          Manage Calendly OAuth connection and event type mappings
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Calendly OAuth connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.connected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-foreground">Connected</div>
                    <div className="text-sm text-muted-foreground">
                      Connected on {settings.connectedAt ? new Date(settings.connectedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <div className="font-medium text-foreground">Not Connected</div>
                    <div className="text-sm text-muted-foreground">
                      Connect your Calendly account to enable scheduling
                    </div>
                  </div>
                </>
              )}
              {settings?.environment && (
                <Badge variant="outline" className="ml-2">
                  {settings.environment === 'production' ? 'Production' : 'Sandbox'}
                </Badge>
              )}
            </div>
            <CalendlySettingsClient settings={settings} />
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      {settings?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Available Event Types</CardTitle>
            <CardDescription>
              Event types available in your Calendly account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No event types found. Make sure you have event types created in Calendly.
              </p>
            ) : (
              <div className="space-y-2">
                {eventTypes.map((eventType) => (
                  <div
                    key={eventType.uri}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">{eventType.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {eventType.duration} minutes • {eventType.kind}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {eventType.active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={eventType.scheduling_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <Link2 className="h-3 w-3" />
                          View
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Type Mappings */}
      {settings?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Event Type Mappings</CardTitle>
            <CardDescription>
              Map form types to Calendly event types (coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Event type mapping configuration will be available here. This allows you to
              configure which Calendly event type each form should use for scheduling.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Webhook Configuration */}
      {settings?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Manage Calendly webhook subscriptions for automatic event updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendlySettingsClient settings={settings} webhooks={webhooks} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

