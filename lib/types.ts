// ===========================================================================
// Shared types for Plainly.
//
// These types describe the shape of data the app expects. When wiring up
// real data sources (Google Civic Information API, Ballotpedia, a state
// Secretary of State open-data feed, etc.), map their responses into these
// shapes inside lib/data.ts or the /api routes — the UI components don't
// need to change.
// ===========================================================================

export type GovernmentLevel = 'local' | 'state' | 'federal';

export interface BallotItem {
  id: string;
  level: GovernmentLevel;
  /** Emoji or icon identifier shown in the UI */
  icon: string;
  title: string;
  /** Short context line, e.g. "My community · 4-year term" */
  tag: string;
  /** One-sentence plain-language summary */
  summary: string;
  /** Longer plain-language explanation shown when expanded */
  full: string;
  /** Optional list of candidates for races (omit for ballot measures) */
  candidates?: Candidate[];
}

export interface Candidate {
  name: string;
  party?: string;
  /** Link to an official campaign site or nonpartisan candidate profile */
  infoUrl?: string;
}

export interface CalendarEvent {
  /** ISO date string, e.g. "2026-11-03" */
  date: string;
  title: string;
  sub: string;
}

export interface LocationBallot {
  /** Human-readable location label, e.g. "North Canton, OH" */
  locationLabel: string;
  /** ISO date string for the next election relevant to this location */
  nextElectionDate: string;
  ballotItems: BallotItem[];
  calendarEvents: CalendarEvent[];
  /**
   * Where this data came from. "live" means it was fetched from a real civic
   * data API; "sample" means placeholder data was used as a fallback
   * (no API key configured, or no active election for this address).
   */
  source: 'live' | 'sample';
}
