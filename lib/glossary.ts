export interface GlossaryTerm {
  term: string;
  definition: string;
  example: string;
}

export interface GlossaryCategory {
  id: string;
  label: string;
  icon: string;
  terms: GlossaryTerm[];
}

export const GLOSSARY: GlossaryCategory[] = [
  {
    id: 'voting-process',
    label: 'Voting process',
    icon: 'ballot_box',
    terms: [
      {
        term: 'Absentee ballot',
        definition:
          'A ballot you fill out and return before Election Day, either by mail or at a drop-off location, instead of going to a polling place in person. Some states call this a mail ballot or vote-by-mail ballot.',
        example:
          'If you are traveling for work on Election Day, you can request an absentee ballot to be mailed to you, fill it out at home, and drop it off at your county election office before the deadline.',
      },
      {
        term: 'Early voting',
        definition:
          'The option to vote in person at a designated location during a window of days or weeks before Election Day. Early voting sites are often open to all voters in the county, not just your assigned precinct.',
        example:
          'Instead of waiting until Election Day, you head to your county early voting site on a Saturday two weeks before the election. No lines, in and out in 10 minutes.',
      },
      {
        term: 'Polling place',
        definition:
          'The specific location where you are assigned to vote in person on Election Day. It is determined by your home address and precinct, and it can change between elections.',
        example:
          'Your polling place might be the elementary school two blocks from your house. Your neighbor across the street might be assigned to a different school if they fall in a different precinct.',
      },
      {
        term: 'Precinct',
        definition:
          'A geographic unit used to organize voting. Your home address falls within a specific precinct, which determines your assigned polling place and which races appear on your ballot.',
        example:
          'Two people on the same street but on opposite sides of a precinct boundary might vote at different locations and see different local races on their ballots.',
      },
      {
        term: 'Provisional ballot',
        definition:
          'A paper ballot used when there is a question about a voter\'s eligibility on Election Day. It is set aside and counted only after eligibility is confirmed by the election office.',
        example:
          'You show up to vote and the poll worker cannot find your name. You cast a provisional ballot, and within a few days the election office verifies your registration and counts your vote.',
      },
      {
        term: 'Voter registration',
        definition:
          'The process of signing up with your local election authority to be eligible to vote. Registration must be completed before a deadline set by your state, and it is tied to your current address.',
        example:
          'You moved to a new city in September. Before you can vote in November, you need to update your registration to reflect your new address, or you may be turned away at the polls.',
      },
      {
        term: 'Ranked-choice voting',
        definition:
          'A voting method where you rank candidates in order of preference (1st, 2nd, 3rd) instead of picking just one. If no candidate wins a majority, the last-place candidate is eliminated and those votes are redistributed to each voter\'s next choice.',
        example:
          'In a mayor\'s race with three candidates, your top choice is eliminated in the first round. Your second-choice vote is then counted in the runoff round, and your second pick wins.',
      },
      {
        term: 'Write-in candidate',
        definition:
          'A candidate whose name is not printed on the ballot. Voters write the name in by hand. In some states, write-in candidates must register in advance to be eligible to win.',
        example:
          'Residents organize a write-in campaign for a local teacher in a city council race. The votes are counted, but the teacher is only eligible to win if they filed the required paperwork in advance.',
      },
    ],
  },
  {
    id: 'ballot-measures',
    label: 'Ballot measures',
    icon: 'clipboard',
    terms: [
      {
        term: 'Ballot measure',
        definition:
          'A question put directly to voters to approve or reject, rather than electing a candidate. Ballot measures let citizens vote on laws, taxes, bond funding, or constitutional changes.',
        example:
          'Your ballot includes a question asking whether to approve a new sales tax to fund road repairs. You vote YES or NO, and if a majority votes YES, the tax is enacted.',
      },
      {
        term: 'Bond measure',
        definition:
          'A ballot measure that asks voters to approve the government borrowing money to pay for a large project. The debt is paid back over time, typically through property taxes.',
        example:
          'A school district puts a $50 million bond measure on the ballot to build a new middle school. If voters approve it, the district borrows the money now and property owners pay it back over 20 years.',
      },
      {
        term: 'Levy',
        definition:
          'A tax authorized by voters to fund a specific public service, like schools or libraries. Levies are often expressed in mills, a rate applied to the assessed value of property.',
        example:
          'A school levy of 5 mills means you pay $5 for every $1,000 of your home\'s assessed value per year. For a home assessed at $100,000, that is $500 a year.',
      },
      {
        term: 'Millage rate',
        definition:
          'The rate used to calculate property taxes, expressed in mills. One mill equals $1 of tax for every $1,000 of assessed value. Used most commonly in school levy and bond calculations.',
        example:
          'A county proposes a 3-mill levy. If your home is assessed at $150,000, you would pay 3 times ($150,000 divided by 1,000), or $450 per year if it passes.',
      },
      {
        term: 'Tax renewal',
        definition:
          'A ballot measure that asks voters to continue an existing tax at its current rate, rather than letting it expire. A renewal does not raise taxes, it keeps them the same.',
        example:
          'A library levy set to expire is put on the ballot as a renewal. If voters approve it, nothing changes on your tax bill and the library keeps its current funding.',
      },
      {
        term: 'Constitutional amendment',
        definition:
          'A change to a state\'s constitution. Constitutional amendments typically require a higher voter threshold to pass, such as 60%, and sometimes must be approved in two separate elections.',
        example:
          'A state places a voter ID constitutional amendment on the ballot. Because it changes the state constitution, it needs 60% approval rather than a simple majority to pass.',
      },
      {
        term: 'Initiative',
        definition:
          'A ballot measure that citizens place on the ballot themselves by collecting a required number of petition signatures, allowing voters to propose and pass laws directly without the legislature.',
        example:
          'Advocates collect enough signatures to put a minimum wage increase directly on the November ballot. Voters approve it and the new minimum wage takes effect the following year.',
      },
      {
        term: 'Referendum',
        definition:
          'A ballot measure referred to voters by the legislature or a government body, rather than initiated by citizens. Voters approve or reject the proposed change.',
        example:
          'The state legislature passes a new education funding formula but requires voter approval before it takes effect. The question appears on your ballot as a referendum.',
      },
    ],
  },
  {
    id: 'government-roles',
    label: 'Government roles',
    icon: 'building',
    terms: [
      {
        term: 'Legislature',
        definition:
          'The branch of government that writes and passes laws. At the federal level this is Congress. Each state has its own legislature, and many cities have a council or commission that functions similarly.',
        example:
          'Congress passes a bill increasing the federal minimum wage. Your state legislature can then set a higher state minimum wage on top of that.',
      },
      {
        term: 'Executive branch',
        definition:
          'The branch of government responsible for carrying out and enforcing laws. At the federal level this is the President. At the state level it is the Governor. Locally it might be a Mayor or County Executive.',
        example:
          'After Congress passes a law, the President signs it and the relevant federal agencies carry it out. The President can also veto a bill to prevent it from becoming law.',
      },
      {
        term: 'Veto',
        definition:
          'The power of a President or Governor to reject a bill passed by the legislature, preventing it from becoming law. The legislature can sometimes override a veto with a supermajority vote.',
        example:
          'The state legislature passes a new tax bill. The Governor vetoes it. The legislature then needs a two-thirds vote to override the veto and pass the bill anyway.',
      },
      {
        term: 'Incumbent',
        definition:
          'The person currently holding an elected office who is running for re-election. Incumbents often have an advantage due to name recognition and existing donor networks.',
        example:
          'The current mayor is running for a second term. Because she already holds the office, she is the incumbent and her opponent is the challenger.',
      },
      {
        term: 'Term limit',
        definition:
          'A legal restriction on how many terms an elected official can serve in a particular office. Term limits are designed to prevent any one person from holding power indefinitely.',
        example:
          'The U.S. President is limited to two 4-year terms. After serving twice, they cannot run again regardless of popularity.',
      },
      {
        term: 'Nonpartisan',
        definition:
          'Not affiliated with or controlled by a political party. Many local races such as school board and judge are nonpartisan, meaning candidates do not run under a party label.',
        example:
          'Your school board ballot lists candidates by name only with no party affiliation, because school board races in most states are intentionally kept nonpartisan.',
      },
      {
        term: 'Bipartisan',
        definition:
          'Involving or supported by both major political parties. A bipartisan bill or agreement has support from both Democrats and Republicans.',
        example:
          'A highway funding bill passes with votes from both Republican and Democratic senators, so it is described as a bipartisan bill.',
      },
    ],
  },
  {
    id: 'election-admin',
    label: 'Election administration',
    icon: 'balance_scale',
    terms: [
      {
        term: 'Canvass',
        definition:
          'The official process of counting, verifying, and certifying all ballots after an election. The canvass includes reviewing mail ballots and provisional ballots before results are made official.',
        example:
          'On election night you see projected winners, but official results are not confirmed until the canvass completes, usually 2 to 4 weeks later after every ballot has been reviewed.',
      },
      {
        term: 'Certification',
        definition:
          'The formal, legal declaration that election results are official and final, made by the relevant election authority after the canvass is complete.',
        example:
          'Three weeks after Election Day, the state canvassing board meets, reviews the final tallies, and certifies the results. The Governor then issues a Certificate of Election to the winner.',
      },
      {
        term: 'Recount',
        definition:
          'A full re-tally of ballots, usually triggered when the margin of victory is very small or requested by a losing candidate. Recounts use the same ballots already cast, no new votes are added.',
        example:
          'A state senate race ends with a margin of 87 votes out of 200,000 cast. State law triggers an automatic recount. Workers re-run all ballots and hand-count any flagged ones.',
      },
      {
        term: 'Secretary of State',
        definition:
          'In most U.S. states, the chief election official responsible for overseeing voter registration, administering elections, and certifying results.',
        example:
          'After your state finishes counting votes for governor, the Secretary of State reviews the certified county totals, declares the official winner, and issues the Certificate of Election.',
      },
      {
        term: 'Runoff election',
        definition:
          'A follow-up election held when no candidate reaches the required threshold to win the first election. The top two candidates from the original election face each other in the runoff.',
        example:
          'A Georgia Senate primary has four candidates and no one gets above 50%. The top two go to a runoff election held six weeks later.',
      },
      {
        term: 'Electoral College',
        definition:
          'The system used to elect the U.S. President. Each state is allocated electors equal to its congressional seats plus two senators. A candidate needs 270 of 538 electoral votes to win.',
        example:
          'A candidate wins California\'s popular vote and receives all 54 of its electoral votes. Winning enough states to reach 270 total electoral votes makes them President, even if they lost the national popular vote.',
      },
      {
        term: 'Down-ballot',
        definition:
          'Races and measures that appear lower on the ballot than top-of-ticket races like President or Governor. These include state legislature, county commissioner, school board, and local measures.',
        example:
          'A big presidential race drives high turnout, but many voters skip down-ballot races for county auditor. These positions are often decided by just a few hundred votes.',
      },
    ],
  },
  {
    id: 'civic-terms',
    label: 'Civic terms',
    icon: 'books',
    terms: [
      {
        term: 'Plurality',
        definition:
          'Winning the most votes among all candidates, even if that is less than 50%. Most U.S. elections are decided by plurality.',
        example:
          'In a three-way race, candidates get 40%, 35%, and 25%. The candidate with 40% wins with a plurality, even though 60% of voters chose someone else.',
      },
      {
        term: 'Majority',
        definition:
          'More than half of all votes cast, meaning 50% plus at least one more vote. Some elections require a majority to win; if no one reaches it, a runoff is held.',
        example:
          'A city charter requires the mayor to win a majority. If three candidates split the vote and none clears 50%, the top two go to a runoff.',
      },
      {
        term: 'Supermajority',
        definition:
          'A threshold higher than a simple majority, typically two-thirds (67%) or three-fifths (60%) of votes. Required to override vetoes, pass constitutional amendments, and some other significant actions.',
        example:
          'The President vetoes a spending bill. Congress can override it, but needs a two-thirds supermajority in both chambers, a much higher bar than the simple majority needed to pass it originally.',
      },
      {
        term: 'Swing state',
        definition:
          'A state where the presidential election outcome is uncertain and could go to either major party. Campaigns concentrate resources in swing states because winning them can determine the Electoral College.',
        example:
          'Pennsylvania, Michigan, and Wisconsin are often considered swing states. Both presidential campaigns flood them with ads because winning them could determine who reaches 270 electoral votes.',
      },
      {
        term: 'Gerrymandering',
        definition:
          'The practice of drawing voting district boundaries to give one political party an advantage over another. Named after Massachusetts Governor Elbridge Gerry, whose 1812 redistricting produced an oddly shaped district.',
        example:
          'A state legislature redraws congressional maps after the census. They pack opposition voters into a few districts and spread their own supporters across many others, making it harder for the opposition to win seats.',
      },
      {
        term: 'Redistricting',
        definition:
          'The process of redrawing voting district boundaries, typically done every 10 years after the U.S. Census. Redistricting affects how many people each representative serves and can shift political power.',
        example:
          'After the 2020 census showed suburban population growth, your state redraws its congressional map. Your neighborhood moves to a different district, meaning you will vote for a different House representative.',
      },
      {
        term: 'Filibuster',
        definition:
          'A tactic in the U.S. Senate where a senator prolongs debate to delay or block a vote on a bill. Ending a filibuster requires 60 votes, called a cloture vote.',
        example:
          'A voting rights bill passes the House but stalls in the Senate. Opponents use the filibuster to extend debate. Supporters need 60 votes to end debate but can only get 55.',
      },
    ],
  },
];

export function getAllTerms(): (GlossaryTerm & { categoryId: string; categoryLabel: string })[] {
  return GLOSSARY.flatMap((cat) =>
    cat.terms.map((term) => ({
      ...term,
      categoryId: cat.id,
      categoryLabel: cat.label,
    }))
  );
}
