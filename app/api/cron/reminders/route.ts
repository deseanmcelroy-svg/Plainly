import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBallotForLocation } from '@/lib/data';
import { sendReminderEmail } from '@/lib/email/reminders';

// ===========================================================================
// GET /api/cron/reminders
//
// Intended to be triggered daily by Vercel Cron (see vercel.json). For each
// user with election_reminders_enabled = true and a saved_location:
//   1. Look up ballot data for that location.
//   2. Find calendar events within the next REMINDER_WINDOW_DAYS days.
//   3. Email the user a summary of those events via Resend.
//
// Security: requires a `Authorization: Bearer <CRON_SECRET>` header matching
// the CRON_SECRET env var, so this endpoint can't be triggered by anyone
// who finds the URL. Vercel Cron sends this header automatically when
// CRON_SECRET is set in your project's environment variables.
//
// If Supabase isn't configured (no service role key), or there are no users
// with reminders enabled, this is a harmless no-op.
// ===========================================================================

const REMINDER_WINDOW_DAYS = 7;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ skipped: true, reason: 'Supabase not configured' });
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('saved_location, notify_email')
    .eq('election_reminders_enabled', true)
    .not('saved_location', 'is', null)
    .not('notify_email', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let sent = 0;
  let checked = 0;

  for (const profile of profiles ?? []) {
    if (!profile.saved_location || !profile.notify_email) continue;
    checked++;

    const ballot = await getBallotForLocation(profile.saved_location);

    const upcoming = ballot.calendarEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= windowEnd;
    });

    if (upcoming.length === 0) continue;

    await sendReminderEmail({
      to: profile.notify_email,
      locationLabel: ballot.locationLabel,
      upcomingEvents: upcoming,
    });
    sent++;
  }

  return NextResponse.json({ checked, sent });
}
