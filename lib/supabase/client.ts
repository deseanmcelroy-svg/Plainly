import { createBrowserClient } from '@supabase/ssr';

// ===========================================================================
// Supabase browser client.
//
// Used in client components ('use client') for auth (sign in/out, session)
// and any client-side reads/writes that respect Row Level Security.
//
// Requires these env vars (see .env.example):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
// ===========================================================================

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
