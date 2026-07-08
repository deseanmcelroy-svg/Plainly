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

interface VoteOrActivity {
  id: string;
  bill: string;
  description: string;
  position: string | null;
  date: string;
  result: string;
}

interface MemberData {
  billsCount: number;
  recentVotes: VoteOrActivity[];
  isActivity: boolean;
  attendance: number | null;
  loading: boolean;
  error: string;
}

const PARTY_ACCENT: Record<string, string> = {
  Republican: '#D9663E',
  Democratic: '#5B8FD9',
  Independent: '#8FBFA8',
};

function isYes(position: string | null): boolean {
  if (!position) return false;
  const p = position.toLowerCase();
  return p.includes('yea') || p.includes('yes') || p.includes('aye');
}

function eyebrowFor(m: Member, index: number, senatorCount: number): string {
  if (m.chamber.includes('House')) return 'Your U.S. House Representative';
  return senatorCount > 1 ? `Your U.S. Senator ${index}` : 'Your U.S. Senator';
}

export default function GovernmentPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [memberData, setMemberData] = useState<Record<string, MemberData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let loc = '';
    try {
      loc = localStorage.getItem('plainly-location') || '';
    } catch {}
    setLocation(loc);
    loadMembers(loc || '44721');
  }, []);

  async function loadMembers(loc: string) {
    setLoading(true);
    setError('');
    setMembers([]);
    setMemberData({});
    try {
      const res = await fetch(`/api/congress?type=members&location=${encodeURIComponent(loc)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      const found: Member[] = data.members || [];
      setMembers(found);
      setLoading(false);

      found.forEach((m) => {
        setMemberData((prev) => ({
          ...prev,
          [m.id]: { billsCount: 0, recentVotes: [], isActivity: false, attendance: null, loading: true, error: '' },
        }));

        Promise.all([
          fetch(`/api/congress?type=bills&memberId=${m.id}`).then((r) => r.json()),
          fetch(`/api/congress?type=votes&memberId=${m.id}&chamber=${encodeURIComponent(m.chamber)}`).then((r) =>
            r.json()
          ),
        ])
          .then(([billsRes, votesRes]) => {
            setMemberData((prev) => ({
              ...prev,
              [m.id]: {
                billsCount: (billsRes.bills || []).length,
                recentVotes: (votesRes.votes || []).slice(0, 2),
                isActivity: !!votesRes.isActivity,
                attendance: votesRes.attendance ?? null,
                loading: false,
                error: billsRes.error || votesRes.error || '',
              },
            }));
          })
          .catch(() => {
            setMemberData((prev) => ({
              ...prev,
              [m.id]: { billsCount: 0, recentVotes: [], isActivity: false, attendance: null, loading: false, error: 'Could not load.' },
            }));
          });
      });
    } catch {
      setError('Could not load your representatives.');
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

  function isOnBallotThisCycle(nextElection: string | null): boolean {
    if (!nextElection) return false;
    const year = parseInt(nextElection, 10);
    const currentYear = new Date().getFullYear();
    return year - currentYear <= 1;
  }

  const senatorCount = members.filter((m) => m.chamber.includes('Senate')).length;
  let senatorIndex = 0;

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      {/* Hero */}
      <div className="bg-navy px-[6vw] py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-4xl font-bold text-cream">Grade your government</h1>
          <p className="mt-2 text-base text-cream/60">
            {location ? `How your representatives have voted · ${location}` : 'How your representatives have voted'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-[6vw] pb-16 pt-8">
        <form onSubmit={handleZipSearch} className="mb-8 flex gap-2">
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

        {loading ? (
          <div className="flex flex-col gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted">{error}</div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted">No representatives found for that ZIP code.</div>
        ) : (
          <div className="flex flex-col gap-10">
            {members.map((m) => {
              const d = memberData[m.id];
              const accent = PARTY_ACCENT[m.party] || '#8FBFA8';
              if (m.chamber.includes('Senate')) senatorIndex += 1;
              const eyebrow = eyebrowFor(m, senatorIndex, senatorCount);
              const onBallot = isOnBallotThisCycle(m.nextElection);

              return (
                <div key={m.id}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">{eyebrow}</p>

                  <div className="overflow-hidden rounded-2xl border border-line">
                    {/* Dark header block */}
                    <div className="flex items-center gap-4 bg-navy px-5 py-5">
                      {m.depiction ? (
                        <img src={m.depiction} alt={m.name} className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-green text-lg font-bold text-white">
                          {m.name
                            ?.split(',')[0]
                            ?.trim()
                            ?.split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2) || '?'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold leading-snug text-cream">
                          {m.chamber.includes('House') ? 'Rep. ' : 'Sen. '}
                          {m.name}
                        </h2>
                        <p className="text-sm text-cream/60">
                          {m.chamber.includes('House')
                            ? `${m.state}'s ${m.district}${ordinalSuffix(m.district)} Congressional District`
                            : `${m.state}`}
                        </p>
                      </div>
                      <span
                        className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                        style={{ background: `${accent}33`, color: accent }}
                      >
                        {m.party}
                      </span>
                    </div>

                    {/* Cream body block */}
                    <div className="bg-card">
                      {m.nextElection && (
                        <div className="flex gap-3 border-b border-line px-5 py-4">
                          <span className="text-lg">📅</span>
                          <p className="text-sm font-bold text-terracotta">
                            Up for reelection in {m.nextElection}
                            {onBallot && ' — on your ballot this cycle'}
                          </p>
                        </div>
                      )}

                      {d?.loading ? (
                        <div className="px-5 py-6">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
                        </div>
                      ) : d?.error ? (
                        <div className="px-5 py-6 text-sm text-muted">Couldn't load activity for this member.</div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 divide-x divide-line px-2 py-5 text-center">
                            {!d?.isActivity && d?.attendance !== null && (
                              <div>
                                <div className="text-2xl font-bold text-navy">{d?.attendance}%</div>
                                <div className="text-xs text-muted">Attendance</div>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                router.push(`/government/${m.id}?type=bills&chamber=${encodeURIComponent(m.chamber)}`)
                              }
                              className={d?.isActivity || d?.attendance === null ? 'col-span-1' : ''}
                            >
                              <div className="text-2xl font-bold text-terracotta">{d?.billsCount ?? 0}</div>
                              <div className="text-xs text-muted">Bills sponsored</div>
                              <div className="text-xs font-semibold text-terracotta">Tap to view all</div>
                            </button>
                            <button
                              onClick={() =>
                                router.push(`/government/${m.id}?type=votes&chamber=${encodeURIComponent(m.chamber)}`)
                              }
                            >
                              <div className="text-2xl font-bold text-terracotta">{d?.recentVotes.length ?? 0}</div>
                              <div className="text-xs text-muted">{d?.isActivity ? 'Recent activity' : 'Votes cast'}</div>
                              <div className="text-xs font-semibold text-terracotta">Tap to view all</div>
                            </button>
                          </div>

                          {!d?.isActivity && d?.attendance !== null && (
                            <div className="px-5 pb-5">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                                <div
                                  className="h-full rounded-full bg-green"
                                  style={{ width: `${d?.attendance}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {(d?.recentVotes?.length ?? 0) > 0 && (
                    <div className="mt-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
                        {d?.isActivity ? 'Recent activity' : 'Recent votes'}
                      </p>
                      <div className="flex flex-col gap-3">
                        {d?.recentVotes.map((v) => (
                          <div key={v.id} className="rounded-2xl bg-card p-5">
                            <div className="flex items-start gap-3">
                              {v.position && (
                                <span
                                  className="mt-0.5 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                                  style={{
                                    background: isYes(v.position) ? '#E8F4F0' : '#FFF0EB',
                                    color: isYes(v.position) ? '#2D7A65' : '#C04A1A',
                                  }}
                                >
                                  {isYes(v.position) ? 'YES' : 'NO'}
                                </span>
                              )}
                              <h3 className="text-base font-bold leading-snug text-navy">{v.bill}</h3>
                            </div>
                            {v.description && <p className="mt-2 text-sm text-muted leading-relaxed">{v.description}</p>}
                            <button
                              onClick={() => {
                                const q = new URLSearchParams({
                                  title: v.bill,
                                  description: v.description || '',
                                  billNumber: v.bill,
                                  position: v.position || '',
                                  latestAction: v.result || '',
                                  location,
                                });
                                router.push(`/government/detail?${q.toString()}`);
                              }}
                              className="mt-3 text-sm font-bold text-terracotta"
                            >
                              What this means for you →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-muted">Source: Congress.gov API</p>
      </div>
      <Footer />
    </main>
  );
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
