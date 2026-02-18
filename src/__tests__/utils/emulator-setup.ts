import { initializeApp, getApps, deleteApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'

/**
 * Emulator port configuration — must match firebase.json emulators block.
 */
export const EMULATOR_CONFIG = {
  firestore: {
    host: '127.0.0.1',
    port: 8080,
  },
  auth: {
    host: '127.0.0.1',
    port: 9099,
  },
} as const

/**
 * Test project config.
 * Uses "demo-" prefix so the emulator doesn't attempt to contact real GCP.
 */
export const TEST_FIREBASE_CONFIG = {
  projectId: 'demo-mcrc-test',
  apiKey: 'fake-api-key',
  authDomain: 'demo-mcrc-test.firebaseapp.com',
} as const

let testApp: FirebaseApp | null = null
let testDb: Firestore | null = null
let testAuth: Auth | null = null

/**
 * Initialize Firebase Client SDK for integration tests with emulator.
 */
export function initializeTestFirebase(): { db: Firestore; auth: Auth } {
  const existingApps = getApps()
  if (existingApps.length > 0) {
    existingApps.forEach((app) => deleteApp(app))
  }

  testApp = initializeApp(TEST_FIREBASE_CONFIG, 'test-app')
  testDb = getFirestore(testApp)
  testAuth = getAuth(testApp)

  connectFirestoreEmulator(testDb, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port)
  connectAuthEmulator(testAuth, `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`)

  return { db: testDb, auth: testAuth }
}

/**
 * Clean up test Firebase instance.
 */
export async function cleanupTestFirebase(): Promise<void> {
  if (testApp) {
    await deleteApp(testApp)
    testApp = null
    testDb = null
    testAuth = null
  }
}

/**
 * Clear all Firestore data via emulator REST API (for test isolation).
 */
export async function clearFirestoreData(): Promise<void> {
  const { host, port } = EMULATOR_CONFIG.firestore
  const projectId = TEST_FIREBASE_CONFIG.projectId

  const response = await fetch(
    `http://${host}:${port}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: 'DELETE' },
  )

  if (!response.ok) {
    throw new Error(`Failed to clear Firestore: ${response.statusText}`)
  }
}

/**
 * Check if the Firestore emulator is reachable.
 */
export async function checkEmulatorsRunning(): Promise<boolean> {
  try {
    const { host, port } = EMULATOR_CONFIG.firestore
    const response = await fetch(`http://${host}:${port}/`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}
