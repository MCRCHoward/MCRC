import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function MondaySettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Monday Sync</h1>
        <p className="text-muted-foreground">
          Review the board, group, and column IDs powering the master checklist. These values are
          loaded from environment variables so you can adjust them without redeploying the CMS UI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Update the following env vars in Vercel/Firebase to change where new items are created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul className="space-y-2">
            <li>
              <Badge variant="outline" className="mr-2">
                MONDAY_MASTER_BOARD_ID
              </Badge>
              ID of the &ldquo;MCRC – Master Referrals&rdquo; board.
            </li>
            <li>
              <Badge variant="outline" className="mr-2">
                MONDAY_GROUP_MEDIATION_REFERRALS
              </Badge>
              Group for self-referral / mediation cases.
            </li>
            <li>
              <Badge variant="outline" className="mr-2">
                MONDAY_GROUP_RESTORATIVE_REFERRALS
              </Badge>
              Group for restorative program referrals.
            </li>
            <li>
              <Badge variant="outline" className="mr-2">
                MONDAY_API
              </Badge>
              Personal access token used by the CMS server actions.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Need help locating column IDs or assignee IDs? See the{' '}
            <Link
              href="/how-it-works/notes-for-developer/MondayIntergrationGuide"
              className="text-primary hover:underline"
            >
              Monday Integration Guide
            </Link>{' '}
            for a walkthrough.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


