import * as admin from 'firebase-admin'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'

import { buildRegistrationSyncPayload, type EventData } from './registration-sync'

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const BATCH_SIZE = 500

/**
 * Sync denormalized registration fields when an event is updated.
 */
export const onEventUpdate = onDocumentUpdated(
  {
    document: 'events/{eventId}',
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const change = event.data
    const eventId = String(event.params.eventId ?? '')

    if (!change || !eventId) {
      return
    }

    const before = change.before.data() as EventData | undefined
    const after = change.after.data() as EventData | undefined

    if (!before || !after) {
      console.warn(`[onEventUpdate] Missing before/after data for event ${eventId}`)
      return
    }

    const syncResult = buildRegistrationSyncPayload(before, after)

    if (!syncResult.shouldSync || !syncResult.updates) {
      console.log(`[onEventUpdate] No sync needed for event ${eventId}`)
      return
    }

    console.log(`[onEventUpdate] Syncing registrations for event ${eventId}`, {
      updates: syncResult.updates,
    })

    const registrationsSnapshot = await db
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .get()

    if (registrationsSnapshot.empty) {
      console.log(`[onEventUpdate] No registrations to sync for event ${eventId}`)
      return
    }

    let updatedCount = 0
    const docs = registrationsSnapshot.docs

    for (let index = 0; index < docs.length; index += BATCH_SIZE) {
      const chunk = docs.slice(index, index + BATCH_SIZE)
      const batch = db.batch()

      for (const doc of chunk) {
        batch.update(doc.ref, syncResult.updates)
      }

      await batch.commit()
      updatedCount += chunk.length

      console.log(
        `[onEventUpdate] Batch ${Math.floor(index / BATCH_SIZE) + 1}: ` +
          `updated ${chunk.length} registrations`,
      )
    }

    console.log(`[onEventUpdate] Completed: synced ${updatedCount} registrations for event ${eventId}`)
  },
)
