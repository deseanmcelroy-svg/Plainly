import { BallotItem, HouseholdProfile, ImpactEstimate } from './types';

// ===========================================================================
// Household impact estimates
//
// Given a user's optional household profile (broad brackets only — see
// types.ts) and a ballot measure, estimate roughly what it might mean for
// a household like theirs. This is necessarily approximate: actual tax
// rates, assessment ratios, and formulas vary by jurisdiction and aren't
// available from the Civic API. The goal is order-of-magnitude framing
// ("a few hundred dollars a year" vs "a few dollars a year"), not a
// precise bill.
//
// Every estimate explains its basis in plain language and is framed as
// approximate ("roughly", "about") to avoid implying false precision.
// ===========================================================================

/** Midpoint dollar value used for home-value-based estimates. */
const HOME_VALUE_MIDPOINT: Record<NonNullable<HouseholdProfile['home_value_range']>, number> = {
  under_150k: 120000,
  '150k_300k': 225000,
  '300k_500k': 400000,
  '500k_plus': 600000,
};

/** Midpoint dollar value used for income-based estimates. */
const INCOME_MIDPOINT: Record<NonNullable<HouseholdProfile['household_income_range']>, number> = {
  under_40k: 30000,
  '40k_80k': 60000,
  '80k_120k': 100000,
  '120k_plus': 150000,
};

/** Round to the nearest $5 below $100, nearest $25 above. */
function roundDollars(amount: number): number {
  return amount < 100 ? Math.round(amount / 5) * 5 : Math.round(amount / 25) * 25;
}

/**
 * Format an annual dollar amount as "roughly $X/year (about $Y/month)".
 * For very small amounts, simplifies to avoid implying false precision.
 */
function formatAnnualWithMonthly(annual: number): string {
  if (annual < 1) {
    return 'less than $1 a year \u2014 basically nothing';
  }

  const rounded = roundDollars(annual);
  const monthly = annual / 12;

  if (rounded < 12) {
    // Too small to meaningfully break into a monthly figure.
    return `roughly $${rounded.toLocaleString()} a year \u2014 just a few dollars`;
  }

  const roundedMonthly = monthly < 10 ? Math.round(monthly) : roundDollars(monthly);
  return `roughly $${rounded.toLocaleString()} a year, or about $${roundedMonthly.toLocaleString()} a month`;
}

function extractMillage(text: string): number | null {
  const match = text.match(/([\d.]+)\s*mills?\b/i);
  return match ? parseFloat(match[1]) : null;
}

function extractPercent(text: string): number | null {
  const match = text.match(/([\d.]+)\s*(?:%|percent)/i);
  return match ? parseFloat(match[1]) : null;
}

export function estimatePropertyTaxImpact(item: BallotItem, homeValue: number): ImpactEstimate {
  const text = [item.title, item.summary, item.full, item.sourceText].filter(Boolean).join(' ');
  const millage = extractMillage(text);

  if (millage !== null) {
    const assessedValue = homeValue * 0.35;
    const annualCost = (millage / 1000) * assessedValue;
    return {
      amount: formatAnnualWithMonthly(annualCost),
      basis: `If this passes, that's roughly what you'd see added to your property tax bill. We worked it out from the ${millage}-mill rate on the ballot, applied to about 35% of your home's value (a common way assessed value is calculated) \u2014 your county's actual formula may differ a bit.`,
    };
  }

  const percent = extractPercent(text);
  if (percent !== null) {
    const annualCost = homeValue * (percent / 100);
    return {
      amount: formatAnnualWithMonthly(annualCost),
      basis: `Based on the ${percent}% rate mentioned on the ballot, applied to a home in your value range. The exact formula can vary by location, so think of this as a ballpark.`,
    };
  }

  const annualCost = homeValue * 0.0005;
  return {
    amount: formatAnnualWithMonthly(annualCost),
    basis: "The ballot text doesn't spell out an exact rate, so this is a rough guess based on what similar small levies typically run for a home in your value range \u2014 take it as a ballpark, not a bill.",
  };
}

function estimateIncomeTaxImpact(item: BallotItem, income: number): ImpactEstimate {
  const text = [item.title, item.summary, item.full, item.sourceText].filter(Boolean).join(' ');
  const percent = extractPercent(text);

  if (percent !== null) {
    const annualCost = income * (percent / 100);
    return {
      amount: formatAnnualWithMonthly(annualCost),
      basis: `This is ${percent}% of household income in your bracket, spread across the year. Deductions, exemptions, and your exact income within the range could shift this up or down a bit.`,
    };
  }

  return {
    amount: "Depends on the rate \u2014 not specified",
    basis: "This measure looks like it touches income taxes, but the ballot text doesn't list a specific rate, so we can't put a number on it for your household.",
  };
}

