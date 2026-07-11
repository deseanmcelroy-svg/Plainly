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

// Offline ZIP3-prefix -> state lookup. Used as the base state match, and as
// a fallback if the district-level geocoding below fails for any reason.
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

// Resolves a ZIP to its actual congressional district, not just its state.
// Two public, keyless Census Bureau calls: (1) look up the ZCTA's geographic
// centroid, (2) reverse-geocode that point against the district boundaries.
// This is a centroid-based approximation — a ZIP that straddles a district
// line could resolve to the "wrong side" — but it's far more accurate than
// state-only matching, which was returning an essentially arbitrary House
// member for every ZIP in a state. Returns null on any failure so the
// caller can gracefully fall back to state-only matching.
async function getDistrictForZip(zip: string): Promise<number | null> {
  if (!zip || !/^\d{5}$/.test(zip)) return null;
  try {
    const centroidUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/4/query?where=ZCTA5='${zip}'&outFields=CENTLAT,CENTLON&f=json`;
    const centroidRes = await fetch(centroidUrl, { next: { revalidate: 2592000 } }); // 30 days, ZIP boundaries barely change
    const centroidData = await centroidRes.json();
    const lat = centroidData.features?.[0]?.attributes?.CENTLAT;
    const lon = centroidData.features?.[0]?.attributes?.CENTLON;
    if (!lat || !lon) return null;

    const districtUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=4&vintage=4&format=json`;
    const districtRes = await fetch(districtUrl, { next: { revalidate: 2592000 } });
    const districtData = await districtRes.json();
    const cdList = districtData.result?.geographies?.['119th Congressional Districts'];
    const cd119 = cdList?.[0]?.CD119;
    if (!cd119) return null;

    return parseInt(cd119, 10);
  } catch {
    return null;
  }
}

