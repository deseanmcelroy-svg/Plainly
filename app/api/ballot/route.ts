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
