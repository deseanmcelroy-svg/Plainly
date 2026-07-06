import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { title, description, location } = await request.json();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are Plainly, a nonpartisan civic education app. A voter near ${location || 'Ohio'} is reading this news article:

Title: ${title}
Summary: ${description}

Generate a JSON response with these exact fields:
{
  "shortSummary": "2 sentences max. What this means for the average voter. Plain English, no jargon.",
  "whatYourVoteDoes": [
    {"vote": "YES", "means": "what a yes vote means in plain terms"},
    {"vote": "NO", "means": "what a no vote means in plain terms"}
  ],
  "localContext": "2-3 sentences of relevant background context a local voter would want to know.",
  "relatedTags": ["3-4 short topic tags related to this story"]
}

If the article is not about something voters directly vote on, leave whatYourVoteDoes as an empty array.
Return only valid JSON, no other text.`
        }]
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      shortSummary: 'This article covers an important civic topic relevant to your ballot.',
      whatYourVoteDoes: [],
      localContext: 'Check back for more context on this story.',
      relatedTags: ['Civic news']
    });
  }
}
