import { NextRequest, NextResponse } from 'next/server';

const STAGES = ['introduced', 'committee', 'passed_chamber', 'passed_both', 'signed_into_law', 'failed'] as const;
type Stage = (typeof STAGES)[number];

const STAGE_META: Record<Stage, { label: string; percent: number }> = {
  introduced: { label: 'Introduced', percent: 15 },
  committee: { label: 'In committee', percent: 35 },
  passed_chamber: { label: 'Passed one chamber', percent: 55 },
  passed_both: { label: 'Passed both chambers', percent: 80 },
  signed_into_law: { label: 'Signed into law', percent: 100 },
  failed: { label: 'Did not advance', percent: 0 },
};

const fallback = {
  whatThisMeansForYou: 'This vote covers a topic relevant to federal policy. Check the official record for full details.',
  economicImpact: 'Broader economic effects will depend on how this measure is implemented.',
  stage: 'introduced' as Stage,
  stageLabel: STAGE_META.introduced.label,
  stagePercent: STAGE_META.introduced.percent,
};

export async function POST(request: NextRequest) {
  const { title, description, position, latestAction, location } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  try {
    const prompt = `You are Plainly, a nonpartisan civic education app for US voters near ${location || 'Ohio'}.

Vote: ${title}
Description: ${description || ''}
${position ? `Member's vote: ${position}` : ''}
Latest action on record: ${latestAction || 'unknown'}

Respond with ONLY a valid JSON object, no markdown, no explanation:
{
  "whatThisMeansForYou": "2-3 plain English sentences on how this could affect an average household in the area, no jargon. If mainly procedural, say so.",
  "economicImpact": "1-2 sentences on broader economic implications, or say they're minimal/unclear if accurate.",
  "stage": "one of: introduced, committee, passed_chamber, passed_both, signed_into_law, failed — classify ONLY from the latest action text given above, do not guess beyond it"
}

Be nonpartisan and factual. Do not invent specific statistics, dates, or completion percentages not present in the given latest action text.`;

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

    if (!res.ok) return NextResponse.json(fallback);

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json(fallback);

    const parsed = JSON.parse(jsonMatch[0]);
    const stage: Stage = STAGES.includes(parsed.stage) ? parsed.stage : 'introduced';

    return NextResponse.json({
      whatThisMeansForYou: parsed.whatThisMeansForYou || fallback.whatThisMeansForYou,
      economicImpact: parsed.economicImpact || fallback.economicImpact,
      stage,
      stageLabel: STAGE_META[stage].label,
      stagePercent: STAGE_META[stage].percent,
    });
  } catch (e) {
    console.error('Congress summary error:', e);
    return NextResponse.json(fallback);
  }
}

