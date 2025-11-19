import { describe, expect, it, vi, afterEach } from 'vitest'
import { createInsightlyLead } from '../client'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe('createInsightlyLead', () => {
  it('posts payload to Insightly API', async () => {
    process.env.INSIGHTLY_API_URL = 'https://api.test-insightly.com/v3.1'
    process.env.INSIGHTLY_API_KEY = 'test-key'

    const mockResponse = { LEAD_ID: 42 }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createInsightlyLead({ LAST_NAME: 'Doe' })

    expect(result).toEqual(mockResponse)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test-insightly.com/v3.1/Leads',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    )
  })
})

