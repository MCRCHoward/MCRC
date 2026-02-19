import { describe, expect, it } from 'vitest'
import { extractImageUrl, isoToDate, isoToTime, slugify } from '../eventFormUtils'

describe('eventFormUtils', () => {
  describe('isoToDate', () => {
    it('returns YYYY-MM-DD for valid ISO input', () => {
      expect(isoToDate('2026-02-18T15:45:00.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('returns empty string for invalid input', () => {
      expect(isoToDate('not-a-date')).toBe('')
      expect(isoToDate(undefined)).toBe('')
    })
  })

  describe('isoToTime', () => {
    it('returns HH:MM for valid ISO input', () => {
      expect(isoToTime('2026-02-18T15:45:00.000Z')).toMatch(/^\d{2}:\d{2}$/)
    })

    it('returns empty string for invalid input', () => {
      expect(isoToTime('not-a-date')).toBe('')
      expect(isoToTime(undefined)).toBe('')
    })
  })

  describe('extractImageUrl', () => {
    it('returns direct string URL', () => {
      expect(extractImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
    })

    it('returns url field when object has url', () => {
      expect(extractImageUrl({ url: 'https://example.com/obj.jpg' })).toBe(
        'https://example.com/obj.jpg',
      )
    })

    it('returns undefined for nullish inputs', () => {
      expect(extractImageUrl(undefined)).toBeUndefined()
      expect(extractImageUrl(null)).toBeUndefined()
    })
  })

  describe('slugify re-export', () => {
    it('normalizes mixed input into URL-safe slug', () => {
      expect(slugify('Community Workshop 2026!')).toBe('community-workshop-2026')
    })
  })
})
