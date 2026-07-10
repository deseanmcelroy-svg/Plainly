import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const BASE = 'https://api.congress.gov/v3';
const CURRENT_CONGRESS = 119;
const CURRENT_SESSION = 2; // 119th Congress: session 1 = 2025, session 2 = 2026

async function fetchCongress(path: string, revalidateSeconds = 3600) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${CONGRESS_API_KEY}&format=json&limit=250`;
  const res = await fetch(url, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) throw new Error(`Congress API error: ${res.status} on ${path}`);
  return res.json();
}

// The /member list endpoint can't be filtered by state server-side, and every
// page is capped at 250 results even though there are ~535 sitting members.
// Paginate through the full roster before doing our own state/chamber filter.
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

async function getStateFromZip(zip: string): Promise<{ state: string; stateCode: string }> {
  if (!zip || !/^\d{5}$/.test(zip)) return { state: 'Ohio', stateCode: 'OH' };
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { next: { revalidate: 86400 } });
    if (!res.ok) return { state: 'Ohio', stateCode: 'OH' };
    const data = await res.json();
    const place = data.places?.[0];
    return {
      state: place?.['state'] || 'Ohio',
      stateCode: place?.['state abbreviation'] || 'OH',
    };
  } catch {
    return { state: 'Ohio', stateCode: 'OH' };
  }
}

function extractZip(input: string): string {
  return input.match(/\b(\d{5})\b/)?.[1] || '';
}

// Congress.gov has no "all votes by member" endpoint. The House Roll Call
// Votes API works the other direction: fetch a specific vote, then see how
// everyone voted on it. There's no Senate vote data at all. So we pull the
// recent vote list, then fetch the member-votes sublevel for each one
// (cached) and keep only this member's YES votes.
async function getHouseYesVotesForMember(bioguideId: string, limit = 25) {
  const listData = await fetchCongress(`/house-vote/${CURRENT_CONGRESS}/${CURRENT_SESSION}`, 900);
  const recent: any[] = (listData.houseRollCallVotes || []).slice(0, limit);

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
        const memberList: any[] = container.results || [];
        const mine = memberList.find((m: any) => m.bioguideId === bioguideId);
        if (!mine || !String(mine.voteCast || '').toLowerCase().includes('aye')) return null;

        const billLabel =
          container.legislationType && container.legislationNumber
            ? `${container.legislationType} ${container.legislationNumber}`
            : `Roll call ${rollNumber}`;

        return {
          id: `${CURRENT_CONGRESS}-${session}-${rollNumber}`,
          bill: billLabel,
          description: container.voteQuestion || container.voteType || '',
          position: mine.voteCast,
          date: container.startDate || v.startDate || '',
          result: container.result || v.result || '',
        };
      } catch {
        return null;
      }
    })
  );

  return results
    .filter(Boolean)
    .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')) as any[];
}

async function getSenateActivity(bioguideId: string) {
  const data = await fetchCongress(`/member/${bioguideId}/sponsored-legislation`, 3600);
  const bills: any[] = data.sponsoredLegislation || [];
  return bills
    .slice()
    .sort((a: any, b: any) => (b.latestAction?.actionDate || '').localeCompare(a.latestAction?.actionDate || ''))
    .slice(0, 25)
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
      const { state, stateCode } = await getStateFromZip(zip);
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
      return NextResponse.json({ members: mapped, state: stateCode });
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
      const votes = await getHouseYesVotesForMember(memberId, 25);
      // Attendance is computed across all fetched votes (yes + no + not voting),
      // so we do a lightweight second pass rather than reusing the filtered list.
      const listData = await fetchCongress(`/house-vote/${CURRENT_CONGRESS}/${CURRENT_SESSION}`, 900);
      const recent: any[] = (listData.houseRollCallVotes || []).slice(0, 25);
      const allPositions = await Promise.all(
        recent.map(async (v: any) => {
          const session = v.sessionNumber ?? CURRENT_SESSION;
          const rollNumber = v.rollCallNumber;
          if (!rollNumber) return null;
          try {
            const memberData = await fetchCongress(
              `/house-vote/${CURRENT_CONGRESS}/${session}/${rollNumber}/members`,
              3600
            );
            const mine = (memberData.houseRollCallVoteMemberVotes?.results || []).find(
              (m: any) => m.bioguideId === memberId
            );
            return mine?.voteCast || null;
          } catch {
            return null;
          }
        })
      );
      const found = allPositions.filter(Boolean) as string[];
      const votingCount = found.filter((p) => !p.toLowerCase().includes('not voting')).length;
      const attendance = found.length > 0 ? Math.round((votingCount / found.length) * 100) : null;

      return NextResponse.json({ votes, isActivity: false, attendance });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

