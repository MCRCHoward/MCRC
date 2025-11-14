'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { RoadmapItem, Recommendation } from '@/types'
import RoadmapTimeline from '@/components/Dashboard/RoadmapTimeline'
import RecommendationGrid from '@/components/Dashboard/RecommendationGrid'
import SubmitRecommendationModal from '@/components/Dashboard/SubmitRecommendationModal'
import CreateRoadmapItemModal from '@/components/Dashboard/CreateRoadmapItemModal'

interface RoadmapClientProps {
  roadmapItems: RoadmapItem[]
  recommendations: Recommendation[]
  isAdmin: boolean
  currentUserId?: string
}

export default function RoadmapClient({
  roadmapItems,
  recommendations,
  isAdmin,
  currentUserId,
}: RoadmapClientProps) {
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Developer Roadmap</h1>
          <p className="text-muted-foreground">
            View upcoming features and submit your recommendations
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Roadmap Item
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowSubmitModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Recommendation
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Timeline</h2>
          <RoadmapTimeline items={roadmapItems} isAdmin={isAdmin} />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Recommendations</h2>
          <RecommendationGrid
            recommendations={recommendations}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        </section>
      </div>

      <SubmitRecommendationModal open={showSubmitModal} onOpenChange={setShowSubmitModal} />

      {isAdmin && (
        <CreateRoadmapItemModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      )}
    </div>
  )
}
