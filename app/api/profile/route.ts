import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profile — returns the signed-in user's saved location & prefs
// PATCH /api/profile — updates saved_location and/or election_reminders_enabled
//
// Both require an authenticated Supabase session (set via cookies by
// middleware.ts). If Supabase isn't configured or the user isn't signed in,
// returns 401 — callers should treat the user as a guest in that case.

export async function GET() {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('saved_location, election_reminders_enabled, notify_email')
    .eq('id', userData.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.saved_location === 'string') {
    updates.saved_location = body.saved_location;
  }
  if (typeof body.election_reminders_enabled === 'boolean') {
    updates.election_reminders_enabled = body.election_reminders_enabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userData.user.id)
    .select('saved_location, election_reminders_enabled, notify_email')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
