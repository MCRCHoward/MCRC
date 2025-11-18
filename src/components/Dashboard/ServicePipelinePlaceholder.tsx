import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ServicePipelinePlaceholderProps {
  serviceName: string
  stageName: string
  description?: string
  children?: ReactNode
}

export function ServicePipelinePlaceholder({
  serviceName,
  stageName,
  description,
  children,
}: ServicePipelinePlaceholderProps) {
  const subtitle =
    description ??
    `We’re preparing the ${stageName.toLowerCase()} workflow for ${serviceName}. This page will surface the data and actions for this step of the pipeline.`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {serviceName} — {stageName}
        </h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Placeholder for the {serviceName} {stageName.toLowerCase()} experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children ?? (
            <p className="text-sm text-muted-foreground">
              We’ll connect the data, tasks, and automation for this pipeline step in the next phase.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ServicePipelinePlaceholderProps {
  serviceName: string
  stageName: string
  summary: string
  description: string
  nextSteps?: string
}

export function ServicePipelinePlaceholder({
  serviceName,
  stageName,
  summary,
  description,
  nextSteps,
}: ServicePipelinePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {serviceName} · {stageName}
        </h1>
        <p className="text-muted-foreground">{summary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>{`${stageName} experience`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{description}</p>
          {nextSteps ? <p className="text-foreground">{nextSteps}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

