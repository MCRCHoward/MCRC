declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string

      // Firebase (client-side) config
      NEXT_PUBLIC_FIREBASE_API_KEY: string
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: string
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string
      NEXT_PUBLIC_FIREBASE_APP_ID: string
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string

      // Firebase Admin (server-side) config
      FIREBASE_ADMIN_TYPE: string
      FIREBASE_ADMIN_PROJECT_ID: string
      FIREBASE_ADMIN_PRIVATE_KEY_ID: string
      FIREBASE_ADMIN_PRIVATE_KEY: string
      FIREBASE_ADMIN_CLIENT_EMAIL: string
      FIREBASE_ADMIN_CLIENT_ID: string
      FIREBASE_ADMIN_AUTH_URI: string
      FIREBASE_ADMIN_TOKEN_URI: string
      FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL: string
      FIREBASE_ADMIN_CLIENT_X509_CERT_URL: string
      FIREBASE_ADMIN_UNIVERSE_DOMAIN: string

      // PayPal (server-side) config
      PAYPAL_PRODUCTION_DISPLAY_APP_NAME?: string
      PAYPAL_PRODUCTION_CLIENT_ID?: string
      PAYPAL_PRODUCTION_SECRET_KEY_1?: string
      PAYPAL_SANDBOX_DISPLAY_APP_NAME?: string
      PAYPAL_SANDBOX_CLIENT_ID?: string
      PAYPAL_SANDBOX_SECRET_KEY_1?: string
      PAYPAL_ENVIRONMENT?: 'sandbox' | 'production'
      // PayPal (client-side) config
      NEXT_PUBLIC_PAYPAL_PRODUCTION_CLIENT_ID?: string
      NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID?: string
      NEXT_PUBLIC_PAYPAL_ENVIRONMENT?: 'sandbox' | 'production'

      // Calendly OAuth Configuration
      PRODUCTION_CALENDLY_CLIENT_ID?: string
      PRODUCTION_CALENDLY_CLIENT_SECRET?: string
      PRODUCTION_CALENDLY_REDIRECT_URI?: string
      PRODUCTION_CALENDLY_WEBHOOK_SIGNING_KEY?: string
      SANDBOX_CALENDLY_CLIENT_ID?: string
      SANDBOX_CALENDLY_CLIENT_SECRET?: string
      SANDBOX_CALENDLY_REDIRECT_URI?: string
      SANDBOX_CALENDLY_WEBHOOK_SIGNING_KEY?: string
      CALENDLY_ENCRYPTION_KEY?: string
      CALENDLY_ENVIRONMENT?: 'production' | 'sandbox'
      CALENDLY_PERSONAL_ACCESS_TOKEN?: string // Personal access token for webhook management
      NEXT_PUBLIC_SERVER_URL?: string // Public server URL for webhook callbacks (ngrok URL for local dev)
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
