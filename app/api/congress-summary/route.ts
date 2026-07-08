import { NextRequest, NextResponse } from 'next/server';

const fallback = {
  plainSummary: 'This bill or vote covers a topic relevant to federal policy. Check the official record for full details.',
  householdImpact: 'Impact on individual households varies and depends on final implementation.',
  economicImpact: 'Broader economic effects will depend on how this measure is implemented.',
  implementationUpdate: 'Check Congress.gov for the latest status on this item.',
  relatedTags: ['Congress', 'Federal policy'],
};

export async function POST(request: NextRequest) {
  const { title, description, billNumber, position, latestAction, location } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return NextResponse.json(fallback);
  }

  try {
    const prompt = `You are Plainly, a nonpartisan civic education app for US voters near ${location || 'Ohio'}.

Item: ${billNumber || ''} — ${title}
Description: ${description || ''}
${position ? `Member's vote: ${position}` : ''}
${latestAction ? `Latest action: ${latestAction}` : ''}

Respond with ONLY a valid JSON object, no markdown, no explanation:
{
  "plainSummary": "2-3 plain English sentences explaining what this bill or vote is about, no jargon.",
  "householdImpact": "1-2 sentences on how this could affect an average household, or say it's mainly procedural if that's the case.",
  "economicImpact": "1-2 sentences on the broader economic implications, or say they're minimal/unclear if that's accurate.",
  "implementationUpdate": "1-2 sentences on the current real-world status: has it passed, is it in committee, has it taken effect.",
  "relatedTags": ["tag1", "tag2", "tag3"]
}

Be nonpartisan and factual. If information is genuinely uncertain, say so rather than inventing specifics.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
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
    console.error('Congress summary error:', e);
    return NextResponse.json(fallback);
  }
}
