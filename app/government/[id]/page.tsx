'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

interface Bill {
  id: string;
  title: string;
  number: string;
  introducedDate: string;
  latestAction: string;
  latestActionDate: string;
  policyArea: string;
  congress: number;
  billType: string;
  billNumber: string;
}

interface VoteOrActivity {
  id: string;
  bill: string;
  description: string;
  position: string | null;
  date: string;
  result: string;
}

function isYes(position: string | null): boolean {
  if (!position) return false;
  const p = position.toLowerCase();
  return p.includes('yea') || p.includes('yes') || p.includes('aye');
}

function isNo(position: string | null): boolean {
  if (!position) return false;
  const p = position.toLowerCase();
  return p.includes('nay') || p.includes('no');
}

function MemberListContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const type = searchParams.get('type') || 'bills';
  const chamber = searchParams.get('chamber') || '';

  const [menuOpen, setMenuOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [votes, setVotes] = useState<VoteOrActivity[]>([]);
  const [isActivity, setIsActivity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voteFilter, setVoteFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [location, setLocation] = useState('');

  useEffect(() => {
    try {
      setLocation(localStorage.getItem('plainly-location') || '');
    } catch {}

    setLoading(true);
    setError('');

    if (type === 'bills') {
      fetch(`/api/congress?type=bills&memberId=${memberId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setBills(d.bills || []);
        })
        .catch(() => setError('Could not load bills.'))
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/congress?type=votes&memberId=${memberId}&chamber=${encodeURIComponent(chamber)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else {
            setVotes(d.votes || []);
            setIsActivity(!!d.isActivity);
          }
        })
        .catch(() => setError('Could not load votes.'))
        .finally(() => setLoading(false));
    }
  }, [memberId, type, chamber]);

  const filteredVotes =
    voteFilter === 'all' ? votes : votes.filter((v) => (voteFilter === 'yes' ? isYes(v.position) : isNo(v.position)));

  function goToDetail(params: {
    title: string;
    description: string;
    billNumber?: string;
    position?: string | null;
    latestAction?: string;
  }) {
    const q = new URLSearchParams({
      title: params.title,
      description: params.description || '',
      billNumber: params.billNumber || '',
      position: params.position || '',
      latestAction: params.latestAction || '',
      location,
    });
    router.push(`/government/detail?${q.toString()}`);
  }

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-2xl px-[6vw] pb-16">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-muted">
          ← Back
        </button>

        <h1 className="mb-1 font-display text-2xl font-bold text-navy">
          {type === 'bills' ? 'Bills sponsored' : isActivity ? 'Recent legislative activity' : 'Votes cast'}
        </h1>
        {type === 'votes' && isActivity && (
          <p className="mb-4 text-sm text-muted">
            Congress.gov doesn't publish Senate roll-call vote data, so this shows recent legislative activity instead.
          </p>
        )}

        {type === 'votes' && !isActivity && (
          <div className="mb-6 flex gap-2">
            {(['all', 'yes', 'no'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setVoteFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  voteFilter === f ? 'bg-terracotta text-white' : 'bg-card text-navy border border-line'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted">{error}</div>
        ) : type === 'bills' ? (
          bills.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center text-muted">No sponsored bills found.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {bills.map((b) => (
                <div key={b.id} className="rounded-2xl border border-line bg-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-terracotta">{b.number}</p>
                  <h2 className="mt-1 text-base font-bold text-navy leading-snug">{b.title}</h2>
                  {b.latestAction && <p className="mt-1 text-sm text-muted">{b.latestAction}</p>}
                  <button
                    onClick={() =>
                      goToDetail({
                        title: b.title,
                        description: b.policyArea,
                        billNumber: b.number,
                        latestAction: b.latestAction,
                      })
                    }
                    className="mt-3 text-sm font-semibold text-terracotta"
                  >
                    What this means for you →
                  </button>
                </div>
              ))}
            </div>
          )
        ) : filteredVotes.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted">Nothing to show for this filter.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredVotes.map((v) => (
              <div key={v.id} className="rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-terracotta">{v.bill}</p>
                  {v.position && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        background: isYes(v.position) ? '#E8F4F0' : '#FFF0EB',
                        color: isYes(v.position) ? '#2D7A65' : '#C04A1A',
                      }}
                    >
                      {v.position}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-base font-bold text-navy leading-snug">{v.description}</h2>
                {v.result && <p className="mt-1 text-sm text-muted">{v.result}</p>}
                <button
                  onClick={() =>
                    goToDetail({
                      title: v.bill,
                      description: v.description,
                      billNumber: v.bill,
                      position: v.position,
                      latestAction: v.result,
                    })
                  }
                  className="mt-3 text-sm font-semibold text-terracotta"
                >
                  What this means for you →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function MemberListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <MemberListContent />
    </Suspense>
  );
}
