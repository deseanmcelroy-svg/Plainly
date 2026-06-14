import { GovernmentRoleSection } from './types';

// ===========================================================================
// Government role explanations
//
// This content explains what each level and branch of government does in
// plain language — without naming most individual officeholders, since
// those change with elections and would require ongoing maintenance to
// keep accurate. How a role works (term length, how someone is elected,
// what powers it has) is stable information that doesn't go stale.
//
// EXCEPTION: President and Vice President are hardcoded below via
// `currentHolder`, since these are nationally known, change at most every
// 4 years (next Inauguration Day: January 20, 2029), and are easy to verify.
// >>> UPDATE THESE after every presidential inauguration. <<<
// Last verified: June 2026.
//
// For every other role, `lookupUrl` points to an official source for
// finding who currently holds it.
// ===========================================================================

export const GOVERNMENT_ROLE_SECTIONS: GovernmentRoleSection[] = [
  {
    level: 'federal',
    heading: 'Federal',
    description: 'The national government — based in Washington, D.C., it sets laws and policy for the whole country.',
    roles: [
      {
        id: 'president',
        level: 'federal',
        icon: '🇺🇸',
        title: 'President',
        tag: 'Federal · Elected · 4-year term',
        summary: 'Leads the executive branch and serves as head of state and commander-in-chief.',
        full: 'The President runs the federal government day-to-day, oversees federal agencies (like the IRS, FBI, and State Department), commands the military, and can sign or veto bills passed by Congress. The President is elected every 4 years and can serve a maximum of two terms.',
        currentHolder: 'Donald Trump',
        lookupUrl: 'https://www.whitehouse.gov/administration/donald-j-trump/',
        lookupLabel: 'whitehouse.gov',
      },
      {
        id: 'vice-president',
        level: 'federal',
        icon: '🇺🇸',
        title: 'Vice President',
        tag: 'Federal · Elected · 4-year term',
        summary: 'Second-in-command of the executive branch, and presides over the Senate.',
        full: 'The Vice President steps in if the President can\u2019t serve, and officially presides over the U.S. Senate — casting tie-breaking votes when needed. The Vice President is elected on the same ticket as the President.',
        currentHolder: 'JD Vance',
        lookupUrl: 'https://www.whitehouse.gov/administration/jd-vance/',
        lookupLabel: 'whitehouse.gov',
      },
      {
        id: 'us-senator',
        level: 'federal',
        icon: '🏛️',
        title: 'U.S. Senator',
        tag: 'Federal · Elected · 6-year term',
        summary: 'One of two people representing your entire state in the U.S. Senate.',
        full: 'Every state elects two Senators, regardless of population. Senators vote on federal laws, approve (or reject) presidential nominees like judges and cabinet members, and ratify treaties. Terms are 6 years, staggered so only about a third of the Senate is up for election in any given cycle.',
        lookupUrl: 'https://www.senate.gov/senators/',
        lookupLabel: 'senate.gov',
      },
      {
        id: 'us-house-rep',
        level: 'federal',
        icon: '🏛️',
        title: 'U.S. House Representative',
        tag: 'Federal · Elected · 2-year term',
        summary: 'Represents your specific congressional district in the House of Representatives.',
        full: 'Unlike Senators, House members represent a specific district within your state — the number of districts depends on the state\u2019s population. Representatives vote on federal legislation, including the budget, and serve 2-year terms, so the entire House is up for election every cycle.',
        lookupUrl: 'https://www.house.gov/representatives/find-your-representative',
        lookupLabel: 'house.gov',
      },
      {
        id: 'supreme-court',
        level: 'federal',
        icon: '⚖️',
        title: 'Supreme Court Justice',
        tag: 'Federal · Appointed · Life term',
        summary: 'Interprets federal law and the Constitution as the highest court in the country.',
        full: 'Supreme Court Justices are nominated by the President and confirmed by the Senate. They aren\u2019t elected and serve for life (or until they retire or resign). The Court decides whether laws are constitutional and resolves major legal disputes that affect the whole country.',
        lookupUrl: 'https://www.supremecourt.gov/about/biographies.aspx',
        lookupLabel: 'supremecourt.gov',
      },
    ],
  },
  {
    level: 'state',
    heading: 'State',
    description: 'Your state government — handles things like schools, state taxes, roads, and state-level laws.',
    roles: [
      {
        id: 'governor',
        level: 'state',
        icon: '🏢',
        title: 'Governor',
        tag: 'State · Elected · 4-year term (most states)',
        summary: 'Leads your state\u2019s executive branch, similar to a President but for the state.',
        full: 'The Governor manages the state budget, oversees state agencies (like the DMV, state police, and education department), and can sign or veto bills passed by the state legislature. Most states have 4-year terms, though a few have 2-year terms.',
        lookupUrl: 'https://www.nga.org/governors/',
        lookupLabel: 'nga.org',
      },
      {
        id: 'state-senator',
        level: 'state',
        icon: '📜',
        title: 'State Senator',
        tag: 'State · Elected · Term varies by state',
        summary: 'Represents your district in the state senate, the upper chamber of your state legislature.',
        full: 'State senators vote on state laws — things like state taxes, school funding formulas, and state infrastructure spending. Most states have smaller state senate districts than congressional districts, so this person represents a more local area than your U.S. Senator.',
        lookupUrl: 'https://www.270towin.com/elected-officials/',
        lookupLabel: '270towin.com',
      },
      {
        id: 'state-house-rep',
        level: 'state',
        icon: '📜',
        title: 'State Representative / Assemblymember',
        tag: 'State · Elected · Term varies by state',
        summary: 'Represents your district in the state house, the lower chamber of your state legislature.',
        full: 'Sometimes called a State Representative, Assemblymember, or Delegate depending on the state. This person represents an even smaller district than your state senator and votes on the same kinds of state-level legislation.',
        lookupUrl: 'https://www.270towin.com/elected-officials/',
        lookupLabel: '270towin.com',
      },
      {
        id: 'attorney-general',
        level: 'state',
        icon: '⚖️',
        title: 'Attorney General',
        tag: 'State · Usually elected · 4-year term',
        summary: 'The state\u2019s top lawyer — enforces state law and represents the state in court.',
        full: 'The Attorney General\u2019s office handles things like consumer protection, prosecuting certain crimes, and defending the state when it\u2019s sued. In most states this is an elected position, though a few states have the governor appoint it.',
        lookupUrl: 'https://www.naag.org/about-naag/attorneys-general/',
        lookupLabel: 'naag.org',
      },
    ],
  },
  {
    level: 'local',
    heading: 'Local',
    description: 'Your city, town, and county — handles things like roads, parks, police, zoning, and local schools.',
    roles: [
      {
        id: 'mayor',
        level: 'local',
        icon: '🏘️',
        title: 'Mayor',
        tag: 'Local · Elected · Term varies by city',
        summary: 'Leads your city or town\u2019s government.',
        full: 'In many cities, the Mayor oversees city departments (police, fire, public works) and proposes the city budget. In some smaller towns, the role is more ceremonial and a city manager handles day-to-day operations instead. Term lengths vary widely — often 2 or 4 years.',
        lookupUrl: 'https://www.usa.gov/local-governments',
        lookupLabel: 'usa.gov',
      },
      {
        id: 'city-council',
        level: 'local',
        icon: '🏘️',
        title: 'City Council Member',
        tag: 'Local · Elected · Term varies by city',
        summary: 'Represents your neighborhood or district on the body that makes local laws.',
        full: 'City councils vote on local ordinances — things like zoning changes, local taxes and fees, and the city budget. Some cities elect council members by district (so you vote for someone representing your specific neighborhood), while others elect them city-wide.',
        lookupUrl: 'https://www.usa.gov/local-governments',
        lookupLabel: 'usa.gov',
      },
      {
        id: 'county-commissioner',
        level: 'local',
        icon: '🏛️',
        title: 'County Commissioner',
        tag: 'Local · Elected · Term varies by county',
        summary: 'Oversees county government — services that often span multiple towns.',
        full: 'Counties typically handle things cities don\u2019t, like rural roads, the county jail, courts, and property records. County commissioners (sometimes called supervisors or county council members) set the county budget and policies for these services.',
        lookupUrl: 'https://www.usa.gov/local-governments',
        lookupLabel: 'usa.gov',
      },
      {
        id: 'school-board',
        level: 'local',
        icon: '🎓',
        title: 'School Board Member',
        tag: 'Local · Elected · Term varies by district',
        summary: 'Sets policy and budget priorities for your local public school district.',
        full: 'School board members oversee the superintendent, approve the district budget, and set policies on things like curriculum and school boundaries. These elections often have low turnout but can have an outsized impact on local schools.',
        lookupUrl: 'https://www.usa.gov/local-governments',
        lookupLabel: 'usa.gov',
      },
      {
        id: 'sheriff',
        level: 'local',
        icon: '👮',
        title: 'Sheriff',
        tag: 'Local · Usually elected · Term varies',
        summary: 'The top law enforcement officer for your county.',
        full: 'In most states, the Sheriff is elected directly by county voters and oversees county law enforcement, the county jail, and (in many counties) court security — separate from city police departments.',
        lookupUrl: 'https://www.usa.gov/local-governments',
        lookupLabel: 'usa.gov',
      },
    ],
  },
];
