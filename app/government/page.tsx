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

const PARTY: Record<string, { pillText: string; iconBg: string }> = {
  Republican: { pillText: '#993C1D', iconBg: 'bg-terracotta/15' },
  Democratic: { pillText: '#0C447C', iconBg: 'bg-[#378ADD]/15' },
  Independent: { pillText: '#27500A', iconBg: 'bg-green/15' },
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
  const [districtMatched, setDistrictMatched] = useState(false);

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
        setDistrictMatched(!!data.districtMatched);
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

  function goToMember(m: Member) {
    const q = new URLSearchParams({
      chamber: m.chamber,
      name: m.name,
      party: m.party,
      district: m.district?.toString() || '',
      depiction: m.depiction || '',
      nextElection: m.nextElection || '',
      state: m.state || '',
    });
    router.push(`/government/${m.id}?${q.toString()}`);
  }

  return (
    <main>
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <section className="mx-auto max-w-[760px] px-[6vw] pb-9 pt-6 text-center">
        <h1 className="font-display text-[clamp(2.2rem,5.5vw,3.2rem)] font-bold leading-[1.15] tracking-tight">
          Your <span className="text-terracotta">representatives</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-lg text-muted">
          The people elected to represent you in Congress — the bills they've voted for and what those mean for you, their background in office, and who's running to replace them when you next get a say.
        </p>
      </section>

      <div className="mx-auto max-w-[760px] px-[6vw] pb-16">
        <form onSubmit={handleZipSearch} className="mb-3 flex justify-center gap-2.5">
          <input
            type="text"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            placeholder={location || 'Enter your ZIP code'}
            className="w-full max-w-[280px] rounded-3xl border-2 border-line bg-card px-5 py-2.5 text-sm text-navy focus:border-navy focus:outline-none"
          />
          <button
            type="submit"
            className="flex-shrink-0 rounded-3xl border-2 border-navy bg-navy px-5 py-2.5 text-sm font-semibold text-cream"
          >
            Search
          </button>
        </form>

        {!loading && !error && members.length > 0 && (
          <p className="mb-7 text-center text-xs text-muted">
            {districtMatched
              ? 'House representative matched to your specific district.'
              : "Showing your state's House representation — couldn't pinpoint your exact district."}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-[14px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-line bg-card" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-line bg-card px-[26px] py-8 text-center text-muted">{error}</div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card px-[26px] py-8 text-center text-muted">
            No representatives found for that ZIP code.
          </div>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {members.map((m) => {
              const style = partyStyle(m.party);
              const onBallot = isOnBallotThisCycle(m.nextElection);
              const isHouse = m.chamber.includes('House');

              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToMember(m)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToMember(m);
                    }
                  }}
                  className="cursor-pointer rounded-2xl border border-line bg-card px-[26px] py-6 transition-shadow hover:border-transparent hover:shadow-[0_12px_30px_-20px_rgba(26,43,61,0.25)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-[14px]">
                      {m.depiction ? (
                        <img
                          src={m.depiction}
                          alt={m.name}
                          className="h-[42px] w-[42px] flex-shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-navy ${style.iconBg}`}
                        >
                          {initials(m.name)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-display text-[1.15rem] font-bold leading-tight">
                          {isHouse ? 'Rep. ' : 'Sen. '}
                          {m.name}
                        </h3>
                        <div className="text-sm text-muted">
                          {isHouse
                            ? `${m.state}'s ${m.district}${ordinalSuffix(m.district)} District`
                            : `United States Senate · ${m.state}`}
                          {' · '}
                          <span style={{ color: style.pillText }}>{m.party}</span>
                        </div>
                        {m.nextElection && (
                          <div
                            className="mt-1 text-xs font-semibold"
                            style={{ color: onBallot ? '#D9663E' : '#8a8a85' }}
                          >
                            🗳️ {onBallot ? `On your ballot · Nov ${m.nextElection}` : `Reelection Nov ${m.nextElection}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-muted">›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

