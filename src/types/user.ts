export interface UserBlogPost {
  id: string
  title: string
  heroImage?: string
  slug: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'coordinator' | 'mediator' | 'participant' | 'volunteer'
  createdAt: string
  updatedAt: string
  blogPosts?: UserBlogPost[] // Array of blog posts created by this user
}

export interface UserInput {
  email: string
  name: string
  role: 'admin' | 'editor' | 'coordinator' | 'mediator' | 'participant' | 'volunteer'
  password?: string
}

// admin — full system control; can manage users, roles, content, and settings.

// coordinator — operations lead; reviews intakes, assigns mediators, schedules sessions, manages cases.

// mediator — volunteer mediator; manages their profile/availability and sees only cases they’re assigned to.

// volunteer — non-mediator volunteer (e.g., outreach/training support); very limited internal access.

// participant (default) — service recipient; limited, case-scoped access (e.g., session info).
