import { NextRequest, NextResponse } from 'next/server';

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const BASE = 'https://api.congress.gov/v3';

async function fetchCongress(path: string) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${CONGRESS_API_KEY}&format=json&limit=20`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Congress API error: ${res.status}`);
  return res.json();
}

function extractZip(input: string): string {
  return input.match(/\b(\d{5})\b/)?.[1] || '';
}

async function getLocationFromZip(zip: string): Promise<{ state: string; stateCode: string }> {
  if (!zip) return { state: 'Ohio', stateCode: 'OH' };
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || '';
  const memberId = searchParams.get('memberId') || '';
  const type = searchParams.get('type') || 'members';

  if (!CONGRESS_API_KEY) {
    return NextResponse.json({ error: 'Congress API not configured' }, { status: 503 });
  }

  try {
    const zip = extractZip(location);
    const { stateCode } = await getLocationFromZip(zip);

    if (type === 'members') {
      const data = await fetchCongress(`/member?stateCode=${stateCode}&currentMember=true`);
      const members = (data.members || []).slice(0, 3).map((m: any) => ({
        id: m.bioguideId,
        name: m.name,
        party: m.partyName,
        chamber: m.terms?.item?.[m.terms.item.length - 1]?.chamber || '',
        state: m.state,
        district: m.district,
        url: m.url,
        depiction: m.depiction?.imageUrl || null,
        nextElection: m.terms?.item?.[m.terms.item.length - 1]?.endYear || null,
      }));
      return NextResponse.json({ members, state: stateCode });
    }

    if (type === 'votes' && memberId) {
      const data = await fetchCongress(`/member/${memberId}/votes`);
      const votes = (data.votes || []).slice(0, 50).map((v: any) => ({
        id: v.vote?.rollNumber || Math.random(),
        bill: v.vote?.bill?.title || v.vote?.description || 'Procedural vote',
        billNumber: v.vote?.bill?.number || '',
        position: v.memberVote || 'Not Voting',
        date: v.vote?.date || '',
        result: v.vote?.result || '',
        description: v.vote?.description || '',
      }));
      return NextResponse.json({ votes });
    }

    if (type === 'bills' && memberId) {
      const data = await fetchCongress(`/member/${memberId}/sponsored-legislation`);
      const bills = (data.sponsoredLegislation || []).slice(0, 20).map((b: any) => ({
        id: b.number,
        title: b.title,
        number: b.number,
        introducedDate: b.introducedDate,
        latestAction: b.latestAction?.text || '',
        latestActionDate: b.latestAction?.actionDate || '',
        url: b.url,
        policyArea: b.policyArea?.name || '',
      }));
      return NextResponse.json({ bills });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
