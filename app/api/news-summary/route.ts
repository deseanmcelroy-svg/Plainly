import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { title, description, location } = await request.json();

  const fallback = {
    shortSummary: 'This article covers an important civic topic relevant to voters heading into the November 2026 election.',
    whatYourVoteDoes: [],
    localContext: 'Stay informed on this issue as Election Day approaches in November 2026.',
    relatedTags: ['Election 2026', 'Civic news', 'Voter information'],
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return NextResponse.json(fallback);
  }

  try {
    const prompt = `You are Plainly, a nonpartisan civic education app for US voters near ${location || 'Ohio'}.

Article title: ${title}
Article description: ${description}

Respond with ONLY a valid JSON object. No markdown, no explanation, just the JSON:
{
  "shortSummary": "1-2 plain English sentences explaining what this news means for a voter.",
  "whatYourVoteDoes": [],
  "localContext": "1-2 sentences of helpful background context for a local voter.",
  "relatedTags": ["tag1", "tag2", "tag3"]
}

Only add items to whatYourVoteDoes if there is a specific ballot measure voters will directly vote on. Keep language simple and nonpartisan.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic error:', res.status, err);
      return NextResponse.json(fallback);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      return NextResponse.json(fallback);
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error('Summary error:', e);
    return NextResponse.json(fallback);
  }
}
