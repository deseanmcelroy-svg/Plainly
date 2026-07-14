'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHouseholdProfile } from '@/lib/householdProfile';
import { getProfileSummary } from '@/lib/profileSummary';
import BallotSummary from '@/components/BallotSummary';
import ElectionCalendar from '@/components/ElectionCalendar';
import Countdown from '@/components/Countdown';
import RaceList from '@/components/RaceList';
import Footer from '@/components/Footer';
import { LocationBallot } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import WaitlistForm, { isWaitlistDone } from '@/components/WaitlistForm';

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return null;
  const diff = target - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useHouseholdProfile();
  const [ballot, setBallot] = useState<LocationBallot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [zipInput, setZipInput] = useState('');

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
    if (ballot) return;
    if (profile.zip_code) {
      lookup(profile.zip_code);
      return;
    }
    if (!user) return;
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.saved_location) lookup(data.saved_location);
        if (data?.notify_email) setUserEmail(data.notify_email);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile.zip_code]);

  const profileSummary = getProfileSummary(profile);
  const displayZip = profile.zip_code || (ballot ? ballot.locationLabel : null);
  const days = ballot ? daysUntil(ballot.nextElectionDate) : null;

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!zipInput.trim()) return;
    handleSearch(zipInput.trim());
  }

  function goToBallot() {
    if (ballot) {
      document.getElementById('ballot-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      document.getElementById('home-zip-input')?.focus();
    }
  }

  return (
    <main>
      {/* Hero */}
      <div style={{ background: '#1A2B3D', padding: '28px 6vw 26px', position: 'relative', overflow: 'hidden' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'absolute', top: -70, right: -70, opacity: 0.07 }} aria-hidden="true">
          <circle cx="110" cy="110" r="105" fill="none" stroke="#F7F4ED" strokeWidth="2" />
          <circle cx="110" cy="110" r="75" fill="none" stroke="#F7F4ED" strokeWidth="2" />
          <circle cx="110" cy="110" r="45" fill="none" stroke="#F7F4ED" strokeWidth="2" />
        </svg>

        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          {displayZip ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(217,102,62,0.25)', borderRadius: 20, fontSize: 11, color: '#FAECE7', fontWeight: 600 }}>
                📍 {displayZip}
              </div>

              {days !== null ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 16 }}>
                  <span className="font-display" style={{ fontSize: 56, fontWeight: 700, color: '#F7F4ED', lineHeight: 1 }}>{days}</span>
                  <span style={{ fontSize: 14, color: 'rgba(247,244,237,0.7)', lineHeight: 1.3, maxWidth: 140 }}>
                    days until<br />Election Day
                  </span>
                </div>
              ) : (
                <div className="font-display" style={{ fontSize: 26, fontWeight: 600, color: '#F7F4ED', marginTop: 16, lineHeight: 1.25 }}>
                  {loading ? 'Loading your ballot…' : 'Your ballot is ready.'}
                </div>
              )}

              {profileSummary && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid rgba(247,244,237,0.15)' }}>
                  <div style={{ fontSize: 12, color: 'rgba(247,244,237,0.8)', lineHeight: 1.5, maxWidth: 320 }}>
                    Viewing your ballot for {profileSummary}.
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 600, color: '#F7F4ED', lineHeight: 1.25 }}>
                Politics, <span style={{ color: '#D9663E' }}>explained plainly.</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(247,244,237,0.7)', marginTop: 10, lineHeight: 1.5, maxWidth: 320 }}>
                Enter your ZIP code to see your real ballot, your representatives, and what it all means for you.
              </p>
              <form onSubmit={handleZipSubmit} style={{ marginTop: 18, display: 'flex', gap: 8, maxWidth: 360 }}>
                <input
                  id="home-zip-input"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  placeholder="Enter your ZIP code"
                  style={{ flex: 1, borderRadius: 24, border: 'none', padding: '11px 16px', fontSize: 13, background: 'rgba(247,244,237,0.12)', color: '#F7F4ED' }}
                />
                <button type="submit" style={{ background: '#D9663E', color: '#fff', border: 'none', borderRadius: 24, padding: '11px 20px', fontSize: 13, fontWeight: 700 }}>
                  Go
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Action cards */}
      <div className="mx-auto max-w-[640px] px-[6vw]" style={{ paddingTop: 18 }}>
        <button
          onClick={goToBallot}
          className="font-display"
          style={{ width: '100%', background: '#D9663E', borderRadius: 16, padding: 20, textAlign: 'left', border: 'none', position: 'relative', overflow: 'hidden' }}
        >
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ position: 'absolute', bottom: -15, right: -10, opacity: 0.18 }} aria-hidden="true">
            <rect x="15" y="35" width="60" height="40" rx="4" fill="#F7F4ED" />
            <polygon points="15,35 45,15 75,35" fill="#F7F4ED" />
          </svg>
          <div style={{ fontSize: 19, fontWeight: 600, color: '#F7F4ED', position: 'relative' }}>My ballot</div>
          <div style={{ fontSize: 12, color: '#FAECE7', marginTop: 5, lineHeight: 1.4, position: 'relative', maxWidth: 260 }}>
            {ballot ? `${ballot.ballotItems.length} races and measures, explained in plain English →` : 'Every race and measure, explained in plain English'}
          </div>
        </button>

        <div className="grid grid-cols-2" style={{ gap: 8, marginTop: 8 }}>
          <button onClick={() => router.push('/government')} className="font-display" style={{ background: '#EAF3DE', borderRadius: 14, padding: 14, textAlign: 'left', border: 'none' }}>
            <div style={{ fontSize: 20 }}>🧑‍💼</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#27500A', marginTop: 8 }}>Your reps</div>
            <div style={{ fontSize: 10.5, color: '#3b5527', marginTop: 3, lineHeight: 1.35 }}>Who represents you & what they've voted for</div>
          </button>
          <button onClick={() => router.push('/practice-ballot')} className="font-display" style={{ background: '#EEF3F8', borderRadius: 14, padding: 14, textAlign: 'left', border: 'none' }}>
            <div style={{ fontSize: 20 }}>📝</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0C447C', marginTop: 8 }}>Practice ballot</div>
            <div style={{ fontSize: 10.5, color: '#2f5878', marginTop: 3, lineHeight: 1.35 }}>Walk through it — nothing here counts</div>
          </button>
        </div>

        <button onClick={() => router.push('/word-around-town')} className="font-display" style={{ width: '100%', background: '#fff', border: '0.5px solid #EDEAE2', borderRadius: 14, padding: '14px 16px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
          <span style={{ fontSize: 20 }}>🏘️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3D' }}>Word around town</div>
            <div style={{ fontSize: 10.5, color: '#8a8a85', marginTop: 2 }}>See anonymous, local voting sentiment near you</div>
          </div>
          <span style={{ color: '#8a8a85', flexShrink: 0 }}>›</span>
        </button>
      </div>

      {/* Get ready to vote */}
      <div className="mx-auto max-w-[640px] px-[6vw]" style={{ paddingTop: 26, paddingBottom: 4 }}>
        <div className="font-display" style={{ fontSize: 17, fontWeight: 600, color: '#1A2B3D' }}>Get ready to vote</div>
        <p style={{ fontSize: 12, color: '#8a8a85', margin: '2px 0 12px' }}>Everything to square away before Election Day.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="/checklist" className="font-display" style={{ background: '#1A2B3D', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(217,102,62,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>✅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F7F4ED' }}>Voter checklist</div>
              <div style={{ fontSize: 10.5, color: 'rgba(247,244,237,0.7)' }}>Registration, ID, polling place — 4 quick checks</div>
            </div>
            <span style={{ color: 'rgba(247,244,237,0.7)', flexShrink: 0 }}>›</span>
          </a>

          <a href="/how-it-works" className="font-display" style={{ background: '#fff', border: '0.5px solid #EDEAE2', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: '#EEF3F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>💬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3D' }}>How this works</div>
              <div style={{ fontSize: 10.5, color: '#8a8a85' }}>Three steps, no politics degree required</div>
            </div>
            <span style={{ color: '#8a8a85', flexShrink: 0 }}>›</span>
          </a>

          <a href="/glossary" className="font-display" style={{ background: '#fff', border: '0.5px solid #EDEAE2', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>📚</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3D' }}>Civic glossary</div>
              <div style={{ fontSize: 10.5, color: '#8a8a85' }}>Plain-English definitions</div>
            </div>
            <span style={{ color: '#8a8a85', flexShrink: 0 }}>›</span>
          </a>
        </div>
      </div>

      {loading && (
        <div className="px-[6vw] pb-12 pt-8 text-center text-muted">Looking up your ballot…</div>
      )}

      {error && (
        <div className="mx-auto max-w-[680px] px-[6vw] pb-8 pt-8">
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
              <a href="/checklist" className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy">
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
                          href="/checklist"
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
            <BallotSummary ballot={ballot} />
            <ElectionCalendar events={ballot.calendarEvents} />
            <Countdown targetDate={ballot.nextElectionDate} />
            <RaceList items={ballot.ballotItems} />
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