/**
 * Build an impact estimate for a ballot measure given a household profile.
 * Returns null if the measure doesn't appear to be a tax/funding measure,
 * or if the profile doesn't have the fields needed for this measure type.
 */
export function estimateImpact(item: BallotItem, profile: HouseholdProfile): ImpactEstimate | null {
  if (item.level !== 'local' && item.level !== 'state') return null;

  const text = [item.title, item.summary, item.full].filter(Boolean).join(' ').toLowerCase();
  const isPropertyRelated = /property\s+tax|levy|mill|bond|renews?\s+an?\s+existing\s+tax|continu\w*\s+(?:the\s+)?(?:current\s+)?tax|existing\s+tax/.test(text);
  const isIncomeRelated = /income\s+tax|earnings\s+tax|payroll\s+tax/.test(text);
  const isSchoolMeasure = /school|education|district/.test(text);

  if (isSchoolMeasure && profile.has_school_age_kids === true && !isPropertyRelated && !isIncomeRelated) {
    return {
      amount: 'Worth a closer look \u2014 this is about your kids\u2019 schools',
      basis: "Since you've got school-age kids, this one's about funding for the schools they're in (or will be). It doesn't look like it changes your taxes directly, but it could affect things like staffing, programs, or supplies.",
    };
  }

  if (isPropertyRelated && profile.housing_status === 'own' && profile.home_value_range) {
    const homeValue = HOME_VALUE_MIDPOINT[profile.home_value_range];
    const estimate = estimatePropertyTaxImpact(item, homeValue);

    if (isSchoolMeasure && profile.has_school_age_kids === true) {
      return {
        ...estimate,
        basis: `${estimate.basis} On top of the cost, this also funds your local schools \u2014 which you told us matter to your household.`,
      };
    }
    return estimate;
  }

  if (isPropertyRelated && profile.housing_status === 'rent') {
    return {
      amount: 'Probably not billed to you directly',
      basis: 'Property taxes usually land on your landlord\u2019s bill, not yours \u2014 though costs like this can sometimes work their way into rent over time.',
    };
  }

  if (isIncomeRelated && profile.household_income_range) {
    const income = INCOME_MIDPOINT[profile.household_income_range];
    return estimateIncomeTaxImpact(item, income);
  }

  // Zoning / land use measures: relevance depends on housing status.
  const isZoningMeasure = /zon(e|ing)|land\s+use|housing\s+density|rezon/.test(text);
  if (isZoningMeasure) {
    if (profile.housing_status === 'own') {
      return {
        amount: 'Could affect your property and neighborhood',
        basis: "Zoning changes can influence what gets built near you, which can affect both your home's value and what your neighborhood looks like over time.",
      };
    }
    if (profile.housing_status === 'rent') {
      return {
        amount: 'Could affect housing options near you',
        basis: 'Zoning changes can affect how much housing gets built in an area, which over time can influence rent prices and availability.',
      };
    }
  }

  // Candidate races: no dollar estimate, but offer brief profile-aware
  // framing so every expanded item shows *something* when a profile exists.
  if (!item.voteMeaning) {
    if (item.level === 'local') {
      return {
        amount: 'A local race worth knowing about',
        basis: "This person would represent your area directly \u2014 local officials often have more day-to-day impact on things like roads, schools, and services than people realize.",
      };
    }
    return {
      amount: 'A state-level race',
      basis: 'This person would represent your state in shaping state-level policy \u2014 things like taxes, education funding, and infrastructure.',
    };
  }

  // Generic fallback for measures we couldn't classify more specifically.
  if (profile.has_school_age_kids === true && isSchoolMeasure) {
    return {
      amount: 'Related to local schools',
      basis: "This touches on schools in your area, which you told us matters to your household \u2014 worth a closer look even though we can't put a number on it.",
    };
  }

  return {
    amount: "We can't estimate a dollar impact for this one",
    basis: "This measure doesn't look like a tax or fee we can size up from the published text \u2014 but it's still worth reading through, since local measures often have effects beyond what shows up on a bill.",
  };
}

/** True if the profile has at least one field filled in. */
export function hasProfileData(profile: HouseholdProfile): boolean {
  return Object.values(profile).some((v) => v !== null && v !== undefined);
}

