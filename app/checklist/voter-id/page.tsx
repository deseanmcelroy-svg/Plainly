'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { stateFromZip, StateInfo } from '@/lib/zipToState';

const COMMON_PHOTO_IDS = [
  "Driver's license or state ID card (most states accept these even if expired, within limits)",
  'U.S. passport or passport card',
  'Military ID',
  'Tribal ID card',
  'State or government employee ID',
  'Student ID (accepted in some, but not all, states)',
];

const COMMON_NON_PHOTO_IDS = [
  'Utility bill, bank statement, or paycheck showing your name and address',
  'Government check or other government document with your name and address',
  'Voter registration card',
  'Lease or mortgage statement',
];

export default function VoterIdPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [zip, setZip] = useState('');
  const [state, setState] = useState<StateInfo | null | undefined>(undefined);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState(stateFromZip(zip.trim()));
  }

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">
        <h1 className="font-display text-[clamp(2rem,5vw,2.6rem)] font-bold leading-tight">
          What ID do I need?
        </h1>
        <p className="mt-3 text-lg text-muted">
          Whether you need ID to vote, and what counts, depends entirely on
          your state &mdash; and these rules can and do change, sometimes
          right up to an election. Here's the general landscape, plus how
          to find your state's current rule.
        </p>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-navy/90">
          <h2 className="font-display text-xl font-bold text-navy">The general picture</h2>
          <p>
            Most states ask for some form of identification before you vote
            in person, but the specifics vary widely:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Photo ID states</strong> require an ID with your
              picture on it, like a driver's license or passport.
            </li>
            <li>
              <strong>Non-photo ID states</strong> accept documents that
              show your name and address but don't have a photo, like a
              utility bill or bank statement.
            </li>
            <li>
              <strong>No-document states</strong> may verify your identity
              another way (like a signature match) and don't require you to
              show anything at the polls.
            </li>
          </ul>
          <p>
            On top of that, states are described as <strong>strict</strong>{' '}
            or <strong>non-strict</strong>:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              In <strong>strict</strong> states, if you don't have an
              acceptable ID, you'll vote using a provisional ballot and
              typically need to take an extra step afterward (like visiting
              an election office within a few days) for your vote to count.
            </li>
            <li>
              In <strong>non-strict</strong> states, you may be able to sign
              an affidavit confirming your identity, and your regular ballot
              will count without further action.
            </li>
          </ul>
          <p>
            Even in states that don't typically require ID, first-time
            voters who registered by mail are often asked to show ID the
            first time they vote, per federal law.
          </p>

          <h2 className="font-display text-xl font-bold text-navy">Common forms of ID</h2>
          <p>
            These are commonly accepted across many states &mdash; though
            acceptance varies, and your state may have additional options or
            restrictions:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-cream p-4">
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-navy">Photo ID</div>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {COMMON_PHOTO_IDS.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-cream p-4">
              <div className="mb-2 text-sm font-bold uppercase tracking-wide text-navy">Non-photo ID</div>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {COMMON_NON_PHOTO_IDS.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="font-display text-xl font-bold text-navy">Why this matters right now</h2>
          <p>
            Voter ID rules are changing in multiple states. Some states have
            ballot measures this very election that could change ID
            requirements, and a federal proposal regarding proof of
            citizenship for registration has been debated in Congress.
            Whatever rule applies on Election Day is the one that counts
            &mdash; which is why checking close to the election, with an
            official source, matters more than usual this cycle.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-card p-6">
          <h2 className="font-display text-lg font-bold">Find your state's rules</h2>
          <p className="mt-2 text-sm text-muted">
            Enter your ZIP code, and we'll point you to your state's
            official voter information page.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Enter your ZIP code"
              aria-label="Enter your ZIP code"
              inputMode="numeric"
              className="flex-1 rounded-xl border-2 border-navy bg-card px-4 py-3 text-base text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-terracotta px-5 py-3 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b04f30]"
            >
              Find my state
            </button>
          </form>

          {state === null && (
            <p className="mt-4 text-sm text-terracotta">
              We couldn't recognize that ZIP code. Double-check it, or visit{' '}
              <a href="https://vote.gov" target="_blank" rel="noopener noreferrer" className="underline">
                vote.gov
              </a>{' '}
              and select your state directly.
            </p>
          )}

          {state && (
            <div className="mt-4 rounded-xl bg-cream p-4">
              <div className="text-sm font-bold uppercase tracking-wide text-navy">{state.name}</div>
              <a
                href={`https://vote.gov/register/${state.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-terracotta underline"
              >
                See {state.name}'s official voter ID and registration info &rarr;
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          <strong>Always double-check with official sources close to Election Day.</strong>{' '}
          Voter ID requirements vary by state, can change, and are sometimes
          decided by the very ballot measures on your ballot this election.
          The information above is general and may not reflect your state's
          current rule &mdash; your state or local election office is the
          final word.
        </div>
      </div>

      <Footer />
    </main>
  );
}
