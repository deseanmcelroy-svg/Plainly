import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

function categorize(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  const localTerms = ['county', 'city council', 'school board', 'levy', 'local', 'district', 'township', 'mayor', 'municipal', 'precinct', 'ward', 'zoning'];
  const stateTerms = ['ohio', 'governor', 'state senate', 'state house', 'statehouse', 'attorney general', 'state legislature', 'state budget', 'state law'];
  if (localTerms.some(t => text.includes(t))) return 'local';
  if (stateTerms.some(t => text.includes(t))) return 'state';
  return 'national';
}

function isRelevant(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  const required = [
    'election', 'ballot', 'voter', 'voting', 'vote', 'candidate',
    'congress', 'senate', 'house of representatives', 'governor',
    'city council', 'school board', 'mayor', 'primary', 'midterm',
    'polling', 'poll', 'campaign', 'legislation', 'referendum',
    'proposition', 'measure', 'levy', 'redistricting', 'caucus'
  ];
  const excluded = [
    'nigeria', 'kenya', 'ghana', 'ekiti', 'osun', 'germany', 'france',
    'uk ', 'britain', 'india', 'pakistan', 'australia', 'canada',
    'china', 'russia', 'ukraine', 'israel', 'iran', 'brazil',
    'sport', 'nba', 'nfl', 'nhl', 'mlb', 'soccer', 'football score',
    'stock', 'crypto', 'bitcoin', 'celebrity', 'entertainment',
    'movie', 'music', 'fashion', 'recipe', 'travel'
  ];
  const hasRequired = required.some(t => text.includes(t));
  const hasExcluded = excluded.some(t => text.includes(t));
  return hasRequired && !hasExcluded;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || '';

  if (!NEWS_API_KEY) {
    return NextResponse.json({ error: 'News API not configured' }, { status: 503 });
  }

  try {
    const locationTerm = location ? ` "${location}" OR Ohio OR` : '';
    const query = `(${locationTerm} "United States" OR Congress OR Senate OR "ballot measure" OR "city council" OR "school board" OR "gubernatorial") AND (election OR ballot OR voter OR voting OR candidate OR legislation OR referendum OR "polling place")`;

    const domains = 'apnews.com,reuters.com,npr.org,politico.com,thehill.com,usatoday.com,cleveland.com,dispatch.com,rollcall.com,fivethirtyeight.com,ballotpedia.org';

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&domains=${domains}&apiKey=${NEWS_API_KEY}`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    const data = await res.json();

    let rawArticles = data.articles || [];

    // If domain filter returns too few, fall back without domain restriction
    if (rawArticles.length < 3) {
      const fallbackQuery = '("United States" OR Congress OR Senate OR Ohio) AND (election 2026 OR ballot measure OR voter registration OR "polling place" OR "city council" OR "school board")';
      const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(fallbackQuery)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
      const fallbackRes = await fetch(fallbackUrl, { next: { revalidate: 1800 } });
      const fallbackData = await fallbackRes.json();
      rawArticles = fallbackData.articles || [];
    }

    const articles = rawArticles
      .filter((a: any) => a.title && a.description && a.url && !a.title.includes('[Removed]'))
      .filter((a: any) => isRelevant(a.title, a.description))
      .slice(0, 10)
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
