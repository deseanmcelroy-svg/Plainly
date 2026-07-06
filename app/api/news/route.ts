import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

function categorize(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  const localTerms = ['county', 'city council', 'school board', 'levy', 'local', 'district', 'township', 'mayor', 'municipal', 'precinct', 'ward'];
  const stateTerms = ['ohio', 'governor', 'state senate', 'state house', 'statehouse', 'attorney general', 'state legislature', 'state budget', 'state law'];
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
    const query = '(election OR ballot OR "voter registration" OR "polling place" OR "ballot measure" OR "city council" OR "school board" OR "state legislature" OR "congressional race" OR "gubernatorial") AND (Ohio OR "United States" OR Congress OR Senate OR "House of Representatives")';

    const domains = 'apnews.com,reuters.com,npr.org,politico.com,thehill.com,usatoday.com,cleveland.com,dispatch.com,wcpo.com,wkyc.com,fox8.com,news5cleveland.com,wews.com';

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&domains=${domains}&apiKey=${NEWS_API_KEY}`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    const data = await res.json();

    if (data.status !== 'ok') {
      // Fall back to broader US election query if domain filter returns nothing
      const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent('election ballot voter 2026 United States')}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
      const fallbackRes = await fetch(fallbackUrl, { next: { revalidate: 1800 } });
      const fallbackData = await fallbackRes.json();
      const articles = (fallbackData.articles || [])
        .filter((a: any) => a.title && a.description && a.url && !a.title.includes('[Removed]'))
        .map((a: any, i: number) => ({
          id: 'article-' + i,
          title: a.title,
          description: a.description,
          url: a.url,
          imageUrl: a.urlToImage,
          source: a.source?.name || 'Unknown',
          publishedAt: a.publishedAt,
          category: categorize(a.title, a.description),
        }));
      return NextResponse.json({ articles });
    }

    const articles = (data.articles || [])
      .filter((a: any) => a.title && a.description && a.url && !a.title.includes('[Removed]'))
      .map((a: any, i: number) => ({
        id: 'article-' + i,
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
