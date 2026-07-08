import { NextRequest, NextResponse } from 'next/server';

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const BASE = 'https://api.congress.gov/v3';

async function fetchCongress(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${CONGRESS_API_KEY}&format=json&limit=250`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Congress API error: ${res.status}`);
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || '';
  const memberId = searchParams.get('memberId') || '';
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

      const sample = allMembers.slice(0, 3).map((m: any) => ({
        name: m.name,
        state: m.state,
        party: m.partyName,
      }));

      const stateMembers = allMembers.filter((m: any) => {
        const ms = String(m.state || '').trim();
        return (
          ms === stateCode ||
          ms === state ||
          ms.toLowerCase() === stateCode.toLowerCase() ||
          ms.toLowerCase() === state.toLowerCase()
        );
      });

      const mapped = stateMembers.slice(0, 3).map((m: any) => ({
        id: m.bioguideId,
        name: m.name,
        party: m.partyName,
        chamber: m.terms?.item?.[m.terms.item.length - 1]?.chamber || '',
        state: m.state,
        district: m.district,
        depiction: m.depiction?.imageUrl || null,
        nextElection: m.terms?.item?.[m.terms.item.length - 1]?.endYear?.toString() || null,
      }));

      return NextResponse.json({
        members: mapped,
        state: stateCode,
        debug: {
          zip,
          stateCode,
          state,
          totalMembers: allMembers.length,
          sample,
          matchCount: stateMembers.length,
        }
      });
    }

    if (type === 'votes' && memberId) {
      const data = await fetchCongress(`/member/${memberId}/votes`);
      const votes = (data.votes || []).slice(0, 50).map((v: any) => ({
        id: v.vote?.rollNumber || Math.random(),
        bill: v.vote?.bill?.title || v.vote?.description || 'Procedural vote',
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
        policyArea: b.policyArea?.name || '',
      }));
      return NextResponse.json({ bills });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
