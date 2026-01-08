export interface Participant {
  id: string
  age?: number
  gender?: string
  race?: string
  income?: string
  education?: string
  militaryStatus?: string
  notes?: string
  source?: {
    formType?: string
    inquiryPath?: string
    submittedAt?: string
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ParticipantInput {
  age?: number
  gender?: string
  race?: string
  income?: string
  education?: string
  militaryStatus?: string
  notes?: string
  source?: {
    formType?: string
    inquiryPath?: string
    submittedAt?: string
  }
}
