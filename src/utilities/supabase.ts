/**
 * Supabase client configuration
 *
 * @deprecated This file is not currently used in the project.
 * The project uses Firebase instead of Supabase.
 * This file may be removed in the future if Supabase integration is not needed.
 *
 * To use this file, install @supabase/supabase-js:
 *   pnpm add @supabase/supabase-js
 *
 * And ensure the following environment variables are set:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

// Uncomment the following code if you need Supabase integration:
/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})
*/

// Placeholder export to prevent import errors
export const supabase = null as unknown as never
