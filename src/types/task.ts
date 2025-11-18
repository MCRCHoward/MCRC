import type { ServiceArea } from '@/lib/service-area-config'

export type TaskStatus = 'pending' | 'done'
export type TaskType = 'new-inquiry' | 'intake-call' | 'follow-up' | 'review-evals'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  serviceArea: ServiceArea
  inquiryId: string
  link: string
  assignedTo: string
  createdAt: string
  due?: string | null
  completedAt?: string | null
}
