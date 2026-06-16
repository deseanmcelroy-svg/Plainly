// ===========================================================================
// ZIP code -> state lookup
//
// U.S. ZIP codes are assigned in contiguous blocks by state, which is
// stable public data (unchanged in decades) -- no API call needed.
//
// Used to link to a state's official voter information page (e.g.
// vote.gov/register/ohio) based on a ZIP code, without storing or needing
// any state-specific voting rules ourselves.
// ===========================================================================

export interface StateInfo {
  name: string;
  /** Slug used in vote.gov/register/{slug} URLs */
  slug: string;
}

// 3-digit ZIP prefix ranges -> state. Ranges are inclusive on both ends.
const ZIP_RANGES: { start: number; end: number; state: StateInfo }[] = [
  { start: 6, end: 9, state: { name: 'Puerto Rico', slug: 'puerto-rico' } },
  { start: 10, end: 27, state: { name: 'Massachusetts', slug: 'massachusetts' } },
  { start: 28, end: 29, state: { name: 'Rhode Island', slug: 'rhode-island' } },
  { start: 30, end: 38, state: { name: 'New Hampshire', slug: 'new-hampshire' } },
  { start: 39, end: 49, state: { name: 'Maine', slug: 'maine' } },
  { start: 50, end: 59, state: { name: 'Vermont', slug: 'vermont' } },
  { start: 60, end: 69, state: { name: 'Connecticut', slug: 'connecticut' } },
  { start: 70, end: 89, state: { name: 'New Jersey', slug: 'new-jersey' } },
  { start: 100, end: 149, state: { name: 'New York', slug: 'new-york' } },
  { start: 150, end: 196, state: { name: 'Pennsylvania', slug: 'pennsylvania' } },
  { start: 197, end: 199, state: { name: 'Delaware', slug: 'delaware' } },
  { start: 200, end: 200, state: { name: 'District of Columbia', slug: 'district-of-columbia' } },
  { start: 201, end: 201, state: { name: 'Virginia', slug: 'virginia' } },
  { start: 202, end: 205, state: { name: 'District of Columbia', slug: 'district-of-columbia' } },
  { start: 206, end: 219, state: { name: 'Maryland', slug: 'maryland' } },
  { start: 220, end: 246, state: { name: 'Virginia', slug: 'virginia' } },
  { start: 247, end: 268, state: { name: 'West Virginia', slug: 'west-virginia' } },
  { start: 270, end: 289, state: { name: 'North Carolina', slug: 'north-carolina' } },
  { start: 290, end: 299, state: { name: 'South Carolina', slug: 'south-carolina' } },
  { start: 300, end: 319, state: { name: 'Georgia', slug: 'georgia' } },
  { start: 320, end: 349, state: { name: 'Florida', slug: 'florida' } },
  { start: 350, end: 369, state: { name: 'Alabama', slug: 'alabama' } },
  { start: 370, end: 385, state: { name: 'Tennessee', slug: 'tennessee' } },
  { start: 386, end: 397, state: { name: 'Mississippi', slug: 'mississippi' } },
  { start: 398, end: 399, state: { name: 'Georgia', slug: 'georgia' } },
  { start: 400, end: 427, state: { name: 'Kentucky', slug: 'kentucky' } },
  { start: 430, end: 459, state: { name: 'Ohio', slug: 'ohio' } },
  { start: 460, end: 479, state: { name: 'Indiana', slug: 'indiana' } },
  { start: 480, end: 499, state: { name: 'Michigan', slug: 'michigan' } },
  { start: 500, end: 528, state: { name: 'Iowa', slug: 'iowa' } },
  { start: 530, end: 549, state: { name: 'Wisconsin', slug: 'wisconsin' } },
  { start: 550, end: 567, state: { name: 'Minnesota', slug: 'minnesota' } },
  { start: 570, end: 577, state: { name: 'South Dakota', slug: 'south-dakota' } },
  { start: 580, end: 588, state: { name: 'North Dakota', slug: 'north-dakota' } },
  { start: 590, end: 599, state: { name: 'Montana', slug: 'montana' } },
  { start: 600, end: 629, state: { name: 'Illinois', slug: 'illinois' } },
  { start: 630, end: 658, state: { name: 'Missouri', slug: 'missouri' } },
  { start: 660, end: 679, state: { name: 'Kansas', slug: 'kansas' } },
  { start: 680, end: 693, state: { name: 'Nebraska', slug: 'nebraska' } },
  { start: 700, end: 715, state: { name: 'Louisiana', slug: 'louisiana' } },
  { start: 716, end: 729, state: { name: 'Arkansas', slug: 'arkansas' } },
  { start: 730, end: 749, state: { name: 'Oklahoma', slug: 'oklahoma' } },
  { start: 750, end: 799, state: { name: 'Texas', slug: 'texas' } },
  { start: 800, end: 816, state: { name: 'Colorado', slug: 'colorado' } },
  { start: 820, end: 831, state: { name: 'Wyoming', slug: 'wyoming' } },
  { start: 832, end: 838, state: { name: 'Idaho', slug: 'idaho' } },
  { start: 840, end: 847, state: { name: 'Utah', slug: 'utah' } },
  { start: 850, end: 865, state: { name: 'Arizona', slug: 'arizona' } },
  { start: 870, end: 884, state: { name: 'New Mexico', slug: 'new-mexico' } },
  { start: 889, end: 898, state: { name: 'Nevada', slug: 'nevada' } },
  { start: 900, end: 961, state: { name: 'California', slug: 'california' } },
  { start: 967, end: 968, state: { name: 'Hawaii', slug: 'hawaii' } },
  { start: 970, end: 979, state: { name: 'Oregon', slug: 'oregon' } },
  { start: 980, end: 994, state: { name: 'Washington', slug: 'washington' } },
  { start: 995, end: 999, state: { name: 'Alaska', slug: 'alaska' } },
];

/**
 * Look up the U.S. state for a given input, which may be a ZIP code or a
 * partial address containing a ZIP code. Returns null if no ZIP code was
 * found or it doesn't match a known range.
 */
export function stateFromZip(input: string): StateInfo | null {
  const match = input.match(/\b(\d{5})\b/);
  if (!match) return null;

  const zip = parseInt(match[1], 10);
  const prefix = Math.floor(zip / 100);

  for (const range of ZIP_RANGES) {
    if (prefix >= range.start && prefix <= range.end) {
      return range.state;
    }
  }

  return null;
}
