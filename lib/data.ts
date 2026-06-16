import { LocationBallot } from './types';
import { fetchCivicBallot } from './civicApi';

// ===========================================================================
// PLACEHOLDER DATA
//
// SAMPLE_BALLOT is used as a fallback whenever real data isn't available —
// either because CIVIC_DATA_API_KEY isn't set, or because the Google Civic
// Information API has no contest data for the given address right now
// (it mainly returns ballot data during active election windows).
//
// Other data sources worth researching for richer coverage:
//   - Ballotpedia API / data partnership
//   - Vote411 (League of Women Voters) data feed
//   - Your state's Secretary of State open-data portal
// ===========================================================================

export const SAMPLE_BALLOT: LocationBallot = {
  locationLabel: 'North Canton, OH',
  nextElectionDate: '2026-11-03T06:30:00',
  source: 'sample',
  ballotItems: [
    {
      id: 'us-house',
      level: 'federal',
      icon: '🏛️',
      title: 'U.S. House Representative',
      tag: 'National · Federal · 2-year term',
      summary: 'Represents your area in Congress and votes on national laws.',
      full: 'This person votes on things like the federal budget, healthcare policy, and national security. Replace with live candidate data.',
      candidates: [
        { name: 'Candidate A', party: 'Democratic', office: 'U.S. House Representative', ballotpediaUrl: 'https://ballotpedia.org' },
        { name: 'Candidate B', party: 'Republican', office: 'U.S. House Representative', ballotpediaUrl: 'https://ballotpedia.org' },
      ],
    },
    {
      id: 'governor',
      level: 'state',
      icon: '🏢',
      title: 'Governor',
      tag: 'My state · 4-year term',
      summary: 'Leads your state government and can approve or block state laws.',
      full: 'The governor manages the state budget, oversees state agencies, and decides whether to sign or veto bills from the legislature.',
      candidates: [
        { name: 'Candidate A', party: 'Democratic', office: 'Governor', ballotpediaUrl: 'https://ballotpedia.org' },
        { name: 'Candidate B', party: 'Republican', office: 'Governor', ballotpediaUrl: 'https://ballotpedia.org' },
      ],
    },
    {
      id: 'state-senate-28',
      level: 'state',
      icon: '📜',
      title: 'State Senate, District 28',
      tag: 'My state · 4-year term',
      summary: 'Represents your area in the state legislature.',
      full: 'Votes on state-level laws covering things like education funding, taxes, and infrastructure.',
      candidates: [
        { name: 'Candidate A', party: 'Democratic', office: 'State Senate, District 28', ballotpediaUrl: 'https://ballotpedia.org' },
        { name: 'Candidate B', party: 'Republican', office: 'State Senate, District 28', ballotpediaUrl: 'https://ballotpedia.org' },
      ],
    },
    {
      id: 'county-commissioner',
      level: 'local',
      icon: '🏘️',
      title: 'County Commissioner',
      tag: 'My community · 4-year term',
      summary: 'Decides how your county spends money on roads, parks, and services.',
      full: 'Manages the county budget and oversees local departments like roads, parks, and emergency services.',
      candidates: [
        { name: 'Candidate A', party: 'Democratic', office: 'County Commissioner', ballotpediaUrl: 'https://ballotpedia.org' },
        { name: 'Candidate B', party: 'Republican', office: 'County Commissioner', ballotpediaUrl: 'https://ballotpedia.org' },
      ],
    },
    {
      id: 'school-levy',
      level: 'local',
      icon: '🎓',
      title: 'School Funding Renewal',
      tag: 'My community · Ballot measure',
      summary: 'A vote on whether to keep funding local schools at current levels.',
      full: 'Renews an existing tax that pays for school staff and supplies. This does not raise your taxes — it keeps the current rate going for several more years.',
      voteMeaning: {
        yes: 'The existing school tax continues at its current rate, maintaining current funding for staff and supplies.',
        no: 'The tax expires, creating a budget gap that the district would need to fill some other way (e.g. cuts or a future ballot measure).',
      },
    },
    {
      id: 'zoning-update',
      level: 'local',
      icon: '🏗️',
      title: 'Neighborhood Zoning Update',
      tag: 'My community · Ballot measure',
      summary: 'Changes what types of homes can be built in your area.',
      full: 'Allows smaller homes and backyard cottages in areas currently zoned for single-family houses only. Supporters say it adds housing options; opponents worry about density and parking.',
      voteMeaning: {
        yes: 'Smaller homes and backyard cottages become allowed in currently single-family-only zones.',
        no: 'Current zoning stays the same — these smaller housing types remain restricted in those areas.',
      },
    },
  ],
  calendarEvents: [
    {
      date: '2026-10-05',
      title: 'Voter registration deadline',
      sub: 'Last day to register or update your address',
    },
    {
      date: '2026-10-06',
      title: 'Early voting begins',
      sub: 'In-person early voting opens at your county board of elections',
    },
    {
      date: '2026-10-27',
      title: 'Absentee ballot request deadline',
      sub: 'Last day to request a mail ballot',
    },
    {
      date: '2026-11-03',
      title: 'Election Day',
      sub: 'Polls open 6:30am – 7:30pm — bring your ID',
    },
  ],
};

/**
 * Look up ballot data for a given address or ZIP code.
 *
 * Tries the Google Civic Information API first (if CIVIC_DATA_API_KEY is
 * set and an election is currently active for the address). If that
 * returns nothing usable, falls back to SAMPLE_BALLOT so the app still
 * works for development and demos.
 */
export async function getBallotForLocation(query: string): Promise<LocationBallot> {
  const live = await fetchCivicBallot(query);
  if (live) return live;

  return {
    ...SAMPLE_BALLOT,
    locationLabel: query ? query : SAMPLE_BALLOT.locationLabel,
  };
}
