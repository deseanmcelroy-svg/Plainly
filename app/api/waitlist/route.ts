import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizeZip(location: string): string {
  const match = location.match(/\b(\d{5})\b/);
  return match ? match[1] : location.toLowerCase().trim().slice(0, 20);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Not available' }, { status: 503 });
  }

  const body = await request.json();
  const { email, location } = body;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: 'Location required' }, { status: 400 });
  }

  const zip = normalizeZip(location);

  const { error } = await supabase.from('ballot_waitlist').insert({
    email: email.trim().toLowerCase(),
    zip,
  });

  if (error) {
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
