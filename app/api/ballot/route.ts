import { NextRequest, NextResponse } from 'next/server';
import { getBallotForLocation } from '@/lib/data';

// GET /api/ballot?location=ZIP_OR_ADDRESS
//
// Returns ballot data for the given location. Currently backed by
// placeholder data (see lib/data.ts). Swap getBallotForLocation() for a
// real civic-data lookup when ready.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') ?? '';

  // TEMPORARY DEBUG: shows the raw, untouched Google Civic API response so
  // we can see exactly why real data isn't coming through. Remove once
  // resolved. Visit /api/ballot?location=X&debug=1
  if (searchParams.get('debug') === '1') {
    const apiKey = process.env.CIVIC_DATA_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'CIVIC_DATA_API_KEY not set' }, { status: 503 });
    const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?key=${encodeURIComponent(apiKey)}&address=${encodeURIComponent(location)}`;
    const res = await fetch(url);
    const raw = await res.json();
    return NextResponse.json({ requestedAddress: location, status: res.status, raw });
  }

  try {
    const ballot = await getBallotForLocation(location);
    return NextResponse.json(ballot);
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not look up ballot information for this location.' },
      { status: 500 }
    );
  }
}