export const EMPTY_PROFILE: HouseholdProfile = {
  age_range: null,
  housing_status: null,
  home_value_range: null,
  household_income_range: null,
  has_school_age_kids: null,
};

// ===========================================================================
// Practice ballot: issue-specific real-world synopsis
//
// Detects what a measure is actually funding/changing and produces a
// plain-language synopsis tied to that specific issue, plus a real-world
// example grounded in the user's household profile.
// ===========================================================================

/** Detect what a measure is primarily about from its text. */
function detectMeasurePurpose(text: string): string {
  const t = text.toLowerCase();
  if (/school|classroom|teacher|student|education|district/.test(t)) return 'schools';
  if (/road|street|pothole|pavement|highway|bridge|traffic/.test(t)) return 'roads';
  if (/park|recreation|trail|greenspace|playground/.test(t)) return 'parks';
  if (/police|sheriff|law enforcement|public safety|fire|emergency/.test(t)) return 'public safety';
  if (/library|librari/.test(t)) return 'library';
  if (/water|sewer|sanitation|utility/.test(t)) return 'utilities';
  if (/transit|bus|rail|transportation/.test(t)) return 'transit';
  if (/hospital|health|medical|clinic/.test(t)) return 'healthcare';
  if (/senior|elder|aging/.test(t)) return 'senior services';
  if (/affordable\s+housing|low.income\s+housing/.test(t)) return 'affordable housing';
  if (/zon(e|ing)|land\s+use|rezon/.test(t)) return 'zoning';
  if (/bond/.test(t)) return 'bond';
  if (/charter/.test(t)) return 'charter';
  return 'general';
}

/** Real-world example sentences by measure purpose + profile combination. */
function buildRealWorldExample(
  purpose: string,
  profile: HouseholdProfile,
  isRenewal: boolean,
  isBond: boolean
): string {
  const hasKids = profile.has_school_age_kids === true;
  const isOwner = profile.housing_status === 'own';
  const isRenter = profile.housing_status === 'rent';

  switch (purpose) {
    case 'schools':
      if (hasKids && isOwner)
        return `For example: if this ${isRenewal ? 'renewal' : 'measure'} passes, the schools your kids attend could keep their current staffing and programs. If it fails, the district may need to cut electives, increase class sizes, or reduce extracurriculars to balance the budget.`;
      if (hasKids)
        return `For example: if this passes, the schools your kids attend maintain current funding levels. If it fails, expect potential cuts to programs, staffing, or supplies.`;
      if (isOwner)
        return `For example: well-funded local schools tend to support neighborhood property values. If this fails, budget cuts at local schools can affect the broader community — and sometimes home values — over time.`;
      return `For example: if this passes, local schools keep their current funding for teachers, supplies, and programs. If it fails, the district typically has to make cuts somewhere to balance its budget.`;

    case 'roads':
      if (isOwner)
        return `For example: think about a pothole-riddled street near your home, or a bridge that's been under repair for years. This kind of measure typically funds resurfacing, repairs, and maintenance that otherwise gets deferred indefinitely.`;
      if (isRenter)
        return `For example: this typically funds things like road resurfacing, pothole repairs, and sidewalk maintenance in your area — improvements you'd notice on your daily commute or walk.`;
      return `For example: this kind of measure funds everyday road upkeep — filling potholes, repaving worn streets, and maintaining bridges in your area.`;

    case 'parks':
      if (hasKids)
        return `For example: this could mean keeping your local playground equipment maintained, trails open, or recreation programs running — things your kids might use directly.`;
      return `For example: this typically funds things like trail maintenance, park facilities, and recreation programming in your community — the kinds of spaces most people use regularly.`;

    case 'public safety':
      return `For example: this kind of measure typically funds things like additional officers or firefighters, updated equipment, or faster emergency response times. Most households don't notice this until they need 911 — and then it matters a lot.`;

    case 'library':
      if (hasKids)
        return `For example: library funding often covers children's programs, summer reading, and after-school resources your kids might use — as well as digital resources and community meeting spaces.`;
      return `For example: library levies typically fund hours of operation, digital access, programming, and staffing. Many libraries reduce hours or cut services when this funding lapses.`;

    case 'utilities':
      if (isOwner)
        return `For example: water and sewer infrastructure improvements can affect your monthly utility bill and the reliability of service — aging pipes mean more main breaks and outages.`;
      return `For example: utility measures typically address aging water mains, sewer upgrades, or treatment plant improvements that affect service reliability for everyone in the area.`;

    case 'transit':
      return `For example: this could affect bus frequency, route coverage, or fare prices in your area. Transit funding often determines whether a bus runs every 15 minutes or every hour.`;

    case 'healthcare':
      return `For example: community health measures often fund clinics, emergency services, or mental health programs that serve residents regardless of insurance status.`;

    case 'senior services':
      if ((profile.age_range === '55-64' || profile.age_range === '65+'))
        return `For example: as someone in an older age bracket, this measure could directly affect services like meal delivery, transportation assistance, or senior center programs available to you.`;
      return `For example: senior services measures typically fund meal delivery, transportation assistance, and community programs for older residents — often people's parents or neighbors.`;

    case 'affordable housing':
      if (isRenter)
        return `For example: as a renter, affordable housing measures can affect the availability and cost of rental units in your area over time — more supply generally means more competition among landlords.`;
      if (isOwner)
        return `For example: as a homeowner, this affects who can afford to live in your community. More affordable housing options can help teachers, healthcare workers, and others who work locally but struggle with costs.`;
      return `For example: affordable housing measures typically fund subsidized units, down-payment assistance, or zoning changes that allow more housing to be built at lower price points.`;

    case 'zoning':
      if (isOwner)
        return `For example: if this rezoning passes, you might see new apartments, townhomes, or commercial buildings in areas that currently allow only single-family houses. For homeowners, this can mean more neighbors and activity nearby — which some see as improvement, others as unwanted density.`;
      if (isRenter)
        return `For example: if this rezoning passes, more housing could be built in your area, which over time tends to increase rental options and moderate prices. If it fails, current restrictions stay in place.`;
      return `For example: zoning changes affect what can be built near you — denser housing, mixed-use buildings, or new commercial development. The long-term effect on your neighborhood depends on the specifics.`;

    case 'bond':
      if (isOwner)
        return `For example: bond measures work like a community mortgage — the government borrows money now for a big project (like a new school building or road overhaul), and property owners pay it back gradually over 10–30 years through a small annual tax addition.`;
      return `For example: bond measures let the government borrow money now for big projects and pay it back over time — like a mortgage, but for public infrastructure. The repayment comes from property taxes.`;

    case 'charter':
      return `For example: charter amendments change the rules of how your local government operates — things like term limits, how officials are elected, or how the budget process works. The effects are structural rather than immediate.`;

    default:
      if (isOwner)
        return `For example: local measures like this often fund services you use but don't think about until they're cut — road repairs, parks, libraries, or community programs. As a homeowner, these also tend to affect the quality and desirability of your neighborhood over time.`;
      return `For example: local measures typically fund community services that affect day-to-day life — things that often go unnoticed when funded but are quickly missed when they're cut.`;
  }
}

