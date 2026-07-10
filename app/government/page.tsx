'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

interface Member {
  id: string;
  name: string;
  party: string;
  chamber: string;
  state: string;
  district: number | null;
  depiction: string | null;
  nextElection: string | null;
}

const PARTY: Record<string, { pillBg: string; pillText: string; accent: string; gradient: string }> = {
  Republican: { pillBg: '#FAECE7', pillText: '#993C1D', accent: '#C04A1A', gradient: 'linear-gradient(135deg,#D9663E,#c25530)' },
  Democratic: { pillBg: '#E6F1FB', pillText: '#0C447C', accent: '#378ADD', gradient: 'linear-gradient(135deg,#5B8FD9,#4577c2)' },
  Independent: { pillBg: '#EAF3DE', pillText: '#27500A', accent: '#639922', gradient: 'linear-gradient(135deg,#5B8C7B,#4a7566)' },
};

function partyStyle(party: string) {
  return PARTY[party] || PARTY.Independent;
}

function ordinalSuffix(n: number | null): string {
  if (n === null || n === undefined) return '';
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function isOnBallotThisCycle(nextElection: string | null): boolean {
  if (!nextElection) return false;
  const year = parseInt(nextElection, 10);
  return year - new Date().getFullYear() <= 1;
}

function initials(name: string): string {
  return (
    name
      ?.split(',')[0]
      ?.trim()
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2) || '?'
  );
}

export default function GovernmentPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let loc = '';
    try {
      loc = localStorage.getItem('plainly-location') || '';
    } catch {}
    setLocation(loc);
    loadMembers(loc);
  }, []);

  async function loadMembers(loc: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/congress?type=members&location=${encodeURIComponent(loc)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMembers(data.members || []);
      }
    } catch {
      setError('Could not load your representatives.');
    } finally {
      setLoading(false);
    }
  }

  function handleZipSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!zipInput.trim()) return;
    try {
      localStorage.setItem('plainly-location', zipInput.trim());
    } catch {}
    setLocation(zipInput.trim());
    loadMembers(zipInput.trim());
  }

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-2xl px-[6vw] pb-16 pt-6">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta">
          <span className="text-lg">🏛️</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-navy">Your representatives</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The people elected to represent you in Congress — what they've voted for, what it means for you, and when
          you'll next get a say.
        </p>

        <form onSubmit={handleZipSearch} className="mt-4 flex gap-2">
          <input
            type="text"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            placeholder={location || 'Enter your ZIP code'}
            className="flex-1 rounded-xl border-2 border-line bg-card px-4 py-2.5 text-sm text-navy focus:border-terracotta focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-terracotta px-4 py-2.5 text-sm font-bold text-cream">
            Search
          </button>
        </form>

        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-card p-8 text-center text-muted">{error}</div>
          ) : members.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center text-muted">No representatives found for that ZIP code.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map((m) => {
                const style = partyStyle(m.party);
                const onBallot = isOnBallotThisCycle(m.nextElection);
                const isHouse = m.chamber.includes('House');
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      const q = new URLSearchParams({
                        chamber: m.chamber,
                        name: m.name,
                        party: m.party,
                        district: m.district?.toString() || '',
                        depiction: m.depiction || '',
                        nextElection: m.nextElection || '',
                      });
                      router.push(`/government/${m.id}?${q.toString()}`);
                    }}
                    className="flex w-full flex-col overflow-hidden rounded-2xl bg-card text-left shadow-sm"
                    style={{ borderLeft: `3px solid ${style.accent}` }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      {m.depiction ? (
                        <img src={m.depiction} alt={m.name} className="h-12 w-12 flex-shrink-0 rounded-2xl object-cover" />
                      ) : (
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                          style={{ background: style.gradient }}
                        >
                          {initials(m.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[15px] font-bold text-navy">
                          {isHouse ? 'Rep. ' : 'Sen. '}
                          {m.name}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {isHouse ? `Ohio's ${m.district}${ordinalSuffix(m.district)} District` : 'United States Senate'}
                        </div>
                      </div>
                      <span
                        className="flex-shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: style.pillBg, color: style.pillText }}
                      >
                        {m.party}
                      </span>
                    </div>
                    {m.nextElection && (
                      <div
                        className="flex items-center justify-between border-t px-4 py-2.5"
                        style={{
                          background: onBallot ? '#FFF8F3' : '#F4F2EA',
                          borderColor: onBallot ? '#F0E4D8' : '#E5E2D8',
                        }}
                      >
                        <span
                          className="text-xs font-semibold"
                          style={{ color: onBallot ? style.pillText : '#6b6b66' }}
                        >
                          {onBallot ? `On your ballot · Nov ${m.nextElection}` : `Up for reelection Nov ${m.nextElection}`}
                        </span>
                        <span style={{ color: onBallot ? style.accent : '#8a8a85' }}>›</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

