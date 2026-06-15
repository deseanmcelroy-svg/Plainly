import { BallotItem, CalendarEvent, GovernmentLevel, LocationBallot, PollingInfo, VoteSite } from './types';
import { buildVoteMeaning, simplifyMeasureText, summarizeMeasureText } from './plainLanguage';

// ===========================================================================
// Google Civic Information API integration
//
// Docs: https://developers.google.com/civic-information
//
// Setup:
//   1. Create (or pick) a project at https://console.cloud.google.com
//   2. Enable the "Civic Information API" for that project
//   3. Create an API key (APIs & Services -> Credentials -> Create credentials
//      -> API key) and restrict it to the Civic Information API
//   4. Add it to .env.local as CIVIC_DATA_API_KEY=your_key_here
//
// Notes / limitations:
//   - Free tier: 25,000 queries/day
//   - voterInfoQuery returns the most useful data during election windows
//     supported by the Voting Information Project. Even then, it often
//     returns no `contests` field (no candidate/measure data has been
//     published yet) — in that case this function falls back to showing
//     election day, the nearest polling location, and official
//     registration/ballot links from the `state` field, if available.
//   - This function returns `null` if the API key is missing, the request
//     fails, or there's no election at all for the address, so callers can
//     fall back to placeholder data.
// ===========================================================================

const CIVIC_API_BASE = 'https://www.googleapis.com/civicinfo/v2/voterinfo';

