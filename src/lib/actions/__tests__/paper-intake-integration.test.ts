import { describe, it } from 'vitest'

describe.skip('Paper Intake Integration', () => {
  it('should create a paper intake end-to-end', async () => {
    // 1. Check for duplicates
    // 2. Create paper intake
    // 3. Verify Firestore document
    // 4. Verify Insightly Lead created
    // 5. Verify Insightly Case created
    // 6. Verify Lead-Case link
  })

  it('should link to existing lead instead of creating new', async () => {
    // Test the "link to existing" flow
  })

  it('should handle Insightly API errors gracefully', async () => {
    // Test error handling and retry logic
  })

  it('should retry failed sync', async () => {
    // Test retrySyncPaperIntake
  })
})
