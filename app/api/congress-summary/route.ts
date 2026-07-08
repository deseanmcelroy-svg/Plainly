import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const fallback = {
  shortSummary: 'This legislation addresses an important civic matter affecting voters and communities.',
  householdImpact: [
    'May affect household budgets and local services',
    'Could impact community infrastructure and resources',
  ],
  economicImpact: [
    'Has implications for local and national economic conditions',
    'May affect job markets and business conditions',
  ],
  currentUpdate: 'Implementation details are ongoing. Check congress.gov for the latest updates.',
  relatedTags: ['Federal legislation', 'Civic policy'],
};

export async function POST(request: NextRequest) {
  const { title, description, vote, memberName, location, type } = await request.json();

  if (!ANTHROPIC_API_KEY) return NextResponse.json(fallback);

  try {
    const prompt = `You are Plainly, a nonpartisan civic education app for voters near ${location || 'Ohio'}.

A voter is viewing this ${type === 'bill' ? 'bill sponsored by' : 'vote cast by'} ${memberName}:

Title: ${title}
${description ? `Description: ${description}` : ''}
${vote ? `Their vote: ${vote}` : ''}

Respond with ONLY a valid JSON object, no markdown:
{
  "shortSummary": "2 sentences in plain English explaining what this ${type === 'bill' ? 'bill' : 'vote'} is about and why it matters to voters.",
  "householdImpact": [
    "Specific impact on household budgets, costs, or daily life — include dollar estimates where possible",
    "Second specific household impact"
  ],
  "economicImpact": [
    "Specific local or national economic impact — include job numbers or dollar figures where possible",
    "Second economic impact for Ohio or the broader region"
  ],
  "currentUpdate": "1-2 sentences on the current status or real-world implementation as of mid-2026. Be specific if possible.",
  "relatedTags": ["tag1", "tag2", "tag3"]
}

Keep everything nonpartisan, factual, and in plain English. No jargon.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return NextResponse.json(fallback);

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json(fallback);
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json(fallback);
  }
}
