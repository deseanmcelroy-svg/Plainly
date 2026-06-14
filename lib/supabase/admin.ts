import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ===========================================================================
// Supabase admin client — uses the service role key, which bypasses Row
// Level Security.
//
// ONLY use this in trusted server-side contexts (cron jobs, admin scripts)
// that need to read/write data across all users — e.g. the election
// reminders job, which needs every user's saved_location and notify_email.
//
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser or include it in
// any NEXT_PUBLIC_* variable.
// ===========================================================================

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
