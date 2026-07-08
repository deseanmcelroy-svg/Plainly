import { NextRequest, NextResponse } from 'next/server';

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const BASE = 'https://api.congress.gov/v3';
const CURRENT_CONGRESS = 119;
const CURRENT_SESSION = 2; // 119th Congress: session 1 = 2025, session 2 = 2026

async function fetchCongress(path: string, revalidate = 3600) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${CONGRESS_API_KEY}&format=json&limit=250`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`Congress API error: ${res.status} on ${path}`);
  return res.json();
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

async function getHouseVotesForMember(bioguideId: string, limit = 20) {
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
        if (!mine) return null;

        const billLabel =
          container.legislationType && container.legislationNumber
            ? `${container.legislationType} ${container.legislationNumber}`
            : container.amendmentType && container.amendmentNumber
            ? `${container.amendmentType} ${container.amendmentNumber}`
            : `Roll call ${rollNumber}`;

        return {
          id: `${CURRENT_CONGRESS}-${session}-${rollNumber}`,
          bill: billLabel,
          description: container.voteQuestion || container.voteType || '',
          position: mine.voteCast || 'Not Voting',
          date: container.startDate || v.startDate || '',
          result: container.result || v.result || '',
        };
      } catch {
        return null;
      }
    })
  );

  const found = results.filter(Boolean) as any[];
  const votingCount = found.filter((v) => !v.position.toLowerCase().includes('not voting')).length;
  const attendance = found.length > 0 ? Math.round((votingCount / found.length) * 100) : null;

  return { votes: found, attendance };
}

async function getSenateActivity(bioguideId: string) {
  const data = await fetchCongress(`/member/${bioguideId}/sponsored-legislation`, 3600);
  const bills: any[] = data.sponsoredLegislation || [];
  return bills.slice(0, 15).map((b: any) => ({
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

      const data = await fetchCongress(`/member?currentMember=true`);
      const allMembers: any[] = data.members || [];

      const stateMatches = allMembers.filter((m: any) => {
        const ms = String(m.state || '').trim();
        return (
          ms === stateCode ||
          ms === state ||
          ms.toLowerCase() === stateCode.toLowerCase() ||
          ms.toLowerCase() === state.toLowerCase()
        );
      });

      const houseMatches = stateMatches.filter((m: any) => {
        const ch = m.terms?.item?.[m.terms.item.length - 1]?.chamber || '';
        return ch.includes('House');
      });
      const senateMatches = stateMatches.filter((m: any) => {
        const ch = m.terms?.item?.[m.terms.item.length - 1]?.chamber || '';
        return ch.includes('Senate');
      });

      const houseMember = houseMatches[0];
      const senators = senateMatches.slice(0, 2);

      const mapped = [houseMember, ...senators].filter(Boolean).map(mapMember);

      return NextResponse.json({ members: mapped, state: stateCode });
    }

    if (type === 'bills' && memberId) {
      const data = await fetchCongress(`/member/${memberId}/sponsored-legislation`);
      const bills = (data.sponsoredLegislation || []).map((b: any) => ({
        id: `${b.type}${b.number}`,
        title: b.title,
        number: `${b.type} ${b.number}`,
        introducedDate: b.introducedDate,
        latestAction: b.latestAction?.text || '',
        latestActionDate: b.latestAction?.actionDate || '',
        policyArea: b.policyArea?.name || '',
        congress: b.congress,
        billType: b.type,
        billNumber: b.number,
      }));
      return NextResponse.json({ bills });
    }

    if (type === 'votes' && memberId) {
      if (chamber.includes('Senate')) {
        const activity = await getSenateActivity(memberId);
        return NextResponse.json({ votes: activity, isActivity: true, attendance: null });
      }
      const { votes, attendance } = await getHouseVotesForMember(memberId, 20);
      return NextResponse.json({ votes, isActivity: false, attendance });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