// Single pass: fetch each recent vote's member-data once, and from that one
// fetch derive this member's position on EVERY vote (not just yes), so the
// frontend can offer a real YES/NO filter, plus their attendance rate.
async function getHouseVoteData(bioguideId: string, limit = 30) {
  const listData = await fetchCongress(`/house-vote/${CURRENT_CONGRESS}/${CURRENT_SESSION}`, 900);
  const allVotes: any[] = listData.houseRollCallVotes || [];
  const dataAsOf = listData.updateDate || null;

  const sorted = allVotes.slice().sort((a, b) => (b.rollCallNumber || 0) - (a.rollCallNumber || 0));
  const recent = sorted.slice(0, limit);

  const BATCH_SIZE = 5;
  const found: { position: string; vote: any }[] = [];

  for (let i = 0; i < recent.length; i += BATCH_SIZE) {
    const batch = recent.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (v: any) => {
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
          const mine = (container.results || []).find((m: any) => m.bioguideID === bioguideId);
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
    found.push(...(batchResults.filter(Boolean) as { position: string; vote: any }[]));
  }

  // Return every vote the member actually cast (Yea or Nay), so the client
  // can filter either direction. "Present" and "Not Voting" are excluded
  // from the list itself but still count toward attendance below.
  const allCastVotes = found
    .filter((r) => r.position.toLowerCase().includes('aye') || r.position.toLowerCase().includes('nay'))
    .map((r) => r.vote)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const votingCount = found.filter((r) => !r.position.toLowerCase().includes('not voting')).length;
  const attendance = found.length > 0 ? Math.round((votingCount / found.length) * 100) : null;

  return { votes: allCastVotes, attendance, dataAsOf };
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

function computeNextElection(chamber: string, lastTermStartYear: number | null): string | null {
  const currentYear = new Date().getFullYear();
  if (chamber.includes('House')) {
    return String(currentYear % 2 === 0 ? currentYear : currentYear + 1);
  }
  if (chamber.includes('Senate') && lastTermStartYear) {
    let electionYear = lastTermStartYear + 5;
    while (electionYear < currentYear) electionYear += 6;
    return String(electionYear);
  }
  return null;
}

function mapMember(m: any) {
  const lastTerm = m.terms?.item?.[m.terms.item.length - 1];
  const chamber = lastTerm?.chamber || '';
  return {
    id: m.bioguideId,
    name: m.name,
    party: m.partyName,
    chamber,
    state: m.state,
    district: m.district,
    depiction: m.depiction?.imageUrl || null,
    nextElection: computeNextElection(chamber, lastTerm?.startYear || null),
  };
}

// Computes Election Day for a given year: the first Tuesday after the
// first Monday in November, per federal law.
function getElectionDay(year: number): string {
  const nov1 = new Date(year, 10, 1);
  const dayOfWeek = nov1.getDay();
  const daysToMonday = (8 - dayOfWeek) % 7;
  const electionDateNum = 1 + daysToMonday + 1;
  const d = new Date(year, 10, electionDateNum);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatCandidateName(raw: string): string {
  const parts = raw.split(',').map((p) => p.trim());
  if (parts.length < 2) return raw;
  const last = parts[0];
  const first = parts[1].split(' ')[0];
  const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
  return `${titleCase(first)} ${titleCase(last)}`;
}

function normalizeParty(partyFull: string): string {
  const p = (partyFull || '').toUpperCase();
  if (p.includes('REPUBLICAN')) return 'Republican';
  if (p.includes('DEMOCRATIC')) return 'Democratic';
  if (p.includes('LIBERTARIAN')) return 'Libertarian';
  if (p.includes('GREEN')) return 'Green';
  if (p.includes('INDEPENDENT')) return 'Independent';
  return partyFull ? partyFull.replace(/\bPARTY\b/i, '').trim().split(' ').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') : 'Other';
}

// Candidates for the incumbent's own race, filtered to those ACTUALLY on
// the ballot this cycle. FEC's `cycles` field includes any two-year
// reporting period a candidate has ever touched (going back decades) —
// filtering by that alone would show retired members and defeated primary
// candidates as if they were current. `election_years` is the field that
// actually reflects which specific elections a candidate is/was on the
// ballot for, so that's what determines inclusion here.
const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC', 'puerto rico': 'PR',
};

// FEC's API requires the 2-letter postal code — Congress.gov's member list
// endpoint returns the full state name (e.g. "Ohio"), which was silently
// producing zero FEC matches with no error, since FEC just returns an empty
// result set for an unrecognized state value rather than erroring.
function toStateCode(state: string): string {
  if (!state) return state;
  if (state.length === 2) return state.toUpperCase();
  return STATE_NAME_TO_CODE[state.toLowerCase()] || state;
}

async function getCandidatesForRace(chamber: string, state: string, district: string, cycle: number) {
  const FEC_KEY = process.env.FEC_API_KEY;
  if (!FEC_KEY) return { candidates: [], electionDate: getElectionDay(cycle) };

  const stateCode = toStateCode(state);
  const office = chamber.includes('Senate') ? 'S' : 'H';
  const params = new URLSearchParams({ office, state: stateCode, cycle: String(cycle), api_key: FEC_KEY, per_page: '100' });
  if (office === 'H' && district) {
    params.set('district', district.padStart(2, '0'));
  }

  const res = await fetch(`https://api.open.fec.gov/v1/candidates/?${params.toString()}`, {
    next: { revalidate: 1209600 },
  });
  if (!res.ok) return { candidates: [], electionDate: getElectionDay(cycle) };
  const data = await res.json();

  const results: any[] = data.results || [];
  const onBallotThisCycle = results.filter((c: any) => (c.election_years || []).includes(cycle));

  const candidates = onBallotThisCycle.map((c: any) => ({
    candidateId: c.candidate_id,
    name: formatCandidateName(c.name),
    party: normalizeParty(c.party_full),
    role: c.incumbent_challenge_full,
    hasRaisedFunds: !!c.has_raised_funds,
    firstFileDate: c.first_file_date,
  }));

  return { candidates, electionDate: getElectionDay(cycle) };
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
    if (type === 'candidates') {
      const chamber = searchParams.get('chamber') || '';
      const state = searchParams.get('state') || '';
      const district = searchParams.get('district') || '';
      const cycle = parseInt(searchParams.get('cycle') || '', 10);
      if (!state || !cycle) return NextResponse.json({ candidates: [], electionDate: null });
      const result = await getCandidatesForRace(chamber, state, district, cycle);
      return NextResponse.json(result);
    }

    if (type === 'members') {
      const zip = extractZip(location);
      const { state, stateCode } = getStateFromZip(zip);
      const [allMembers, district] = await Promise.all([getAllCurrentMembers(), getDistrictForZip(zip)]);

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

      let houseMember = houseMatches[0];
      let districtMatched = false;
      if (district !== null) {
        const exact = houseMatches.find((m: any) => Number(m.district) === district);
        if (exact) {
          houseMember = exact;
          districtMatched = true;
        }
      }

      const mapped = [houseMember, ...senateMatches.slice(0, 2)].filter(Boolean).map(mapMember);
      return NextResponse.json({
        members: mapped,
        state: stateCode,
        districtMatched,
        resolvedDistrict: district,
      });
    }

    // Fallback lookup for bookmarked/shared rep links that arrive with no
    // query-string context (name, party, photo, district, next election).
    if (type === 'member-info' && memberId) {
      const data = await fetchCongress(`/member/${memberId}`, 21600);
      const m = data.member;
      if (!m) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

      const terms = (m.terms || []).slice().sort((a: any, b: any) => (a.startYear || 0) - (b.startYear || 0));
      const lastTerm = terms[terms.length - 1];
      const chamber = lastTerm?.chamber || '';
      const currentParty = (m.partyHistory || [])[m.partyHistory.length - 1]?.partyName || '';

      return NextResponse.json({
        name: m.directOrderName || m.invertedOrderName,
        party: currentParty,
        district: m.district ?? null,
        depiction: m.depiction?.imageUrl || null,
        state: m.state || '',
        chamber,
        nextElection: computeNextElection(chamber, lastTerm?.startYear || null),
      });
    }

    if (type === 'bio' && memberId) {
      const data = await fetchCongress(`/member/${memberId}`, 21600);
      const m = data.member;
      if (!m) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

      const terms = (m.terms || []).slice().sort((a: any, b: any) => (a.startYear || 0) - (b.startYear || 0));
      const firstTermYear = terms[0]?.startYear || null;
      const chambersServed = Array.from(new Set(terms.map((t: any) => t.chamber))) as string[];
      const currentYear = new Date().getFullYear();
      const yearsServed = firstTermYear ? currentYear - firstTermYear : null;

      const leadership = (m.leadership || []).map((l: any) => ({
        type: l.type,
        congress: l.congress,
        isCurrent: l.current ?? l.isCurrent ?? false,
      }));

      const partyHistory = (m.partyHistory || []).map((p: any) => ({
        party: p.partyName,
        startYear: p.startYear,
      }));

      return NextResponse.json({
        bioguideId: m.bioguideId,
        name: m.directOrderName || m.invertedOrderName,
        birthYear: m.birthYear || null,
        website: m.officialWebsiteUrl || null,
        firstTermYear,
        termCount: terms.length,
        chambersServed,
        yearsServed,
        leadership,
        partyHistory,
        currentlySwitchedParty: partyHistory.length > 1,
        cosponsoredCount: m.cosponsoredLegislation?.count ?? null,
      });
    }

    if (type === 'policy-areas' && memberId) {
      const data = await fetchCongress(`/member/${memberId}/sponsored-legislation`);
      const bills: any[] = data.sponsoredLegislation || [];
      const counts: Record<string, number> = {};
      for (const b of bills) {
        const area = b.policyArea?.name;
        if (area) counts[area] = (counts[area] || 0) + 1;
      }
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name]) => name);
      return NextResponse.json({ policyAreas: top });
    }

    if (type === 'bills-sponsored-count' && memberId) {
      const data = await fetchCongress(`/member/${memberId}/sponsored-legislation`);
      return NextResponse.json({ count: (data.sponsoredLegislation || []).length });
    }

    if (type === 'votes' && memberId) {
      if (chamber.includes('Senate')) {
        const activity = await getSenateActivity(memberId);
        return NextResponse.json({ votes: activity, isActivity: true, attendance: null, dataAsOf: null });
      }
      const { votes, attendance, dataAsOf } = await getHouseVoteData(memberId, 30);
      return NextResponse.json({ votes, isActivity: false, attendance, dataAsOf });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}

