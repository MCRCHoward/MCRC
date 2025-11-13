export type RoadmapItemType = 'Feature' | 'Bug' | 'Enhancement'

export type RecommendationStatus = 'pending' | 'accepted' | 'deleted'

export interface RoadmapItem {
  id: string
  version: string
  type: RoadmapItemType
  title: string
  description: string
  date: string // ISO timestamp
  createdAt: string // ISO timestamp
  createdBy: string // User ID
  order: number // For sorting
}

export interface Recommendation {
  id: string
  title: string
  description: string
  submittedBy: string // User ID
  submittedByName: string // User name for display
  submittedAt: string // ISO timestamp
  status: RecommendationStatus
  acceptedAt?: string // ISO timestamp (when accepted)
  acceptedBy?: string // Admin user ID
  order: number // Display order in grid
}

export interface RoadmapItemInput {
  version: string
  type: RoadmapItemType
  title: string
  description: string
  date: string // ISO timestamp
}

export interface RecommendationInput {
  title: string
  description: string
}

