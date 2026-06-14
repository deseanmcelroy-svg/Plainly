// ===========================================================================
// Plain-language helpers for ballot measures
//
// The Google Civic Information API returns official ballot measure text
// (referendumTitle, referendumSubtitle, referendumBrief, referendumText)
// as published by election offices — often dense legal language: defined
// terms, statute citations, "shall" and "WHEREAS" clauses, etc.
//
// This module does rule-based cleanup and restructuring (no AI calls) to
// make that text easier to read:
//   - Strips boilerplate legal phrasing
//   - Caps runaway text to a few sentences
//   - Builds a "what voting yes / no does" summary when the measure
//     follows a recognizable pattern (most do)
//
// This isn't a full rewrite — it's a cleanup pass. For genuinely novel or
// oddly-structured measures, the cleaned text still won't read like a
// human paraphrase, but it will be shorter and free of the worst legalese.
// ===========================================================================

/** Patterns of boilerplate legal phrasing that add no meaning for a reader. */
const BOILERPLATE_PATTERNS: [RegExp, string][] = [
  [/\bshall\s+(?=\w)/gi, 'will '],
  [/\bis\s+hereby\s+/gi, 'is '],
  [/\bpursuant\s+to\b[^,.;]*/gi, ''],
  [/\bnotwithstanding\s+any\s+other\s+provision[^,.;]*/gi, ''],
  [/\bin\s+accordance\s+with\b[^,.;]*/gi, ''],
  [/\bas\s+amended\b/gi, ''],
  [/\bwhereas[^,.;]*[,.;]/gi, ''],
  [/\bbe\s+it\s+(further\s+)?(resolved|enacted)[^,.;]*[,.;]/gi, ''],
  [/\([^()]*\b(?:Stats?\.|Cal\.|U\.S\.C\.|C\.F\.R\.|Rev\.\s*Code|Gov\.\s*Code|§+)[^()]*\)/gi, ''],
  [/§+\s*[\d.]+(\([a-z0-9]+\))*/gi, ''],
  [/\s{2,}/g, ' '],
];

/** Apply boilerplate cleanup and trim the result. */
function cleanLegalText(text: string): string {
  let cleaned = text;
  for (const [pattern, replacement] of BOILERPLATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned.replace(/\s+([,.;])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

/** Split text into sentences (naive but good enough for ballot text). */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const MAX_SUMMARY_SENTENCES = 3;
const MAX_FULL_SENTENCES = 6;

/**
 * Produce a shortened, cleaned-up version of official ballot measure text
 * suitable for the "full" explanation field. Caps length so a single dense
 * paragraph doesn't dominate the card.
 */
export function simplifyMeasureText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const cleaned = cleanLegalText(text);
  if (!cleaned) return undefined;

  const sentences = splitSentences(cleaned);
  if (sentences.length <= MAX_FULL_SENTENCES) return cleaned;

  return sentences.slice(0, MAX_FULL_SENTENCES).join(' ') + ' …';
}

/**
 * Produce a 1-2 sentence summary from official text, for the collapsed
 * card view.
 */
export function summarizeMeasureText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const cleaned = cleanLegalText(text);
  if (!cleaned) return undefined;

  const sentences = splitSentences(cleaned);
  return sentences.slice(0, MAX_SUMMARY_SENTENCES).join(' ');
}

/**
 * Attempt to build a "what voting yes / no does" pair from the measure's
 * title/subtitle/brief. Most ballot measures follow recognizable patterns
 * ("a YES vote means...", bond measures, tax renewals/increases, charter
 * amendments, zoning changes). When no pattern is recognized, returns
 * undefined and the card falls back to just showing the cleaned summary
 * text.
 */
export function buildVoteMeaning(
  title: string,
  subtitle: string | undefined,
  brief: string | undefined
): { yes: string; no: string } | undefined {
  const combined = [title, subtitle, brief].filter(Boolean).join(' ');
  const lower = combined.toLowerCase();

  // Explicit "A YES vote means... A NO vote means..." pattern — sometimes
  // present verbatim in referendumBrief or referendumText.
  const yesMatch = combined.match(/a\s+"?yes"?\s+vote\s+means?\s*:?\s*([^.]+\.)/i);
  const noMatch = combined.match(/a\s+"?no"?\s+vote\s+means?\s*:?\s*([^.]+\.)/i);
  if (yesMatch && noMatch) {
    return {
      yes: cleanLegalText(yesMatch[1]),
      no: cleanLegalText(noMatch[1]),
    };
  }

  // Bond measures: "shall the [district] issue bonds in the amount of $X..."
  const bondMatch = combined.match(
    /bonds?\s+in\s+(?:the\s+)?(?:amount|principal\s+amount)\s+of\s+\$?([\d,.]+\s*(?:million|billion)?)/i
  );
  if (bondMatch) {
    const amount = bondMatch[1].trim();
    return {
      yes: `The bond is approved \u2014 the government can borrow up to $${amount} for the project(s) described, to be paid back over time (typically through property taxes).`,
      no: 'The bond is not approved, and the government cannot borrow this money for the described project(s).',
    };
  }

  // Tax measures (renewal vs. increase)
  const isTaxRenewal = /renew|continu|extend/.test(lower) && /tax/.test(lower);
  const isTaxIncrease = /increase|additional/.test(lower) && /tax/.test(lower);
  if (isTaxRenewal) {
    return {
      yes: 'The existing tax continues at its current rate, maintaining current funding levels.',
      no: 'The tax expires, which would reduce funding for the programs or services it pays for.',
    };
  }
  if (isTaxIncrease) {
    return {
      yes: 'The tax increase is approved, raising additional revenue for the purpose described.',
      no: 'The tax stays at its current rate \u2014 no additional revenue is raised for this purpose.',
    };
  }

  // Charter amendments
  if (/charter/.test(lower) && /amend/.test(lower)) {
    return {
      yes: 'The charter (the local government\u2019s foundational governing document) is amended as described.',
      no: 'The charter stays as it currently is \u2014 the proposed change does not take effect.',
    };
  }

  // Zoning / land use measures
  if (/zon(e|ing)|land\s+use/.test(lower)) {
    return {
      yes: 'The zoning or land-use change described is approved and takes effect.',
      no: 'The zoning or land-use change does not happen \u2014 current rules stay in place.',
    };
  }

  // Generic "shall ... be approved/authorized/adopted" pattern
  if (/(approv|authoriz|adopt|enact)/.test(lower)) {
    return {
      yes: 'The proposal described is approved and takes effect.',
      no: 'The proposal does not take effect \u2014 things stay as they currently are.',
    };
  }

  return undefined;
}
