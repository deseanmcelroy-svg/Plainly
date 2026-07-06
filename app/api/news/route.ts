import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

async function getLocationFromZip(zip: string): Promise<{ city: string; state: string; stateAbbr: string }> {
  if (!zip || !/^\d{5}$/.test(zip)) return { city: '', state: '', stateAbbr: '' };
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { next: { revalidate: 86400 } });
    if (!res.ok) return { city: '', state: '', stateAbbr: '' };
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return { city: '', state: '', stateAbbr: '' };
    return {
      city: place['place name'] || '',
      state: place['state'] || '',
      stateAbbr: place['state abbreviation'] || '',
    };
  } catch {
    return { city: '', state: '', stateAbbr: '' };
  }
}

function extractZip(input: string): string {
  return input.match(/\b(\d{5})\b/)?.[1] || '';
}

function categorize(title: string, description: string, city: string, state: string, stateAbbr: string): string {
  const text = (title + ' ' + description).toLowerCase();
  const cityL = city.toLowerCase();
  const stateL = state.toLowerCase();
  const stateAbbrL = stateAbbr.toLowerCase();

  const localTerms = [
    'city council', 'school board', 'levy', 'township', 'mayor',
    'municipal', 'precinct', 'ward', 'local election', 'local ballot',
    'county commissioner', 'county election', 'county board',
  ];
  if (cityL && text.includes(cityL)) return 'local';
  if (localTerms.some(t => text.includes(t))) return 'local';

  const stateTerms = [
    'governor', 'state senate', 'state house', 'statehouse',
    'attorney general', 'state legislature', 'state ballot',
    'state election', 'state law', 'state budget', 'secretary of state',
    'state representative', 'state senator',
  ];
  if (stateL && text.includes(stateL)) return 'state';
  if (stateAbbrL && new RegExp(`\\b${stateAbbrL}\\b`).test(text)) return 'state';
  if (stateTerms.some(t => text.includes(t))) return 'state';

  return 'national';
}

function isRelevant(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  const civicTerms = [
    'election', 'ballot', 'voter', 'voting', 'vote', 'candidate',
    'congress', 'senate', 'house of representatives', 'governor',
    'city council', 'school board', 'mayor', 'primary', 'midterm',
    'polling', 'campaign', 'legislation', 'referendum', 'proposition',
    'measure', 'levy', 'redistricting', 'caucus', 'polling place',
    'voter registration', 'absentee', 'early voting', 'electoral',
    'ballot measure', 'runoff', 'special election', 'secretary of state',
    'state legislature', 'county commissioner', 'municipal election',
  ];
  const excluded = [
    'nigeria', 'kenya', 'ghana', 'ekiti', 'osun', 'germany', 'france',
    'britain', 'india', 'pakistan', 'australia', 'china', 'russia',
    'ukraine', 'israel', 'iran', 'brazil', 'mexico', 'africa',
    'nba', 'nfl', 'nhl', 'mlb', 'crypto', 'bitcoin',
    'celebrity', 'entertainment', 'movie', 'music', 'fashion',
  ];
  return civicTerms.some(t => text.includes(t)) && !excluded.some(t => text.includes(t));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locationInput = searchParams.get('location') || '';

  if (!NEWS_API_KEY) {
    return NextResponse.json({ error: 'News API not configured' }, { status: 503 });
  }

  const zip = extractZip(locationInput);
  const { city, state, stateAbbr } = await getLocationFromZip(zip);

  try {
    const locationTerms = [
      city ? `"${city}"` : '',
      state ? `"${state}"` : '',
      '"United States"',
      'Congress',
      'Senate',
    ].filter(Boolean).join(' OR ');

    const civicTerms = 'election OR ballot OR voter OR voting OR candidate OR legislation OR referendum OR "polling place" OR "voter registration" OR "city council" OR "school board" OR "ballot measure" OR "state legislature" OR governor';

    const query = `(${locationTerms}) AND (${civicTerms})`;

    const domains = 'apnews.com,reuters.com,npr.org,politico.com,thehill.com,usatoday.com,rollcall.com,stateline.org,cincinnati.com,cleveland.com,dispatch.com,akronbeaconjournal.com,daytondailynews.com,wtol.com,wkbn.com';

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=30&domains=${domains}&apiKey=${NEWS_API_KEY}`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    const data = await res.json();
    let rawArticles = data.articles || [];

    if (rawArticles.length < 3) {
      const fallbackQuery = `(${state ? '"' + state + '" OR ' : ''}"United States" OR Congress OR Senate) AND (election 2026 OR ballot OR "voter registration" OR "city council" OR "school board" OR governor)`;
      const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(fallbackQuery)}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${NEWS_API_KEY}`;
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
        category: categorize(a.title, a.description, city, state, stateAbbr),
      }));

    return NextResponse.json({ articles, location: { city, state, stateAbbr } });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
