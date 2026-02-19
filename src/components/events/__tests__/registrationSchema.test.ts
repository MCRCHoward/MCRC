import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {},
}))

vi.mock('@/lib/custom-auth', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/utilities/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue(true),
}))

const { registrationSchema } = await import('../EventRegistrationForm')

describe('registrationSchema (GDPR-compliant)', () => {
  const validBase = {
    name: 'Test User',
    email: 'test@example.com',
  }

  it('accepts minimal input (name + email only)', () => {
    const result = registrationSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('defaults emailMarketingConsent to false', () => {
    const result = registrationSchema.safeParse(validBase)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.emailMarketingConsent).toBe(false)
    }
  })

  it('defaults serviceInterest to None', () => {
    const result = registrationSchema.safeParse(validBase)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.serviceInterest).toBe('None')
    }
  })

  it('allows registration with consent set to false', () => {
    const result = registrationSchema.safeParse({
      ...validBase,
      emailMarketingConsent: false,
    })
    expect(result.success).toBe(true)
  })

  it('allows registration with consent set to true', () => {
    const result = registrationSchema.safeParse({
      ...validBase,
      emailMarketingConsent: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.emailMarketingConsent).toBe(true)
    }
  })

  it('allows registration without selecting a service interest', () => {
    const result = registrationSchema.safeParse(validBase)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.serviceInterest).toBe('None')
    }
  })

  it('accepts a specific service interest when provided', () => {
    const result = registrationSchema.safeParse({
      ...validBase,
      serviceInterest: 'Mediation',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.serviceInterest).toBe('Mediation')
    }
  })

  it('rejects invalid service interest values', () => {
    const result = registrationSchema.safeParse({
      ...validBase,
      serviceInterest: 'InvalidValue',
    })
    expect(result.success).toBe(false)
  })

  it('requires name', () => {
    const result = registrationSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(false)
  })

  it('requires email', () => {
    const result = registrationSchema.safeParse({ name: 'Test User' })
    expect(result.success).toBe(false)
  })

  it('validates email format', () => {
    const result = registrationSchema.safeParse({
      ...validBase,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional phone number', () => {
    const result = registrationSchema.safeParse({
      ...validBase,
      phone: '(123) 456-7890',
    })
    expect(result.success).toBe(true)
  })

  it('rejects phone with invalid characters', () => {
    const result = registrationSchema.safeParse({
      ...validBase,
      phone: 'abc-invalid',
    })
    expect(result.success).toBe(false)
  })
})
