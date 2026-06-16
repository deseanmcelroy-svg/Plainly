import type { Metadata } from 'next';
import SimplePage from '@/components/SimplePage';

export const metadata: Metadata = {
  title: 'How will I vote? \u2014 Plainly',
  description: 'Understand the different ways to vote and the benefits and drawbacks of each.',
};

export default function HowToVotePage() {
  return (
    <SimplePage
      title="How will I vote?"
      subtitle="There's more than one way to cast your ballot. Here's what each option looks like, and what to consider when picking the one that works best for you."
    >

      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📬</span>
          <h2 className="font-display text-2xl font-bold text-navy">Vote by mail (absentee)</h2>
        </div>
        <p className="mt-3">
          You request a ballot ahead of time, it's mailed to your home, you
          fill it out at your own pace, and return it by mail or at a
          drop-off location. In many states, any registered voter can
          request a mail ballot without needing a specific reason. A handful
          of states (Colorado, Oregon, Washington, Utah, and Hawaii) mail
          ballots automatically to all registered voters.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-green/10 p-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-green">Benefits</div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>Vote from home on your own schedule &mdash; no standing in line</li>
              <li>More time to research candidates and measures while your ballot is in front of you</li>
              <li>No need to take time off work or arrange childcare on Election Day</li>
              <li>Can drop off in person if you don't trust mail timing</li>
            </ul>
          </div>
          <div className="rounded-xl bg-terracotta/10 p-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-terracotta">Drawbacks</div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>Requires planning ahead &mdash; request deadlines can be 1&ndash;2 weeks before Election Day</li>
              <li>Mail delays can be a risk if you return by mail close to the deadline</li>
              <li>Ballot can be rejected for signature mismatches or other errors (some states allow you to "cure" these; others don't)</li>
              <li>Not available without excuse in every state</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          <strong>Best for:</strong> people with busy schedules, mobility
          challenges, frequent travelers, or anyone who wants to take their
          time.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📅</span>
          <h2 className="font-display text-2xl font-bold text-navy">Early in-person voting</h2>
        </div>
        <p className="mt-3">
          Most states offer a window of several days or weeks before
          Election Day when you can go vote at a designated early voting
          location. Unlike your assigned Election Day polling place, early
          voting sites are often open to all voters in the county (not just
          your precinct), and they often have extended hours including
          evenings and weekends.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-green/10 p-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-green">Benefits</div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>Flexibility to choose a date and time that works for you</li>
              <li>Often less crowded than Election Day</li>
              <li>Any issue with your registration can usually be resolved on the spot</li>
              <li>No mail timing risk &mdash; you hand it in directly</li>
            </ul>
          </div>
          <div className="rounded-xl bg-terracotta/10 p-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-terracotta">Drawbacks</div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>Not available in every state &mdash; a few states have very limited or no early voting</li>
              <li>Early voting locations may be fewer and farther away than your Election Day polling place</li>
              <li>Hours and locations vary &mdash; requires checking ahead of time</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          <strong>Best for:</strong> people who want the convenience of
          choosing their own time but prefer voting in person and handing
          their ballot directly to an election worker.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🗳️</span>
          <h2 className="font-display text-2xl font-bold text-navy">Election Day in-person</h2>
        </div>
        <p className="mt-3">
          The traditional option: go to your assigned polling place on
          Election Day (the first Tuesday after the first Monday in
          November), show ID if required, and vote. Polls are typically
          open from 6 or 7 AM to 7 or 8 PM, and in most states you have
          the right to vote if you're in line by the time polls close.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-green/10 p-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-green">Benefits</div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>No advance planning required &mdash; just show up</li>
              <li>You can vote on the most up-to-date information (helpful if something changes close to Election Day)</li>
              <li>Poll workers can help resolve most issues on the spot</li>
              <li>Available to all registered voters in every state</li>
            </ul>
          </div>
          <div className="rounded-xl bg-terracotta/10 p-4">
            <div className="mb-2 text-sm font-bold uppercase tracking-wide text-terracotta">Drawbacks</div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>Lines can be long, especially in the morning and early evening</li>
              <li>You must vote at your specific assigned polling place (not just any location)</li>
              <li>If something comes up on Election Day, you have no backup</li>
              <li>Requires taking time during business hours or working around your schedule</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          <strong>Best for:</strong> people who prefer a simple, familiar
          process and don't mind planning around Election Day.
        </p>
      </div>

      <h2 className="font-display text-2xl font-bold text-navy">A few things to keep in mind</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>You can usually only vote once, one way.</strong> If you
          request a mail ballot, you typically can't also vote in person on
          Election Day (or you'll need to surrender the mail ballot at your
          polling place).
        </li>
        <li>
          <strong>Make a plan &mdash; and a backup.</strong> Life happens.
          If you're planning to vote by mail, request your ballot early. If
          you're planning to go in person, know your polling place in
          advance.
        </li>
        <li>
          <strong>Rules vary by state.</strong> Not every option is
          available everywhere, and deadlines differ significantly. Check
          your state's official election website for the specifics.
        </li>
      </ul>

      <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
        <strong>Find your state's specific options and deadlines:</strong>{' '}
        visit{' '}
        <a
          href="https://vote.gov"
          target="_blank"
          rel="noopener noreferrer"
          className="text-terracotta underline"
        >
          vote.gov
        </a>{' '}
        and select your state for the most current information on early
        voting windows, mail ballot request deadlines, and Election Day
        hours.
      </div>

    </SimplePage>
  );
}
