import { BallotItem } from './types';

export interface HowDecidedContent {
  slug: string;
  raceLabel: string;
  icon: string;
  howWinnerIsDecided: string;
  whoDecides: string;
  afterElectionDay: string[];
  whenItsFinal: string;
  edgeCases: string[];
}

const CONTENT: Record<string, HowDecidedContent> = {
  president: {
    slug: 'president',
    raceLabel: 'President of the United States',
    icon: '🇺🇸',
    howWinnerIsDecided:
      "The U.S. presidency isn't decided by a national popular vote — it's decided by the Electoral College. Each state gets a number of electors equal to its total congressional seats (House + Senate). In almost every state, whoever wins the popular vote in that state gets all of that state's electoral votes. A candidate needs 270 out of 538 total electoral votes to win.",
    whoDecides:
      'Each state certifies its own popular vote results, then its electors meet in December to cast their official electoral votes. Congress counts and certifies those electoral votes in early January. The Vice President presides over the joint session of Congress that makes it official.',
    afterElectionDay: [
      'Each state runs a canvass — a full count and verification of every ballot cast — typically completing within 2 to 4 weeks of Election Day.',
      'States then certify their results and appoint their electors. Electors meet in their state capitals in mid-December to cast their votes.',
      'Congress meets in early January in a joint session to count the electoral votes and declare the winner officially.',
      'The winner is inaugurated on January 20th.',
    ],
    whenItsFinal:
      "Practically speaking, results are usually clear on election night or within a few days. Legally, the result isn't final until Congress certifies the electoral votes in January.",
    edgeCases: [
      "If no candidate reaches 270 electoral votes, the House of Representatives chooses the president — with each state delegation getting one vote, not each individual member.",
      'Recounts can be triggered automatically or by request if the margin is within a threshold set by state law.',
      'Most states now have laws requiring electors to vote as pledged, preventing so-called faithless electors.',
    ],
  },

  'us-senate': {
    slug: 'us-senate',
    raceLabel: 'U.S. Senate',
    icon: '🏛️',
    howWinnerIsDecided:
      'U.S. Senate races are decided by plurality — whoever gets the most votes wins, even if they get less than 50%. In a few states (like Georgia), a candidate must reach 50% + 1 vote or a runoff election is held between the top two candidates.',
    whoDecides:
      "The state's chief election official (usually the Secretary of State) certifies the results. The Senate itself then votes to seat the winner — a formality in almost all cases.",
    afterElectionDay: [
      'County election offices count and verify all ballots, including mail and provisional ballots, over the days and weeks following Election Day.',
      'The state canvassing board reviews the county totals and certifies the statewide result, typically 2 to 4 weeks after Election Day.',
      'The Governor (or other designated official) issues a Certificate of Election to the winner.',
      'The winner is sworn in at the start of the new Congress in January.',
    ],
    whenItsFinal:
      "Results are typically known on election night or within a few days for clear races. It's legally final when the state certifies and the Senate seats the member.",
    edgeCases: [
      'If the margin is within the automatic recount threshold (often 0.5% or less), a recount is triggered automatically.',
      'In states with runoff rules, if no candidate clears 50%, the top two face a runoff held weeks later.',
      'If a senator resigns or dies, the Governor typically appoints a replacement to serve until the next election.',
    ],
  },

  'us-house': {
    slug: 'us-house',
    raceLabel: 'U.S. House of Representatives',
    icon: '🏛️',
    howWinnerIsDecided:
      'House races are decided by plurality — most votes wins. Each district elects one representative. Unlike Senate races in some states, there are no runoffs in most states if no one hits 50%.',
    whoDecides:
      "The state's election office certifies the result. The House of Representatives then votes to seat the winner, which is almost always a formality.",
    afterElectionDay: [
      'County and state election offices canvass all ballots and report totals.',
      'The state certifies results, typically 2 to 4 weeks after Election Day.',
      'The winner receives a Certificate of Election and is sworn in when Congress begins in January.',
    ],
    whenItsFinal:
      'Usually clear on election night. Legally final when the state certifies and the House seats the member in January.',
    edgeCases: [
      'Automatic recounts apply if the margin falls within the state threshold.',
      'If a House member dies or resigns, a special election is held — there are no appointments.',
      'Maine and Alaska use ranked-choice voting, where voters rank candidates and lower-ranked choices are redistributed until someone has a majority.',
    ],
  },

  governor: {
    slug: 'governor',
    raceLabel: 'Governor',
    icon: '🏢',
    howWinnerIsDecided:
      'Governor races are decided by plurality in most states — whoever gets the most votes wins. A handful of states require a majority (50% + 1), triggering a runoff if no one reaches it.',
    whoDecides:
      "The state's Secretary of State (or equivalent) officially certifies the results, typically through the state canvassing board.",
    afterElectionDay: [
      'County election offices complete their canvass, counting all ballots including mail and provisional votes.',
      'The state canvassing board certifies the statewide totals, usually 2 to 4 weeks after Election Day.',
      'The certified winner is inaugurated as Governor, typically in January.',
    ],
    whenItsFinal:
      "Results are usually clear on election night. Legally final at state certification, with the Governor's term beginning at inauguration.",
    edgeCases: [
      'If the margin triggers an automatic recount, a full retally of ballots is conducted before certification.',
      'In states with majority requirements, a runoff may be held if no candidate clears 50%.',
    ],
  },

  'state-legislature': {
    slug: 'state-legislature',
    raceLabel: 'State Legislature',
    icon: '📜',
    howWinnerIsDecided:
      'State legislative races are decided by plurality — the candidate with the most votes in the district wins the seat.',
    whoDecides:
      'The county or state election office certifies results for each district. The legislature formally seats winners when the new session begins.',
    afterElectionDay: [
      'County election offices canvass all ballots and report totals to the state.',
      'The state election authority certifies results, typically 2 to 4 weeks after Election Day.',
      'Winners are sworn in when the new legislative session begins, usually in January.',
    ],
    whenItsFinal: 'Usually clear on election night. Legally final at state certification.',
    edgeCases: [
      'Recounts apply if the margin is within the state threshold.',
      'Vacancies mid-term may be filled by appointment rather than special election, depending on the state.',
    ],
  },

  'local-executive': {
    slug: 'local-executive',
    raceLabel: 'Local Executive (Mayor, City Council)',
    icon: '🏙️',
    howWinnerIsDecided:
      'Local executive races are almost always decided by plurality. Some cities use ranked-choice voting, where voters rank candidates and lower choices are redistributed until someone has a majority.',
    whoDecides:
      'The county board of elections or city election commission certifies the results.',
    afterElectionDay: [
      'All ballots are counted and verified by the local election authority.',
      'The county or city canvassing board certifies the results, usually within 1 to 3 weeks.',
      'The winner is sworn into office at the start of the new term.',
    ],
    whenItsFinal: 'Usually clear on election night. Legally final at local certification.',
    edgeCases: [
      'Ties in local races are resolved differently by jurisdiction — coin flip, drawing lots, or a runoff depending on local law.',
      'Some cities require a majority, triggering a runoff if no candidate clears 50%.',
    ],
  },

  'county-commissioner': {
    slug: 'county-commissioner',
    raceLabel: 'County Commissioner',
    icon: '🏘️',
    howWinnerIsDecided:
      'County commissioner races are decided by plurality — the candidate with the most votes in the district wins.',
    whoDecides:
      'The county board of elections certifies results as part of the standard county canvass.',
    afterElectionDay: [
      'The county election office counts all ballots and completes the canvass, usually within 1 to 3 weeks.',
      'The county canvassing board certifies the results.',
      'The winner is sworn in at the start of the new term, typically in January.',
    ],
    whenItsFinal: 'Legally final at county certification. Usually clear on election night.',
    edgeCases: [
      'Ties may be resolved by lot (drawing a name) under some county rules.',
      'Vacancies are sometimes filled by appointment by the remaining commissioners.',
    ],
  },

  'school-board': {
    slug: 'school-board',
    raceLabel: 'School Board',
    icon: '🎓',
    howWinnerIsDecided:
      'School board races are decided by plurality. When multiple seats are open, voters choose up to that number of candidates, and the top vote-getters fill the seats.',
    whoDecides:
      'The county board of elections certifies the results. The school board itself then officially seats the new members at its next meeting.',
    afterElectionDay: [
      'The county election office counts and verifies all ballots.',
      'Results are certified by the county canvassing board, typically within 1 to 3 weeks.',
      'New board members are sworn in at a school board meeting, usually in January or at the start of the new school year.',
    ],
    whenItsFinal: 'Usually clear on election night. Legally final at county certification.',
    edgeCases: [
      'Ties in school board races are sometimes resolved by lot under state law.',
      'Vacancies mid-term are typically filled by appointment by the remaining board members.',
    ],
  },

  'ballot-measure': {
    slug: 'ballot-measure',
    raceLabel: 'Ballot Measure',
    icon: '📋',
    howWinnerIsDecided:
      'Most ballot measures pass or fail by simple majority — more than 50% of votes cast on that specific measure. Some measures (like constitutional amendments in certain states) require a supermajority, such as 60%. Bond measures almost always use simple majority.',
    whoDecides:
      'The county and state election authorities tally the votes as part of the standard canvass. The canvassing board certifies the result, and the measure either takes effect (if passed) or fails.',
    afterElectionDay: [
      'All votes on the measure are counted as part of the overall canvass.',
      'The state or county certifies results, typically 2 to 4 weeks after Election Day.',
      'If the measure passes, it takes effect on the date specified in the measure itself — often 30 to 90 days after certification, or at the start of the next fiscal year.',
      'If it fails, the measure does not take effect — things stay as they currently are.',
    ],
    whenItsFinal:
      'Final at state or county certification. If challenged in court, implementation may be delayed pending legal resolution.',
    edgeCases: [
      'Some measures are challenged in court after passing, which can delay or prevent implementation.',
      'Constitutional amendments may require approval in two separate elections before taking effect (common in some states).',
      'If a measure conflicts with existing state or federal law, courts may strike it down even after voters approved it.',
    ],
  },

  generic: {
    slug: 'generic',
    raceLabel: 'This race',
    icon: '🗳️',
    howWinnerIsDecided:
      'Most races in the U.S. are decided by plurality — the candidate who receives the most votes wins, even if they receive less than 50% of the total. Some races require a majority (50% + 1 vote), and a runoff is held if no candidate reaches that threshold.',
    whoDecides:
      "The county or state board of elections counts and certifies the results through a process called a canvass — a full verification of every ballot cast.",
    afterElectionDay: [
      'County election offices complete a full canvass of all ballots, including mail-in, early, and provisional votes. This typically takes 1 to 4 weeks.',
      'The canvassing board reviews the totals and officially certifies the results.',
      'The winner is sworn into office, usually in January.',
    ],
    whenItsFinal:
      "Results are typically known on election night for clear races. They're legally final when the relevant election authority certifies them, usually 2 to 4 weeks after Election Day.",
    edgeCases: [
      'If the margin falls within a state-set threshold (often 0.5% or less), an automatic recount is triggered.',
      'Either candidate can typically request a recount within a few days of certification.',
      'Ties are extremely rare but do occur — resolution methods vary by state and race type.',
    ],
  },
};

export function detectRaceType(item: BallotItem): string {
  if (item.voteMeaning || !item.candidates?.length) return 'ballot-measure';

  const t = item.title.toLowerCase();

  if (t.includes('president') || t.includes('electoral')) return 'president';
  if ((t.includes('u.s. senate') || t.includes('united states senate')) || (t.includes('senate') && item.level === 'federal')) return 'us-senate';
  if (t.includes('u.s. house') || t.includes('congress') || (t.includes('representative') && item.level === 'federal')) return 'us-house';
  if (t.includes('governor')) return 'governor';
  if (t.includes('state senate') || t.includes('state house') || t.includes('state assembly') || (t.includes('senate') && item.level === 'state') || (t.includes('house') && item.level === 'state')) return 'state-legislature';
  if (t.includes('mayor') || t.includes('city council') || t.includes('alderman')) return 'local-executive';
  if (t.includes('commissioner')) return 'county-commissioner';
  if (t.includes('school board') || t.includes('board of education')) return 'school-board';

  return 'generic';
}

export function getHowDecidedContent(slug: string): HowDecidedContent {
  return CONTENT[slug] ?? CONTENT['generic'];
}

export function getAllSlugs(): string[] {
  return Object.keys(CONTENT);
}
