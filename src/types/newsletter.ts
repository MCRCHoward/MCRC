export interface NewsletterSubscriber {
  id: string
  email: string
  firstName?: string | null
  subscribedAt: string
  kitSubscriberId: number | null
  source: string
}