/**
 * Build a practice-ballot-specific impact synopsis: ties the estimate to
 * the specific issue/policy the measure is about, and adds a real-world
 * example grounded in the user's household profile.
 *
 * Returns { synopsis, realWorldExample } to be displayed separately in the
 * practice ballot expanded card.
 */
export function buildPracticeImpactSynopsis(
  item: BallotItem,
  profile: HouseholdProfile
): { synopsis: string; realWorldExample: string } | null {
  const impact = estimateImpact(item, profile);
  if (!impact) return null;

  const text = [item.title, item.summary, item.full].filter(Boolean).join(' ');
  const lower = text.toLowerCase();
  const purpose = detectMeasurePurpose(lower);
  const isRenewal = /renew|continu|extend/.test(lower) && /tax|levy/.test(lower);
  const isBond = /bond/.test(lower);

  const realWorldExample = buildRealWorldExample(purpose, profile, isRenewal, isBond);

  // Build the synopsis by combining the impact amount with purpose-aware framing.
  let synopsis = impact.basis;

  // Prepend a purpose-specific opener so it's tied to the actual issue.
  const purposeLabel: Record<string, string> = {
    schools: 'This is a school funding measure',
    roads: 'This funds road and infrastructure work',
    parks: 'This funds parks and recreation',
    'public safety': 'This funds public safety services',
    library: 'This funds your local library',
    utilities: 'This funds utility infrastructure',
    transit: 'This funds public transit',
    healthcare: 'This funds community health services',
    'senior services': 'This funds senior services',
    'affordable housing': 'This addresses affordable housing',
    zoning: 'This is a zoning or land-use measure',
    bond: 'This is a bond measure',
    charter: 'This is a charter amendment',
    general: 'This is a local measure',
  };

  const opener = purposeLabel[purpose] ?? 'This is a local measure';
  synopsis = `${opener}. ${impact.basis}`;

  return { synopsis, realWorldExample };
}

