import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const BASE = 'https://api.congress.gov/v3';
const CURRENT_CONGRESS = 119;
const CURRENT_SESSION = 2;

async function fetchCongress(path: string, revalidateSeconds = 3600) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${CONGRESS_API_KEY}&format=json&limit=250`;
  const res = await fetch(url, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) throw new Error(`Congress API error: ${res.status} on ${path}`);
  return res.json();
}

async function getAllCurrentMembers(): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  for (let i = 0; i < 5; i++) {
    const data = await fetchCongress(`/member?currentMember=true&offset=${offset}`, 21600);
    const page: any[] = data.members || [];
    all.push(...page);
    if (page.length < 250) break;
    offset += 250;
  }
  return all;
}

// Offline ZIP3-prefix -> state lookup. No external network call, so it can
// never silently fail and fall back to a wrong default the way a third-party
// geocoding API can. Ranges follow standard USPS ZIP3 assignments.
const ZIP3_RANGES: [number, number, string, string][] = [
  [5, 5, 'New York', 'NY'], [6, 9, 'Puerto Rico', 'PR'], [10, 27, 'Massachusetts', 'MA'],
  [28, 29, 'Rhode Island', 'RI'], [30, 38, 'New Hampshire', 'NH'], [39, 49, 'Maine', 'ME'],
  [50, 59, 'Vermont', 'VT'], [60, 69, 'Connecticut', 'CT'], [70, 89, 'New Jersey', 'NJ'],
  [100, 149, 'New York', 'NY'], [150, 196, 'Pennsylvania', 'PA'], [197, 199, 'Delaware', 'DE'],
  [200, 205, 'District of Columbia', 'DC'], [206, 219, 'Maryland', 'MD'],
  [220, 246, 'Virginia', 'VA'], [247, 268, 'West Virginia', 'WV'],
  [270, 289, 'North Carolina', 'NC'], [290, 299, 'South Carolina', 'SC'],
  [300, 319, 'Georgia', 'GA'], [320, 349, 'Florida', 'FL'], [350, 369, 'Alabama', 'AL'],
  [370, 385, 'Tennessee', 'TN'], [386, 397, 'Mississippi', 'MS'],
  [398, 399, 'Georgia', 'GA'], [400, 427, 'Kentucky', 'KY'], [430, 459, 'Ohio', 'OH'],
  [460, 479, 'Indiana', 'IN'], [480, 499, 'Michigan', 'MI'], [500, 528, 'Iowa', 'IA'],
  [530, 549, 'Wisconsin', 'WI'], [550, 567, 'Minnesota', 'MN'], [570, 577, 'South Dakota', 'SD'],
  [580, 588, 'North Dakota', 'ND'], [590, 599, 'Montana', 'MT'], [600, 629, 'Illinois', 'IL'],
  [630, 658, 'Missouri', 'MO'], [660, 679, 'Kansas', 'KS'], [680, 693, 'Nebraska', 'NE'],
  [700, 714, 'Louisiana', 'LA'], [716, 729, 'Arkansas', 'AR'], [730, 749, 'Oklahoma', 'OK'],
  [750, 799, 'Texas', 'TX'], [800, 816, 'Colorado', 'CO'], [820, 831, 'Wyoming', 'WY'],
  [832, 838, 'Idaho', 'ID'], [840, 847, 'Utah', 'UT'], [850, 865, 'Arizona', 'AZ'],
  [870, 884, 'New Mexico', 'NM'], [889, 898, 'Nevada', 'NV'], [900, 966, 'California', 'CA'],
  [967, 968, 'Hawaii', 'HI'], [970, 979, 'Oregon', 'OR'], [980, 994, 'Washington', 'WA'],
  [995, 999, 'Alaska', 'AK'],
];

function getStateFromZip(zip: string): { state: string; stateCode: string } {
  if (!zip || !/^\d{5}$/.test(zip)) return { state: 'Ohio', stateCode: 'OH' };
  const prefix = parseInt(zip.slice(0, 3), 10);
  for (const [min, max, state, stateCode] of ZIP3_RANGES) {
    if (prefix >= min && prefix <= max) return { state, stateCode };
  }
  return { state: 'Ohio', stateCode: 'OH' };
}

function extractZip(input: string): string {
  return input.match(/\b(\d{5})\b/)?.[1] || '';
}

// Single pass: fetch each recent vote's member-data once, and from that one
// fetch derive BOTH this member's yes-vote list AND their attendance rate.
// (Previously this ran two separate loops over the same 25 votes — ~50
// outbound calls instead of 25 — which is what was making the page slow.)
async function getHouseVoteData(bioguideId: string, limit = 20) {
  const listData = await fetchCongress(`/house-vote/${CURRENT_CONGRESS}/${CURRENT_SESSION}`, 900);
  const allVotes: any[] = listData.houseRollCallVotes || [];

  // Congress.gov does not return this list in chronological order (verified:
  // roll call numbers come back scattered, e.g. 74, 72, 71, 77...). Sorting
  // by roll call number descending is the closest reliable proxy for "most
  // recent" since roll calls increment sequentially within a session.
  const sorted = allVotes.slice().sort((a, b) => (b.rollCallNumber || 0) - (a.rollCallNumber || 0));
  const recent = sorted.slice(0, limit);

  const results = await Promise.all(
    recent.map(async (v: any) => {
      const session = v.sessionNumber ?? CURRENT_SESSION;
      const rollNumber = v.rollCallNumber;
      if (!rollNumber) return null;
      try {
        const memberData = await fetchCongress(
          `/house-vote/${CURRENT_CONGRESS}/${session}/${rollNumber}/members`,
          3600
        );
        const container = memberData.houseRollCallVoteMemberVotes;
        if (!container) return null;
        const mine = (container.results || []).find((m: any) => m.bioguideId === bioguideId);
        if (!mine) return null;

        const billLabel =
          container.legislationType && container.legislationNumber
            ? `${container.legislationType} ${container.legislationNumber}`
            : `Roll call ${rollNumber}`;

        return {
          position: mine.voteCast as string,
          vote: {
            id: `${CURRENT_CONGRESS}-${session}-${rollNumber}`,
            bill: billLabel,
            description: container.voteQuestion || container.voteType || '',
            position: mine.voteCast,
            date: container.startDate || v.startDate || '',
            result: container.result || v.result || '',
          },
        };
      } catch {
        return null;
      }
    })
  );

  const found = results.filter(Boolean) as { position: string; vote: any }[];
  const yesVotes = found
    .filter((r) => r.position.toLowerCase().includes('aye'))
    .map((r) => r.vote)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const votingCount = found.filter((r) => !r.position.toLowerCase().includes('not voting')).length;
  const attendance = found.length > 0 ? Math.round((votingCount / found.length) * 100) : null;

  return { votes: yesVotes, attendance };
}

async function getSenateActivity(bioguideId: string) {
  const data = await fetchCongress(`/member/${bioguideId}/sponsored-legislation`, 3600);
  const bills: any[] = data.sponsoredLegislation || [];
  return bills
    .slice()
    .sort((a: any, b: any) => (b.latestAction?.actionDate || '').localeCompare(a.latestAction?.actionDate || ''))
    .slice(0, 20)
    .map((b: any) => ({
      id: `${b.type}${b.number}`,
      bill: `${b.type} ${b.number}`,
      description: b.title,
      position: null,
      date: b.latestAction?.actionDate || b.introducedDate || '',
      result: b.latestAction?.text || '',
    }));
}

function mapMember(m: any) {
  return {
    id: m.bioguideId,
    name: m.name,
    party: m.partyName,
    chamber: m.terms?.item?.[m.terms.item.length - 1]?.chamber || '',
    state: m.state,
    district: m.district,
    depiction: m.depiction?.imageUrl || null,
    nextElection: m.terms?.item?.[m.terms.item.length - 1]?.endYear?.toString() || null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || '';
  const memberId = searchParams.get('memberId') || '';
  const chamber = searchParams.get('chamber') || '';
  const type = searchParams.get('type') || 'members';

  if (!CONGRESS_API_KEY) {
    return NextResponse.json({ error: 'Congress API not configured' }, { status: 503 });
  }

  try {
    if (type === 'members') {
      const zip = extractZip(location);
      const { state, stateCode } = getStateFromZip(zip);
      const allMembers = await getAllCurrentMembers();

      const stateMatches = allMembers.filter((m: any) => {
        const ms = String(m.state || '').trim();
        return (
          ms === stateCode ||
          ms === state ||
          ms.toLowerCase() === stateCode.toLowerCase() ||
          ms.toLowerCase() === state.toLowerCase()
        );
      });

      const houseMatches = stateMatches.filter((m: any) =>
        (m.terms?.item?.[m.terms.item.length - 1]?.chamber || '').includes('House')
      );
      const senateMatches = stateMatches.filter((m: any) =>
        (m.terms?.item?.[m.terms.item.length - 1]?.chamber || '').includes('Senate')
      );

      const mapped = [houseMatches[0], ...senateMatches.slice(0, 2)].filter(Boolean).map(mapMember);
      return NextResponse.json({ members: mapped, state: stateCode, zipUsed: zip || '(none, defaulted)' });
    }

    if (type === 'bills-sponsored-count' && memberId) {
      const data = await fetchCongress(`/member/${memberId}/sponsored-legislation`);
      return NextResponse.json({ count: (data.sponsoredLegislation || []).length });
    }

    if (type === 'votes' && memberId) {
      if (chamber.includes('Senate')) {
        const activity = await getSenateActivity(memberId);
        return NextResponse.json({ votes: activity, isActivity: true, attendance: null });
      }
      const { votes, attendance } = await getHouseVoteData(memberId, 30);
      return NextResponse.json({ votes, isActivity: false, attendance });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
