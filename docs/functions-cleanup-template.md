# Cloud Function Template for Event Registration Cleanup

This function should be added to your Firebase Functions project.

## Setup Instructions

1. Initialize Firebase Functions in your project (if not already done):
   ```bash
   firebase init functions
   ```
   - Choose TypeScript

2. Add this function to `functions/src/index.ts`

3. Deploy the function:
   ```bash
   firebase deploy --only functions:cleanupEventRegistrations
   ```

## Function Code

```typescript
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Initialize Admin SDK (usually done in index.ts)
// admin.initializeApp()

/**
 * Cloud Function to cleanup event registrations when an event is deleted
 * 
 * Triggered when a document in the 'events' collection is deleted.
 * Automatically removes all associated registrations from the 'eventRegistrations' collection.
 */
export const cleanupEventRegistrations = functions.firestore
  .document('events/{eventId}')
  .onDelete(async (snap, context) => {
    const deletedEventId = context.params.eventId
    const functionsLogger = functions.logger

    try {
      // Query all registrations for the deleted event
      const registrationsSnapshot = await admin
        .firestore()
        .collection('eventRegistrations')
        .where('eventId', '==', deletedEventId)
        .get()

      if (registrationsSnapshot.empty) {
        functionsLogger.info(`No registrations found for deleted event: ${deletedEventId}`)
        return null
      }

      // Delete all matching registrations in batch
      const batch = admin.firestore().batch()
      let deleteCount = 0

      registrationsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
        deleteCount++
      })

      // Commit the batch deletion
      await batch.commit()

      functionsLogger.info(
        `Successfully deleted ${deleteCount} registration(s) for event: ${deletedEventId}`,
      )

      return { deletedCount: deleteCount, eventId: deletedEventId }
    } catch (error) {
      functionsLogger.error(
        `Error cleaning up registrations for event ${deletedEventId}:`,
        error,
      )
      throw error
    }
  })
```

