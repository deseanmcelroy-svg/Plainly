import type { HouseholdProfile } from './types';

export function getProfileSummary(profile: HouseholdProfile): string | null {
  const bits: string[] = [];
  if (profile.age_range) bits.push(`${profile.age_range} year old`);
  if (profile.housing_status === 'own') bits.push('homeowner');
  if (profile.housing_status === 'rent') bits.push('renter');
  const incomeLabels: Record<string, string> = {
    under_40k: 'under $40K income',
    '40k_80k': '$40K\u2013$80K income',
    '80k_120k': '$80K\u2013$120K income',
    '120k_plus': '$120K+ income',
  };
  if (profile.household_income_range) bits.push(incomeLabels[profile.household_income_range]);
  if (profile.has_school_age_kids) bits.push('school-age kids');
  if (bits.length === 0) return null;
  return `a ${bits.join(', ')}`;
}
