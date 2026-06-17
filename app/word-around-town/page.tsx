'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';

interface CommunityBreakdown {
  selection: string;
  count: number;
  percent: number;
}

interface CommunityStat {
  itemId: string;
  itemTitle: string;
  itemLevel: string;
  total: number;
  hasEnoughData: boolean;
  breakdown: CommunityBreakdown[];
}

type LevelFilter = 'all' | 'local' | 'state' | 'federal';

const LEVEL_LABELS: Record<string, string> = {
  local: 'My community',
  state: 'My state',
  federal: 'National',
};

export default function WordAroundTownPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [stats, setStats] = useState<CommunityStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalResponses, setTotalResponses] = useState(0);
  const [filter, setFilter] = useState<LevelFilter>('all');

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) {
      setInputValue(loc);
      loadStats(loc);
    } else if (user) {
      fetch('/api/profile')
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => { if (p?.saved_location) setInputValue(p.saved_location); })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats(loc: string) {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/community-votes?location=${encodeURIComponent(loc)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const s: CommunityStat[] = data.stats ?? [];
      setStats(s);
      setLocation(loc);
      setTotalResponses(s.reduce((sum, item) => sum + item.total, 0));
    } catch {
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const loc = inputValue.trim();
    if (loc) loadStats(loc);
  }

  const levels = [...new Set(stats.map((s) => s.itemLevel))];
  const filtered = filter === 'all' ? stats : stats.filter((s) => s.itemLevel === filter);

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">

        <div className="flex items-center gap-3">
          <span className="text-4xl">🏘️</span>
          <div>
            <h1 className="font-display text-[clamp(2rem,5vw,2.6rem)] font-bold leading-tight">
              Word around town
            </h1>
            <p className="text-sm text-muted">Anonymous community ballot insights</p>
          </div>
        </div>

        <p className="mt-4 text-base text-muted">
          See how Plainly users in your area are leaning on the issues on
          your ballot. All data is completely anonymous &mdash; only ZIP
          codes and ballot selections are stored, never names or accounts.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your ZIP code or address"
            aria-label="Enter your ZIP code"
            className="flex-1 rounded-xl border-2 border-navy bg-card px-4 py-3 text-base text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-terracotta px-5 py-3 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b04f30]"
          >
            See results
          </button>
        </form>

        {loading && (
          <div className="mt-8 text-center text-muted">Loading community results&hellip;</div>
        )}

        {!loading && searched && stats.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center">
            <div className="text-4xl">🌱</div>
            <div className="mt-3 font-display text-xl font-bold text-navy">
              No results yet for this area
            </div>
            <p className="mt-2 text-sm text-muted">
              You might be the first Plainly user in your ZIP. Complete your
              practice ballot and share your selections to get things started.
            </p>
            <Link
              href="/practice-ballot"
              className="mt-4 inline-block rounded-xl bg-terracotta px-5 py-2.5 text-sm font-bold text-white"
            >
              Go to practice ballot &rarr;
            </Link>
          </div>
        )}

        {!loading && stats.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-3 divide-x divide-line/30 rounded-2xl border border-line bg-card">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-navy">{stats.length}</div>
                <div className="text-xs text-muted">ballot items</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-navy">{totalResponses}</div>
                <div className="text-xs text-muted">total responses</div>
              </div>
              <div className="p-4 text-center">
                <div className="truncate text-sm font-bold text-navy">{location}</div>
                <div className="text-xs text-muted">your area</div>
              </div>
            </div>

            {levels.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(['all', ...levels] as LevelFilter[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilter(lvl)}
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                      filter === lvl
                        ? 'border-navy bg-navy text-cream'
                        : 'border-line text-navy hover:border-navy'
                    }`}
                  >
                    {lvl === 'all' ? 'All issues' : LEVEL_LABELS[lvl] ?? lvl}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-5">
              {filtered.map((stat) => (
                <StatCard key={stat.itemId} stat={stat} />
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-line p-5 text-center">
              <p className="text-sm text-muted">
                Want to add your voice? Complete your practice ballot and
                share your selections anonymously.
              </p>
              <Link
                href="/practice-ballot"
                className="mt-3 inline-block rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-cream"
              >
                Go to practice ballot &rarr;
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-muted">
              Stats only appear once at least 5 people in your area have
              responded on a given item. All submissions are anonymous.
            </p>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}

function StatCard({ stat }: { stat: CommunityStat }) {
  const isMeasure = stat.breakdown.some(
    (b) => b.selection === 'yes' || b.selection === 'no'
  );
  const leader = stat.hasEnoughData ? stat.breakdown[0] : null;

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {LEVEL_LABELS[stat.itemLevel] ?? stat.itemLevel}
      </div>
      <h2 className="font-display text-lg font-bold text-navy">{stat.itemTitle}</h2>

      {!stat.hasEnoughData ? (
        <div className="mt-4 rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
          Not enough responses yet in your area &mdash; check back as more
          people complete their practice ballot.
        </div>
      ) : (
        <>
          {leader && (
            <p className="mt-2 text-sm text-muted">
              {isMeasure ? (
                <>
                  <strong className="text-navy">
                    {leader.selection.toUpperCase()} is leading
                  </strong>{' '}
                  with {leader.percent}% of {stat.total} response{stat.total === 1 ? '' : 's'}
                </>
              ) : (
                <>
                  <strong className="text-navy">{leader.selection}</strong> is
                  leading with {leader.percent}% of {stat.total} response{stat.total === 1 ? '' : 's'}
                </>
              )}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {stat.breakdown.map((b) => {
              const barColor =
                isMeasure
                  ? b.selection === 'yes' ? 'bg-green' : 'bg-terracotta'
                  : 'bg-navy';
              const labelColor =
                isMeasure
                  ? b.selection === 'yes' ? 'text-green' : 'text-terracotta'
                  : 'text-navy';

              return (
                <div key={b.selection}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`text-sm font-bold ${labelColor}`}>
                      {isMeasure ? b.selection.toUpperCase() : b.selection}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">
                        {b.count} vote{b.count === 1 ? '' : 's'}
                      </span>
                      <span className="w-10 text-right text-base font-bold text-navy">
                        {b.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-navy/8">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-700`}
                      style={{ width: `${b.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {isMeasure && stat.breakdown.length === 2 && (
            <div className="mt-4 flex h-8 overflow-hidden rounded-xl text-xs font-bold text-white">
              {stat.breakdown.map((b) => (
                <div
                  key={b.selection}
                  className={`flex items-center justify-center transition-all duration-700 ${
                    b.selection === 'yes' ? 'bg-green' : 'bg-terracotta'
                  }`}
                  style={{ width: `${b.percent}%`, minWidth: b.percent > 0 ? '2rem' : '0' }}
                >
                  {b.percent >= 15 && b.selection.toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
