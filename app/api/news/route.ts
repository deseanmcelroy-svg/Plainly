import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2/everything';

function categorize(title: string, description: string): 'local' | 'state' | 'national' {
  const text = (title + ' ' + description).toLowerCase();
  const localTerms = ['county', 'city council', 'school board', 'levy', 'local', 'district', 'township', 'mayor'];
  const stateTerms = ['ohio', 'governor', 'state senate', 'state house', 'statehouse', 'attorney general'];
  if (localTerms.some(t => text.includes(t))) return 'local';
  if (stateTerms.some(t => text.includes(t))) return 'state';
  return 'national';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || '';

  if (!NEWS_API_KEY) {
    return NextResponse.json({ error: 'News API not configured' }, { status: 503 });
  }

  try {
    const terms = ['election 2026', 'ballot measure', 'voter', 'civic'];
    if (location) terms.push(location);
    const query = terms.join(' OR ');
    const url = `${BASE_URL}?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    const data = await res.json();

    if (data.status !== 'ok') {
      return NextResponse.json({ error: 'News API error' }, { status: 500 });
    }

    const articles = (data.articles || [])
      .filter((a: any) => a.title && a.description && a.url && !a.title.includes('[Removed]'))
      .map((a: any, i: number) => ({
        id: `article-${i}`,
        title: a.title,
        description: a.description,
        url: a.url,
        imageUrl: a.urlToImage,
        source: a.source?.name || 'Unknown',
        publishedAt: a.publishedAt,
        category: categorize(a.title, a.description),
      }));

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
