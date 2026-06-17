import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MIN_RESPONSES = 5;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizeZip(location: string): string {
  const match = location.match(/\b(\d{5})\b/);
  return match ? match[1] : location.toLowerCase().trim().slice(0, 20);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Not available' }, { status: 503 });
  }

  const body = await request.json();
  const { location, votes } = body;

  if (!location || !Array.isArray(votes) || votes.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const zip = normalizeZip(location);
  const rows = votes.map((v: {
    itemId: string;
    itemTitle: string;
    itemLevel: string;
    selection: string;
  }) => ({
    zip,
    item_id: v.itemId,
    item_title: v.itemTitle,
    item_level: v.itemLevel,
    selection: v.selection,
  }));

  const { error } = await supabase.from('community_votes').insert(rows);
  if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ stats: [] });

  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') ?? '';
  if (!location) return NextResponse.json({ stats: [] });

  const zip = normalizeZip(location);

  const { data, error } = await supabase
    .from('community_votes')
    .select('item_id, item_title, item_level, selection')
    .eq('zip', zip);

  if (error || !data) return NextResponse.json({ stats: [] });

  const byItem: Record<string, {
    itemId: string;
    itemTitle: string;
    itemLevel: string;
    counts: Record<string, number>;
    total: number;
  }> = {};

  for (const row of data) {
    if (!byItem[row.item_id]) {
      byItem[row.item_id] = {
        itemId: row.item_id,
        itemTitle: row.item_title,
        itemLevel: row.item_level,
        counts: {},
        total: 0,
      };
    }
    byItem[row.item_id].counts[row.selection] =
      (byItem[row.item_id].counts[row.selection] ?? 0) + 1;
    byItem[row.item_id].total += 1;
  }

  const stats = Object.values(byItem).map((item) => ({
    itemId: item.itemId,
    itemTitle: item.itemTitle,
    itemLevel: item.itemLevel,
    total: item.total,
    hasEnoughData: item.total >= MIN_RESPONSES,
    breakdown: Object.entries(item.counts)
      .map(([selection, count]) => ({
        selection,
        count,
        percent: Math.round((count / item.total) * 100),
      }))
      .sort((a, b) => b.count - a.count),
  }));

  return NextResponse.json({ stats, zip, minResponses: MIN_RESPONSES });
}
