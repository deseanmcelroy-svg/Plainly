import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ===========================================================================
// Supabase server client.
//
// Used in Server Components, Route Handlers, and Server Actions. Reads/writes
// the user's auth session via cookies, so requests are authenticated as the
// signed-in user (and Row Level Security policies apply).
//
// Requires these env vars (see .env.example):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
// ===========================================================================

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — safe to ignore if you have
            // middleware refreshing sessions (see middleware.ts).
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}
