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
  member: Member;
  billsCount: number;
  recentVotes: VoteOrActivity[];
  isActivity: boolean;
  loading: boolean;
  error: string;
}

const PARTY_COLOR: Record<string, string> = {
  Republican: '#C04A1A',
  Democratic: '#2D4FB5',
  Independent: '#5B8C7B',
};

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

      // Load bills + votes/activity for each member in parallel.
      found.forEach((m) => {
        setMemberData((prev) => ({
          ...prev,
          [m.id]: { member: m, billsCount: 0, recentVotes: [], isActivity: false, loading: true, error: '' },
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
                member: m,
                billsCount: (billsRes.bills || []).length,
                recentVotes: (votesRes.votes || []).slice(0, 3),
                isActivity: !!votesRes.isActivity,
                loading: false,
                error: billsRes.error || votesRes.error || '',
              },
            }));
          })
          .catch(() => {
            setMemberData((prev) => ({
              ...prev,
              [m.id]: { member: m, billsCount: 0, recentVotes: [], isActivity: false, loading: false, error: 'Could not load.' },
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

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-2xl px-[6vw] pb-16">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-navy">Grade your government</h1>
          <p className="mt-1 text-sm text-muted">
            {location
              ? `Your federal representatives · ${location}`
              : 'See how your federal representatives are doing'}
          </p>
        </div>

        <form onSubmit={handleZipSearch} className="mb-6 flex gap-2">
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
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card p-8 text-center">
            <p className="text-muted">{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center">
            <p className="text-muted">No representatives found for that ZIP code.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {members.map((m) => {
              const d = memberData[m.id];
              const color = PARTY_COLOR[m.party] || '#1A2B3D';
              return (
                <div key={m.id} className="overflow-hidden rounded-2xl bg-card border border-line">
                  <div className="flex gap-4 p-5">
                    {m.depiction ? (
                      <img src={m.depiction} alt={m.name} className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div
                        className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white"
                        style={{ background: color }}
                      >
                        {m.name?.[0] || '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-navy leading-snug">{m.name}</h2>
                      <p className="text-sm" style={{ color }}>
                        {m.party} · {m.chamber === 'Senate' ? 'Senator' : `Representative, District ${m.district ?? ''}`}
                      </p>
                      {m.nextElection && (
                        <p className="mt-1 text-xs text-muted">Up for reelection in {m.nextElection}</p>
                      )}
                    </div>
                  </div>

                  {d?.loading ? (
                    <div className="border-t border-line px-5 py-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
                    </div>
                  ) : d?.error ? (
                    <div className="border-t border-line px-5 py-4 text-sm text-muted">Couldn't load activity for this member.</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
                        <button
                          onClick={() => router.push(`/government/${m.id}?type=bills&chamber=${encodeURIComponent(m.chamber)}`)}
                          className="bg-card px-4 py-3 text-left hover:bg-page"
                        >
                          <div className="text-xl font-bold text-navy">{d?.billsCount ?? 0}</div>
                          <div className="text-xs font-semibold text-muted">Bills sponsored →</div>
                        </button>
                        <button
                          onClick={() => router.push(`/government/${m.id}?type=votes&chamber=${encodeURIComponent(m.chamber)}`)}
                          className="bg-card px-4 py-3 text-left hover:bg-page"
                        >
                          <div className="text-xl font-bold text-navy">{d?.recentVotes.length ?? 0}</div>
                          <div className="text-xs font-semibold text-muted">
                            {d?.isActivity ? 'Recent activity →' : 'Votes cast →'}
                          </div>
                        </button>
                      </div>

                      {(d?.recentVotes.length ?? 0) > 0 && (
                        <div className="border-t border-line px-5 py-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                            {d?.isActivity ? 'Recent legislative activity' : 'Recent votes'}
                          </p>
                          <div className="flex flex-col gap-2">
                            {d?.recentVotes.map((v) => (
                              <div key={v.id} className="text-sm text-navy">
                                <span className="font-semibold">{v.bill}</span>
                                {v.position && (
                                  <span
                                    className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold"
                                    style={{
                                      background: v.position.toLowerCase().includes('yea') || v.position.toLowerCase().includes('yes') ? '#E8F4F0' : '#FFF0EB',
                                      color: v.position.toLowerCase().includes('yea') || v.position.toLowerCase().includes('yes') ? '#2D7A65' : '#C04A1A',
                                    }}
                                  >
                                    {v.position}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
