import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

// Firebase configuration with proper TypeScript typing
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate essential config exists to prevent silent failures
if (!firebaseConfig.apiKey) {
  throw new Error('Firebase API Key is missing. Check your .env.local file.')
}

if (!firebaseConfig.projectId) {
  throw new Error('Firebase Project ID is missing. Check your .env.local file.')
}

// Initialize Firebase app using singleton pattern
// This prevents re-initialization during Next.js hot-reloads in development
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// Get instances of the services
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Safe Analytics initialization (SSR Compatible)
// Only initialize Analytics in browser environment and if supported
let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app)
      }
    })
    .catch((error) => {
      // Silently fail if Analytics initialization fails
      // This prevents crashes in environments where Analytics isn't available
      console.warn('[Firebase] Analytics initialization failed:', error)
    })
}

// Export the instances to be used in other parts of your app
export { app, auth, db, storage, analytics }