const HOME_VALUE_LABELS: Record<NonNullable<HouseholdProfile['home_value_range']>, string> = {
  under_150k: 'under $150,000',
  '150k_300k': '$150,000\u2013$300,000',
  '300k_500k': '$300,000\u2013$500,000',
  '500k_plus': '$500,000+',
};

/**
 * For property-tax measures, build a comparison table showing the estimated
 * annual cost across all home value brackets, so a user can see how their
 * estimate compares to other households \u2014 and get a sense of the range
 * even if their own bracket is approximate.
 */
export function buildHomeValueComparison(item: BallotItem): { label: string; amount: string }[] | null {
  const text = [item.title, item.summary, item.full, item.sourceText].filter(Boolean).join(' ').toLowerCase();
  const isPropertyRelated = /property\s+tax|levy|mill|bond|renews?\s+an?\s+existing\s+tax|continu\w*\s+(?:the\s+)?(?:current\s+)?tax|existing\s+tax/.test(text);
  if (!isPropertyRelated) return null;

  return (Object.keys(HOME_VALUE_MIDPOINT) as Array<keyof typeof HOME_VALUE_MIDPOINT>).map((key) => {
    const estimate = estimatePropertyTaxImpact(item, HOME_VALUE_MIDPOINT[key]);
    return { label: HOME_VALUE_LABELS[key], amount: estimate.amount };
  });
}

/**
 * Extra plain-language context for the detail page, beyond the short
 * basis shown on the card \u2014 explains the broader mechanism (how local
 * tax measures work, what happens if a measure fails, etc.) so the detail
 * page feels substantive rather than just repeating the card.
 */
export function buildAdditionalContext(item: BallotItem, profile: HouseholdProfile): string[] {
  const notes: string[] = [];
  const text = [item.title, item.summary, item.full].filter(Boolean).join(' ').toLowerCase();

  const isPropertyRelated = /property\s+tax|levy|mill|bond|renews?\s+an?\s+existing\s+tax|continu\w*\s+(?:the\s+)?(?:current\s+)?tax|existing\s+tax/.test(text);
  const isBond = /bond/.test(text);
  const isRenewal = /renew|continu|extend/.test(text);
  const isNewOrIncrease = /new\s+tax|increase|additional/.test(text);
  const isSchoolMeasure = /school|education|district/.test(text);

  if (isPropertyRelated) {
    notes.push(
      'Property taxes are billed by your county once or twice a year, not monthly \u2014 the "per month" figure here is just the yearly amount divided by 12, to make it easier to compare to a regular bill.'
    );
  }

  if (isBond) {
    notes.push(
      'Bond measures let the government borrow money now (for a big project like a new building) and pay it back over many years \u2014 similar to a mortgage. The cost shown reflects your share of those payments while the bond is being paid off, typically 10\u201330 years.'
    );
  } else if (isRenewal) {
    notes.push(
      'This is a renewal, meaning the tax already exists \u2014 if it passes, your bill shouldn\u2019t change from what you\u2019re paying now. If it fails, this funding source goes away, which usually means cuts somewhere or a different measure on a future ballot.'
    );
  } else if (isNewOrIncrease) {
    notes.push(
      'This would be new or additional, meaning it would add to what you currently pay if it passes. If it fails, your bill stays the same.'
    );
  }

  if (isSchoolMeasure) {
    if (profile.has_school_age_kids === true) {
      notes.push(
        'Because you have school-age kids, this one\u2019s worth extra attention \u2014 school funding directly shapes class sizes, programs, and staffing at the schools they attend.'
      );
    } else {
      notes.push(
        'Even without school-age kids in your household, school funding measures can affect property values and the broader community \u2014 strong local schools are often cited as a factor in home values.'
      );
    }
  }

  if (profile.housing_status === 'rent' && isPropertyRelated) {
    notes.push(
      'As a renter, you don\u2019t receive a property tax bill directly. Landlords sometimes pass increased costs through in future rent, but this typically happens gradually (if at all) and isn\u2019t an automatic or immediate change.'
    );
  }

  if (notes.length === 0) {
    notes.push(
      'We don\u2019t have a specific cost breakdown for this one, but it\u2019s still worth reading the full ballot text \u2014 local measures can have effects (on services, zoning, or community priorities) that don\u2019t show up as a line item on a bill.'
    );
  }

  return notes;
}

