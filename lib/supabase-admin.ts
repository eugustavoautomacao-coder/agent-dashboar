import { createClient } from '@supabase/supabase-js'

// Cliente com service_role — APENAS em Server Components / API Routes
// Nunca exponha a service_role key no browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
