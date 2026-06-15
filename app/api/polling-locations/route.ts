import { NextRequest, NextResponse } from 'next/server';
import { fetchPollingLocations } from '@/lib/civicApi';
import { PollingInfo } from '@/lib/types';

// GET /api/polling-locations?location=ZIP_OR_ADDRESS
//
// Returns polling places, early voting sites, and drop-off locations for
// the given address. If no election data is available (most of the year,
// or if CIVIC_DATA_API_KEY isn't set), returns source: 'none' with an
// empty location label rather than erroring — the page handles this by
// pointing to official polling-place finders instead.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') ?? '';

  if (!location) {
    return NextResponse.json({ error: 'A location is required.' }, { status: 400 });
  }

  try {
    const result = await fetchPollingLocations(location);
    if (result) return NextResponse.json(result);

    const fallback: PollingInfo = {
      locationLabel: location,
      pollingLocations: [],
      earlyVoteSites: [],
      dropOffLocations: [],
      source: 'none',
    };
    return NextResponse.json(fallback);
  } catch {
    return NextResponse.json(
      { error: 'Could not look up polling locations for this address.' },
      { status: 500 }
    );
  }
}
