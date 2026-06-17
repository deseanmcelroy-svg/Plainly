'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Hero from '@/components/Hero';
import BallotSummary from '@/components/BallotSummary';
import ElectionCalendar from '@/components/ElectionCalendar';
import Countdown from '@/components/Countdown';
import RaceList from '@/components/RaceList';
import HowItWorks from '@/components/HowItWorks';
import VoterChecklist from '@/components/VoterChecklist';
import Footer from '@/components/Footer';
import { LocationBallot } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import WaitlistForm, { isWaitlistDone } from '@/components/WaitlistForm';

export default function Home() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ballot, setBallot] = useState<LocationBallot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  async function lookup(location: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ballot?location=${encodeURIComponent(location)}`);
      if (!res.ok) throw new Error('Lookup failed');
      const data: LocationBallot = await res.json();
      setBallot(data);
      requestAnimationFrame(() => {
        document.getElementById('ballot-results')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    } catch (err) {
      setError("We couldn't find ballot information for that location. Try a different ZIP or address.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(location: string) {
    await lookup(location);

    // Save this location for signed-in users so it's there next time
    if (user && location) {
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved_location: location }),
      }).catch(() => {
        // Non-critical — saving the location failing shouldn't block results
      });
    }
  }

  // For signed-in users with a saved location, look it up automatically
  useEffect(() => {
    setWaitlistDone(isWaitlistDone());
    if (!user || ballot) return;
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.saved_location) lookup(data.saved_location);
        if (data?.notify_email) setUserEmail(data.notify_email);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <Hero onSearch={handleSearch} />

      {loading && (
        <div className="px-[6vw] pb-12 text-center text-muted">Looking up your ballot…</div>
      )}

      {error && (
        <div className="mx-auto max-w-[680px] px-[6vw] pb-8 pt-4">
          <div className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-6 text-center">
            <div className="text-3xl">🔍</div>
            <div className="mt-2 font-display text-lg font-bold text-navy">
              We couldn&apos;t find that location
            </div>
            <p className="mt-1 text-sm text-muted">
              Try entering a full street address, city and state, or a 5-digit
              ZIP code. Make sure it&apos;s a U.S. address.
            </p>
            <p className="mt-3 text-sm text-muted">
              While you wait, explore what Plainly can do:
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <a href="/glossary" className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy">
                Civic glossary
              </a>
              <a href="/leadership" className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy">
                Who does what?
              </a>
              <a href="/#vote" className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy">
                Voter checklist
              </a>
            </div>
          </div>
        </div>
      )}

      <div id="ballot-results">
        {ballot && (
          <>
            {ballot.source === 'sample' && (
              <div className="mx-auto max-w-[1000px] px-[6vw] pt-8 pb-6">
                <div className="rounded-2xl border border-dashed border-terracotta/40 bg-terracotta/5 p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📅</span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-navy">
                        Your real ballot isn&apos;t published yet
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        Election offices typically publish ballot data 4&ndash;8
                        weeks before Election Day. What you&apos;re seeing below
                        is sample data so you can explore how Plainly works
                        &mdash; it&apos;s not your actual ballot.
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        Check back in <strong className="text-navy">September 2026</strong> and
                        your real candidates and measures will appear automatically.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href="/practice-ballot"
                          className="rounded-xl bg-terracotta px-4 py-2 text-sm font-bold text-white"
                        >
                          Try the practice ballot
                        </a>
                        <a
                          href="/#vote"
                          className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy"
                        >
                          Complete voter checklist
                        </a>
                        <a
                          href="/glossary"
                          className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy"
                        >
                          Browse the glossary
                        </a>
                      </div>
                      {!waitlistDone && (
                        <div className="mt-5 border-t border-terracotta/20 pt-4">
                          <WaitlistForm
                            location={ballot.locationLabel}
                            prefillEmail={userEmail}
                            onDone={() => setWaitlistDone(true)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mx-auto max-w-[1000px] px-[6vw]">
              <hr className="border-line/30" />
            </div>
            <BallotSummary ballot={ballot} />
            <ElectionCalendar events={ballot.calendarEvents} />
            <Countdown targetDate={ballot.nextElectionDate} />
            <RaceList items={ballot.ballotItems} />
          </>
        )}
      </div>

      <HowItWorks />
      <VoterChecklist />
      <Footer />
    </main>
  );
}
