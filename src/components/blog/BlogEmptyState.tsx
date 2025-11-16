import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export function BlogEmptyState() {
  return (
    <EmptyState
      icon={<FileText className="h-16 w-16" strokeWidth={1} />}
      title="No blog posts yet"
      description="Check back soon for insights about mediation and conflict resolution."
    />
  )
}

