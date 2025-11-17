import { initializeApp, getApps } from 'firebase/app'
import { Auth, getAuth } from 'firebase/auth'
import { Firestore, getFirestore } from 'firebase/firestore'
import { FirebaseStorage, getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const currentApps = getApps()
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
// A check to see if the app is already initialized

// This prevents re-initialization during Next.js hot-reloads in development
if (!currentApps.length) {
  const app = initializeApp(firebaseConfig)
  // Get instances of the services
  auth = getAuth(app)
  storage = getStorage(app)
  db = getFirestore(app)
  // const analytics = getAnalytics(app);
} else {
  const app = currentApps[0]
  auth = getAuth(app)
  storage = getStorage(app)
  db = getFirestore(app)
}

// Export the instances to be used in other parts of your app
export { db, auth, storage }
