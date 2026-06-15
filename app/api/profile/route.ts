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
    .select(
      'saved_location, election_reminders_enabled, notify_email, age_range, housing_status, home_value_range, household_income_range, has_school_age_kids'
    )
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

  // Household profile fields — broad brackets only, all optional. Validate
  // against the same allowed values as the database CHECK constraints so
  // we return a clear error instead of a generic 500 on bad input.
  const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const housingStatuses = ['rent', 'own'];
  const homeValueRanges = ['under_150k', '150k_300k', '300k_500k', '500k_plus'];
  const incomeRanges = ['under_40k', '40k_80k', '80k_120k', '120k_plus'];

  if (body.age_range === null || ageRanges.includes(body.age_range)) {
    updates.age_range = body.age_range;
  }
  if (body.housing_status === null || housingStatuses.includes(body.housing_status)) {
    updates.housing_status = body.housing_status;
  }
  if (body.home_value_range === null || homeValueRanges.includes(body.home_value_range)) {
    updates.home_value_range = body.home_value_range;
  }
  if (body.household_income_range === null || incomeRanges.includes(body.household_income_range)) {
    updates.household_income_range = body.household_income_range;
  }
  if (typeof body.has_school_age_kids === 'boolean' || body.has_school_age_kids === null) {
    updates.has_school_age_kids = body.has_school_age_kids;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userData.user.id)
    .select(
      'saved_location, election_reminders_enabled, notify_email, age_range, housing_status, home_value_range, household_income_range, has_school_age_kids'
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
