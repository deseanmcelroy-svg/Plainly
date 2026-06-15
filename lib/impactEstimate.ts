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
// Detailed impact page content
// ===========================================================================

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

