'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';

interface VoteOrActivity {
  id: string;
  bill: string;
  description: string;
  position: string | null;
  date: string;
  result: string;
}

interface Summary {
  whatThisMeansForYou: string;
  economicImpact: string;
  stageLabel: string;
  stagePercent: number;
}

const STAGE_COLOR = (percent: number) => (percent >= 100 ? '#2D7A65' : percent >= 55 ? '#8FBFA8' : '#D9A55E');

function isYes(position: string | null): boolean {
  return !!position && position.toLowerCase().includes('aye');
}

function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return null;
  const diffMs = Date.now() - then;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'less than an hour ago';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function AllBillsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const chamber = searchParams.get('chamber') || '';
  const isActivityChamber = chamber.includes('Senate');

  const [items, setItems] = useState<VoteOrActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null);
  const [voteFilter, setVoteFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [dataAsOf, setDataAsOf] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLocation(localStorage.getItem('plainly-location') || '');
    } catch {}
    fetch(`/api/congress?type=votes&memberId=${memberId}&chamber=${encodeURIComponent(chamber)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setItems(d.votes || []);
          setDataAsOf(d.dataAsOf ?? null);
        }
      })
      .catch(() => setError('Could not load bills.'))
      .finally(() => setLoading(false));
  }, [memberId, chamber]);

  const filteredItems =
    voteFilter === 'all' ? items : items.filter((i) => (voteFilter === 'yes' ? isYes(i.position) : !isYes(i.position)));

  function toggleExpand(item: VoteOrActivity) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    if (summaries[item.id]) return;

    setSummaryLoading(item.id);
    fetch('/api/congress-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.bill,
        description: item.description,
        position: item.position,
        latestAction: item.result,
        location,
      }),
    })
      .then((r) => r.json())
      .then((s) => setSummaries((prev) => ({ ...prev, [item.id]: s })))
      .catch(() => {})
      .finally(() => setSummaryLoading(null));
  }

  const freshness = relativeTime(dataAsOf);

  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto max-w-2xl px-[6vw] pb-16 pt-6">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-muted">
          ← Back
        </button>

        <div className="mb-1 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-navy">
            {isActivityChamber ? 'Recent legislative activity' : 'Votes cast'}
          </h1>
          {freshness && !isActivityChamber && <p className="text-[11px] text-muted">Updated {freshness}</p>}
        </div>
        {isActivityChamber && (
          <p className="mb-5 text-sm text-muted">
            Congress.gov doesn't publish Senate roll-call vote data, so this shows recent legislative activity instead.
          </p>
        )}
        {!isActivityChamber && <div className="mb-5" />}

        {!isActivityChamber && !loading && !error && items.length > 0 && (
          <div className="mb-6 flex gap-2">
            {(['all', 'yes', 'no'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setVoteFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  voteFilter === f ? 'bg-terracotta text-white' : 'border border-line bg-card text-navy'
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
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted">
            {items.length === 0 ? 'Nothing to show yet.' : 'Nothing matches this filter.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => {
              const isOpen = expandedId === item.id;
              const summary = summaries[item.id];
              return (
                <div key={item.id} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                  <button onClick={() => toggleExpand(item)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                    <div>
                      <div className="font-display text-[15px] font-bold leading-snug text-navy">{item.bill}</div>
                      {item.date && <div className="mt-0.5 text-xs text-muted">{item.date}</div>}
                      {!isOpen && <div className="mt-1.5 text-xs font-semibold text-muted">Tap to see impact and status ▸</div>}
                    </div>
                    {item.position && (
                      <span
                        className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={isYes(item.position) ? { background: '#E8F4F0', color: '#1e5c4a' } : { background: '#FFF0EB', color: '#993C1D' }}
                      >
                        {isYes(item.position) ? 'YES' : 'NO'}
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4">
                      {summaryLoading === item.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="h-16 animate-pulse rounded-xl bg-page" />
                          <div className="h-12 animate-pulse rounded-xl bg-page" />
                        </div>
                      ) : summary ? (
                        <>
                          <div className="rounded-xl bg-[#FFF8F3] p-3.5">
                            <div className="mb-1 text-[11px] font-bold text-terracotta">What this means for you</div>
                            <div className="text-[13px] leading-relaxed text-navy">{summary.whatThisMeansForYou}</div>
                          </div>
                          <div className="mt-2.5 rounded-xl bg-[#EEF3F8] p-3.5">
                            <div className="mb-1 text-[11px] font-bold text-[#3d6b8f]">Economic impact</div>
                            <div className="text-[13px] leading-relaxed text-navy">{summary.economicImpact}</div>
                          </div>
                          <div className="mt-2.5 rounded-xl bg-[#F4F2EA] p-3.5">
                            <div className="mb-1 text-[11px] font-bold text-muted">Implementation status</div>
                            <div className="text-[13px] leading-relaxed text-navy">{summary.stageLabel}</div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${summary.stagePercent}%`, background: STAGE_COLOR(summary.stagePercent) }}
                              />
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
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

export default function AllBillsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <AllBillsContent />
    </Suspense>
  );
}

