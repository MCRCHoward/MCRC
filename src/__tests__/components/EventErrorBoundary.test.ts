import { describe, it, expect } from 'vitest'
import { contextConfig } from '@/components/events/EventErrorBoundary'

describe('EventErrorBoundary contextConfig', () => {
  const expectedContexts = [
    'list',
    'detail',
    'registration',
    'form',
    'registrations',
  ] as const

  it('defines all expected error contexts', () => {
    for (const ctx of expectedContexts) {
      expect(contextConfig[ctx]).toBeDefined()
    }
  })

  it('each context has required fields', () => {
    for (const ctx of expectedContexts) {
      const config = contextConfig[ctx]
      expect(config.title).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.backLink).toMatch(/^\//)
      expect(config.backLabel).toBeTruthy()
    }
  })

  it('list context links to homepage', () => {
    expect(contextConfig.list.title).toBe('Unable to load events')
    expect(contextConfig.list.backLink).toBe('/')
    expect(contextConfig.list.backLabel).toBe('Go to Homepage')
  })

  it('detail context links to events list', () => {
    expect(contextConfig.detail.title).toBe('Unable to load event')
    expect(contextConfig.detail.backLink).toBe('/events')
    expect(contextConfig.detail.backLabel).toBe('Back to Events')
  })

  it('registration context links to events list', () => {
    expect(contextConfig.registration.title).toBe('Registration error')
    expect(contextConfig.registration.backLink).toBe('/events')
  })

  it('form context links to CMS events list', () => {
    expect(contextConfig.form.title).toBe('Form error')
    expect(contextConfig.form.backLink).toBe('/dashboard/events')
    expect(contextConfig.form.backLabel).toBe('Back to Events List')
  })

  it('registrations context links to CMS events list', () => {
    expect(contextConfig.registrations.title).toBe('Unable to load registrations')
    expect(contextConfig.registrations.backLink).toBe('/dashboard/events')
    expect(contextConfig.registrations.backLabel).toBe('Back to Events List')
  })

  it('public contexts use public routes, CMS contexts use dashboard routes', () => {
    expect(contextConfig.list.backLink).not.toContain('dashboard')
    expect(contextConfig.detail.backLink).not.toContain('dashboard')
    expect(contextConfig.registration.backLink).not.toContain('dashboard')
    expect(contextConfig.form.backLink).toContain('dashboard')
    expect(contextConfig.registrations.backLink).toContain('dashboard')
  })
})
