import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

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

// Cache key deliberately excludes `location` and `position` — the
// underlying facts about a bill (what it does, its economic impact, its
// legislative stage) don't change per-user, so every user asking about the
// same bill hits this cache instead of calling Claude again. This is the
// single biggest cost/latency win available here, since the same handful of
// recent votes get tapped by many different users' reps.
async function generateSummaryUncached(title: string, description: string, latestAction: string, location: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const prompt = `You are Plainly, a nonpartisan civic education app for US voters near ${location || 'Ohio'}.

Vote: ${title}
Description: ${description || ''}
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

    if (!res.ok) return fallback;

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]);
    const stage: Stage = STAGES.includes(parsed.stage) ? parsed.stage : 'introduced';

    return {
      whatThisMeansForYou: parsed.whatThisMeansForYou || fallback.whatThisMeansForYou,
      economicImpact: parsed.economicImpact || fallback.economicImpact,
      stage,
      stageLabel: STAGE_META[stage].label,
      stagePercent: STAGE_META[stage].percent,
    };
  } catch (e) {
    console.error('Congress summary error:', e);
    return fallback;
  }
}

export async function POST(request: NextRequest) {
  const { title, description, position, latestAction, location } = await request.json();

  // Cache key includes bill facts AND location — this still gives strong
  // sharing (everyone in the same area asking about the same bill hits the
  // cache), while avoiding one area's "what this means for you" phrasing
  // leaking into a different area's result.
  const cacheKey = `congress-summary:${title}:${description}:${latestAction}:${location}`.slice(0, 250);

  const cachedGenerate = unstable_cache(
    async () => generateSummaryUncached(title, description, latestAction, location),
    [cacheKey],
    { revalidate: 86400 } // 24 hours — bill status rarely changes faster than that
  );

  const result = await cachedGenerate();
  return NextResponse.json(result);
}

