'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHouseholdProfile } from '@/lib/householdProfile';
import { getProfileSummary } from '@/lib/profileSummary';
import Footer from '@/components/Footer';
import { LocationBallot } from '@/lib/types';
import { useAuth } from '@/lib/auth';

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return null;
  const diff = target - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, setProfile } = useHouseholdProfile();
  const [ballot, setBallot] = useState<LocationBallot | null>(null);
  const [loading, setLoading] = useState(false);
  const [zipInput, setZipInput] = useState('');

  async function lookup(location: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/ballot?location=${encodeURIComponent(location)}`);
      if (!res.ok) throw new Error('Lookup failed');
      const data: LocationBallot = await res.json();
      setBallot(data);
    } catch {
      // Silent on home — the dedicated /ballot page shows real error handling.
      // Home just falls back to a generic hero state if the light fetch fails.
    } finally {
      setLoading(false);
    }
  }

  // Light fetch, used only to power the hero's countdown/status — the full
  // ballot experience (sample-data banner, race list, etc.) lives on /ballot
  // and fetches independently there.
  useEffect(() => {
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
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile.zip_code]);

  const profileSummary = getProfileSummary(profile);
  const displayZip = profile.zip_code || (ballot ? ballot.locationLabel : null);
  const days = ballot ? daysUntil(ballot.nextElectionDate) : null;

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    const zip = zipInput.trim();
    if (!zip) return;
    setProfile({ ...profile, zip_code: zip });
    lookup(zip);
    if (user) {
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved_location: zip }),
      }).catch(() => {});
    }
  }

  return (
    <main>
      {/* Hero */}
      <div style={{ background: '#1A2B3D', padding: '28px 6vw 26px', position: 'relative', overflow: 'hidden' }}>
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
          onClick={() => router.push('/ballot')}
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

      <div style={{ paddingTop: 32 }}>
        <Footer />
      </div>
    </main>
  );
}