interface CivicAddress {
  locationName?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CivicCandidate {
  name: string;
  party?: string;
  candidateUrl?: string;
}

interface CivicContest {
  type?: string; // "General" | "Referendum" | ...
  office?: string;
  level?: string[]; // e.g. ["country"], ["administrativeArea1"], ["administrativeArea2"], ["locality"]
  district?: { name?: string; scope?: string };
  candidates?: CivicCandidate[];
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumBrief?: string;
  referendumText?: string;
  termLength?: string;
}

interface CivicVoteSite {
  address?: CivicAddress;
  name?: string;
  pollingHours?: string;
  startDate?: string;
  endDate?: string;
}

interface CivicElectionAdministrationBody {
  name?: string;
  electionInfoUrl?: string;
  electionRegistrationUrl?: string;
  electionRegistrationConfirmationUrl?: string;
  absenteeVotingInfoUrl?: string;
  votingLocationFinderUrl?: string;
  ballotInfoUrl?: string;
}

interface CivicAdministrationRegion {
  name?: string;
  electionAdministrationBody?: CivicElectionAdministrationBody;
}

interface CivicVoterInfoResponse {
  status?: string;
  election?: {
    id?: string;
    name?: string;
    electionDay?: string;
    ocdDivisionId?: string;
  };
  normalizedInput?: CivicAddress;
  pollingLocations?: CivicVoteSite[];
  earlyVoteSites?: CivicVoteSite[];
  dropOffLocations?: CivicVoteSite[];
  contests?: CivicContest[];
  state?: CivicAdministrationRegion[];
}

/** Map a Civic API contest's `level` field to our simplified GovernmentLevel. */
function mapLevel(contest: CivicContest): GovernmentLevel {
  const levels = contest.level ?? [];
  if (levels.includes('country')) return 'federal';
  if (levels.some((l) => l.startsWith('administrativeArea1'))) return 'state';
  // administrativeArea2, regional, locality, subLocale*, special, etc.
  return 'local';
}

/** Pick an icon based on contest type/office for a slightly nicer UI. */
function pickIcon(contest: CivicContest, level: GovernmentLevel): string {
  const office = (contest.office ?? '').toLowerCase();
  if (contest.type === 'Referendum') return level === 'local' ? '🏗️' : '📜';
  if (office.includes('president')) return '🏛️';
  if (office.includes('governor')) return '🏢';
  if (office.includes('senate') || office.includes('congress') || office.includes('house')) {
    return '🏛️';
  }
  if (office.includes('school') || office.includes('education')) return '🎓';
  if (office.includes('mayor') || office.includes('council') || office.includes('commissioner')) {
    return '🏘️';
  }
  return level === 'federal' ? '🏛️' : level === 'state' ? '📜' : '🏘️';
}

/** Friendly "My community / My state / National" tag for a contest. */
function buildTag(level: GovernmentLevel, contest: CivicContest): string {
  const scope = level === 'federal' ? 'National' : level === 'state' ? 'My state' : 'My community';
  const kind = contest.type === 'Referendum' ? 'Ballot measure' : contest.termLength
    ? `${contest.termLength}-year term`
    : 'Race';
  return `${scope} · ${kind}`;
}

function contestToBallotItem(contest: CivicContest, index: number): BallotItem {
  const level = mapLevel(contest);
  const isReferendum = contest.type === 'Referendum';

  const title = isReferendum
    ? contest.referendumTitle || 'Ballot Measure'
    : contest.office || 'Race';

  if (isReferendum) {
    const rawSummary = contest.referendumSubtitle || contest.referendumBrief;
    const summary =
      summarizeMeasureText(rawSummary) ??
      summarizeMeasureText(contest.referendumText) ??
      'A ballot measure for voters to decide.';

    const full =
      simplifyMeasureText(contest.referendumBrief) ??
      simplifyMeasureText(contest.referendumText) ??
      summary;

    const voteMeaning = buildVoteMeaning(
      title,
      contest.referendumSubtitle,
      contest.referendumBrief ?? contest.referendumText
    );

    return {
      id: `contest-${index}`,
      level,
      icon: pickIcon(contest, level),
      title,
      tag: buildTag(level, contest),
      summary,
      full,
      voteMeaning,
      sourceText: contest.referendumText,
    };
  }

  const summary = `Represents ${contest.district?.name ?? 'your area'}.`;
  const full = `Office: ${contest.office ?? 'N/A'}${contest.district?.name ? ` — ${contest.district.name}` : ''}.`;

  return {
    id: `contest-${index}`,
    level,
    icon: pickIcon(contest, level),
    title,
    tag: buildTag(level, contest),
    summary,
    full,
    candidates: contest.candidates?.map((c) => ({
      name: c.name,
      party: c.party,
      infoUrl: c.candidateUrl,
    })),
  };
}

/** Build calendar events from the election day and any early-voting / drop-off windows. */
function buildCalendarEvents(data: CivicVoterInfoResponse): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const site of data.earlyVoteSites ?? []) {
    if (site.startDate) {
      events.push({
        date: site.startDate,
        title: 'Early voting begins',
        sub: site.name ? `Starts at locations like ${site.name}` : 'In-person early voting opens',
      });
      break; // one entry is enough; sites may repeat the same window
    }
  }

  for (const site of data.dropOffLocations ?? []) {
    if (site.startDate) {
      events.push({
        date: site.startDate,
        title: 'Ballot drop-off locations open',
        sub: site.name ? `Including ${site.name}` : 'Drop boxes become available',
      });
      break;
    }
  }

  if (data.election?.electionDay) {
    events.push({
      date: data.election.electionDay,
      title: 'Election Day',
      sub: 'Check your polling place hours — bring ID if required',
    });
  }

  // De-duplicate by date and sort chronologically
  const seen = new Set<string>();
  return events
    .filter((e) => {
      if (seen.has(e.date)) return false;
      seen.add(e.date);
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Build ballot items from election/voting logistics info — used when an
 * election exists for the address but Google hasn't published contest
 * (candidate/measure) data for it yet. Surfaces the election itself, the
 * nearest polling location, and official registration/ballot links so the
 * app still shows something useful instead of falling back to sample data.
 */
function buildVotingInfoItems(data: CivicVoterInfoResponse): BallotItem[] {
  const items: BallotItem[] = [];

  if (data.election?.name) {
    const pollingCount = data.pollingLocations?.length ?? 0;
    items.push({
      id: 'election-overview',
      level: 'local',
      icon: '🗳️',
      title: data.election.name,
      tag: data.election.electionDay
        ? `Election Day · ${data.election.electionDay}`
        : 'Upcoming election',
      summary: 'An election is coming up for your area.',
      full: pollingCount
        ? `There ${pollingCount === 1 ? 'is' : 'are'} ${pollingCount} polling location${pollingCount === 1 ? '' : 's'} listed for this election. Candidate and measure details for this election haven't been published yet — check official sources below for the latest.`
        : "Candidate and measure details for this election haven't been published yet — check official sources below for the latest.",
    });
  }

  const firstPolling = data.pollingLocations?.[0];
  if (firstPolling?.address) {
    const addr = firstPolling.address;
    const addressLine = [addr.line1, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
    items.push({
      id: 'polling-location',
      level: 'local',
      icon: '📍',
      title: firstPolling.name || addr.locationName || 'Your polling place',
      tag: 'Where to vote',
      summary: addressLine || 'A polling location near you.',
      full: firstPolling.pollingHours
        ? `Hours: ${firstPolling.pollingHours}`
        : 'Polling hours were not provided — check the link below for details.',
    });
  }

  const adminBody = data.state?.[0]?.electionAdministrationBody;
  if (adminBody) {
    const links: string[] = [];
    if (adminBody.electionRegistrationConfirmationUrl) links.push('check your registration');
    if (adminBody.absenteeVotingInfoUrl) links.push('request an absentee ballot');
    if (adminBody.votingLocationFinderUrl) links.push('find your polling place');
    if (adminBody.ballotInfoUrl) links.push('preview your ballot');

    items.push({
      id: 'election-office',
      level: 'local',
      icon: '🏛️',
      title: adminBody.name || 'Your election office',
      tag: 'Official resources',
      summary: 'Links to your local election office for the latest information.',
      full:
        links.length > 0
          ? `Use your election office's website to ${links.join(', ')}.`
          : "Visit your local election office's website for registration deadlines and ballot information.",
    });
  }

  return items;
}

function formatLocationLabel(addr?: CivicAddress, fallback?: string): string {
  if (!addr) return fallback ?? 'Your location';
  const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
  return cityState || fallback || 'Your location';
}

/** Convert a Civic API vote site into our simplified VoteSite shape. */
function toVoteSite(site: CivicVoteSite): VoteSite | null {
  const addr = site.address;
  if (!addr) return null;
  const address = [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
  if (!address) return null;
  return {
    name: site.name || addr.locationName || 'Voting location',
    address,
    hours: site.pollingHours,
    startDate: site.startDate,
    endDate: site.endDate,
  };
}

/**
 * Look up polling places, early voting sites, and ballot drop-off
 * locations for an address.
 *
 * Like ballot data, this is only available from the Civic API when an
 * election is active for the address — most of the year, this returns
 * `source: 'none'` along with a finder link (if available) so the page can
 * point users to their local election office instead.
 *
 * Returns `null` only if CIVIC_DATA_API_KEY is unset or the request fails
 * outright (network error, bad response) — a request that succeeds but has
 * no election data still returns a result with `source: 'none'`.
 */
export async function fetchPollingLocations(address: string): Promise<PollingInfo | null> {
  const apiKey = process.env.CIVIC_DATA_API_KEY;
  if (!apiKey || !address) return null;

  const url = `${CIVIC_API_BASE}?key=${encodeURIComponent(apiKey)}&address=${encodeURIComponent(address)}`;

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 3600 } });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data: CivicVoterInfoResponse = await res.json();
  const locationLabel = formatLocationLabel(data.normalizedInput, address);
  const adminBody = data.state?.[0]?.electionAdministrationBody;

  const pollingLocations = (data.pollingLocations ?? []).map(toVoteSite).filter((s): s is VoteSite => s !== null);
  const earlyVoteSites = (data.earlyVoteSites ?? []).map(toVoteSite).filter((s): s is VoteSite => s !== null);
  const dropOffLocations = (data.dropOffLocations ?? []).map(toVoteSite).filter((s): s is VoteSite => s !== null);

  const hasAnySites = pollingLocations.length || earlyVoteSites.length || dropOffLocations.length;

  if (!data.election?.name && !hasAnySites) {
    return {
      locationLabel,
      pollingLocations: [],
      earlyVoteSites: [],
      dropOffLocations: [],
      finderUrl: adminBody?.votingLocationFinderUrl,
      source: 'none',
    };
  }

  return {
    locationLabel,
    electionName: data.election?.name,
    electionDay: data.election?.electionDay,
    pollingLocations,
    earlyVoteSites,
    dropOffLocations,
    finderUrl: adminBody?.votingLocationFinderUrl,
    source: 'live',
  };
}

/**
 * Look up real ballot data from the Google Civic Information API.
 *
 * Returns `null` if:
 *  - CIVIC_DATA_API_KEY is not set
 *  - the request fails
 *  - the response has no usable contest data (common outside election windows)
 */
export async function fetchCivicBallot(address: string): Promise<LocationBallot | null> {
  const apiKey = process.env.CIVIC_DATA_API_KEY;
  if (!apiKey || !address) return null;

  const url = `${CIVIC_API_BASE}?key=${encodeURIComponent(apiKey)}&address=${encodeURIComponent(address)}`;

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: 3600 } });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data: CivicVoterInfoResponse = await res.json();

  const electionDay = data.election?.electionDay;
  const nextElectionDate = electionDay ? `${electionDay}T06:30:00` : undefined;

  // No election at all for this address — nothing useful to show.
  if (!nextElectionDate) return null;

  const hasContests = data.contests && data.contests.length > 0;
  const ballotItems = hasContests
    ? data.contests!.map(contestToBallotItem)
    : buildVotingInfoItems(data);

  // Even with an election day, if we have neither contests nor any voting
  // info (polling locations, registration links, etc.), there's nothing
  // useful to show — fall back to sample data.
  if (ballotItems.length === 0) return null;

  const calendarEvents = buildCalendarEvents(data);

  return {
    locationLabel: formatLocationLabel(data.normalizedInput, address),
    nextElectionDate,
    ballotItems,
    calendarEvents: calendarEvents.length
      ? calendarEvents
      : [{ date: electionDay!, title: 'Election Day', sub: 'Check your polling place hours' }],
    source: 'live',
  };
}
