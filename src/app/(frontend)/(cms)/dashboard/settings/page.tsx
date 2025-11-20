import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const settingsSections = [
  {
    title: 'Calendly Connections',
    description: 'Manage scheduling links and authentication for Calendly webhooks.',
    href: '/dashboard/settings/calendly',
  },
  {
    title: 'Monday Sync',
    description: 'Review Monday board configuration, API tokens, and sync health.',
    href: '/dashboard/settings/monday',
  },
]

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure integrations that power scheduling, automation, and reporting.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.href} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{section.title}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild>
                <Link href={section.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
