import { initializeApp, getApps, cert, type ServiceAccount, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

/**
 * Builds Firebase Admin service account from environment variables.
 * Handles private key newline escaping.
 */
function getServiceAccount(): ServiceAccount {
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (!rawPrivateKey) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is required')
  }

  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    // Use the processed key with newlines fixed
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
  }
}

/**
 * Always returns an App instance (never undefined).
 * Implements singleton pattern to prevent multiple initializations.
 */
function getAdminApp(): App {
  const apps = getApps()
  if (apps.length > 0) {
    const existingApp = apps[0]
    if (existingApp) {
      return existingApp
    }
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  })
}

const adminApp = getAdminApp()

// Initialize Firebase Admin services
export const adminDb = getFirestore(adminApp)
export const adminAuth = getAuth(adminApp)

/**
 * Verifies Admin SDK initialization and environment variables
 * Logs diagnostic information in development mode
 * Provides safe error messages in production without exposing sensitive data
 */
export function verifyAdminSDKInitialization(): {
  initialized: boolean
  hasProjectId: boolean
  hasClientEmail: boolean
  hasPrivateKey: boolean
  projectId?: string
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const hasProjectId = Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID)
  const hasClientEmail = Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL)
  const hasPrivateKey = Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY)

  // Check required environment variables
  if (!hasProjectId) {
    errors.push('FIREBASE_ADMIN_PROJECT_ID is missing')
  }
  if (!hasClientEmail) {
    errors.push('FIREBASE_ADMIN_CLIENT_EMAIL is missing')
  }
  if (!hasPrivateKey) {
    errors.push('FIREBASE_ADMIN_PRIVATE_KEY is missing')
  }

  // Check optional but recommended variables
  if (
    !process.env.FIREBASE_ADMIN_STORAGE_BUCKET &&
    !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ) {
    warnings.push('Storage bucket not explicitly set (will use default)')
  }

  // Verify Admin SDK app is initialized
  let appInitialized = false
  try {
    appInitialized = adminApp !== null && Boolean(adminApp.options.projectId)
  } catch {
    appInitialized = false
  }

  const initialized = appInitialized && errors.length === 0

  // Log errors in production if initialization failed
  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    // In production, log errors without sensitive details
    console.error('[Admin SDK] Initialization failed:', {
      errorCount: errors.length,
      missingVariables: errors.map((e) => e.split(' ')[0]), // Just variable names
    })
  }

  return {
    initialized,
    hasProjectId,
    hasClientEmail,
    hasPrivateKey,
    projectId: adminApp.options.projectId,
    errors,
    warnings,
  }
}

/**
 * Health check function to test Admin SDK connection
 * Verifies both initialization and ability to query Firestore
 */
export async function healthCheckAdminSDK(): Promise<{
  healthy: boolean
  error?: string
  details?: {
    projectId: string
    canQuery: boolean
    initializationStatus: ReturnType<typeof verifyAdminSDKInitialization>
  }
}> {
  try {
    const initStatus = verifyAdminSDKInitialization()

    if (!initStatus.initialized) {
      return {
        healthy: false,
        error: `Admin SDK not initialized: ${initStatus.errors.join(', ')}`,
        details: {
          projectId: initStatus.projectId || 'unknown',
          canQuery: false,
          initializationStatus: initStatus,
        },
      }
    }

    // Try a simple query to verify connection
    const testRef = adminDb.collection('posts').limit(1)
    await testRef.get()

    return {
      healthy: true,
      details: {
        projectId: adminApp.options.projectId || 'unknown',
        canQuery: true,
        initializationStatus: initStatus,
      },
    }
  } catch (error) {
    const initStatus = verifyAdminSDKInitialization()
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
      details: {
        projectId: initStatus.projectId || 'unknown',
        canQuery: false,
        initializationStatus: initStatus,
      },
    }
  }
}

// Verify initialization on module load (dev only)
if (process.env.NODE_ENV !== 'production') {
  verifyAdminSDKInitialization()
}

// Get storage bucket name from environment variable
// Default bucket format is usually: project-id.appspot.com
const storageBucketName =
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

// Fallback to default bucket if no bucket name is specified
// Default bucket is typically: project-id.appspot.com
const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const defaultBucketName = projectId ? `${projectId}.appspot.com` : null

const finalBucketName = storageBucketName || defaultBucketName

if (!finalBucketName) {
  throw new Error(
    'FIREBASE_ADMIN_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, or FIREBASE_ADMIN_PROJECT_ID must be set',
  )
}

export const adminStorage = getStorage(adminApp)

/**
 * Gets the storage bucket. Uses the bucket name from environment variables.
 * The bucket name should be in format: project-id.appspot.com
 *
 * To find your bucket name:
 * 1. Go to Firebase Console → Storage
 * 2. The bucket name is shown at the top (usually project-id.appspot.com)
 * 3. Ensure Storage is enabled in Firebase Console
 */
export const getStorageBucket = () => {
  const bucket = adminStorage.bucket(finalBucketName)

  return bucket
}

export default adminApp
