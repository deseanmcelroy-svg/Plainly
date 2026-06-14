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

export default function Home() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ballot, setBallot] = useState<LocationBallot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!user || ballot) return;
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.saved_location) {
          lookup(data.saved_location);
        }
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
        <div className="px-[6vw] pb-12 text-center text-terracotta">{error}</div>
      )}

      <div id="ballot-results">
        {ballot && (
          <>
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
