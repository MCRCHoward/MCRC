/**
 * Admin SDK emulator setup for server-side integration tests.
 *
 * IMPORTANT: Call setEmulatorEnv() BEFORE importing firebase-admin modules
 * so the SDK auto-detects the emulator hosts.
 */

import { initializeApp, getApps, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

export const TEST_PROJECT_ID = 'demo-mcrc-test'

const EMULATOR_HOSTS = {
  firestore: '127.0.0.1:8080',
  auth: '127.0.0.1:9099',
} as const

let adminApp: App | null = null

/**
 * Set emulator environment variables.
 * Must be called before any firebase-admin imports in test files.
 */
export function setEmulatorEnv(): void {
  process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOSTS.firestore
  process.env.FIREBASE_AUTH_EMULATOR_HOST = EMULATOR_HOSTS.auth
  process.env.FIREBASE_ADMIN_PROJECT_ID = TEST_PROJECT_ID
  process.env.GCLOUD_PROJECT = TEST_PROJECT_ID
}

/**
 * Initialize Admin SDK for the emulator.
 * Returns Firestore and Auth instances.
 */
export function initializeAdminForEmulator(): { db: Firestore; auth: Auth } {
  setEmulatorEnv()

  if (getApps().length === 0) {
    adminApp = initializeApp({ projectId: TEST_PROJECT_ID })
  } else {
    adminApp = getApps()[0]!
  }

  return {
    db: getFirestore(adminApp),
    auth: getAuth(adminApp),
  }
}

/**
 * Clear all Firestore data via emulator REST API.
 */
export async function clearFirestoreData(): Promise<void> {
  const response = await fetch(
    `http://${EMULATOR_HOSTS.firestore}/emulator/v1/projects/${TEST_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )

  if (!response.ok) {
    throw new Error(`Failed to clear Firestore: ${response.statusText}`)
  }
}

/**
 * Create a test user in the Auth emulator.
 * Deletes existing user with the same UID first to ensure idempotency.
 */
export async function createTestUser(
  auth: Auth,
  email: string,
  uid?: string,
): Promise<{ uid: string }> {
  const targetUid = uid || `test-${Date.now()}`

  // Clean up existing user if present (emulator doesn't clear auth on Firestore wipe)
  try {
    await auth.deleteUser(targetUid)
  } catch {
    // User doesn't exist — that's fine
  }

  const userRecord = await auth.createUser({
    uid: targetUid,
    email,
    emailVerified: true,
  })
  return { uid: userRecord.uid }
}

/**
 * Set custom claims on a user in the Auth emulator.
 */
export async function setUserClaims(
  auth: Auth,
  uid: string,
  claims: Record<string, unknown>,
): Promise<void> {
  await auth.setCustomUserClaims(uid, claims)
}
