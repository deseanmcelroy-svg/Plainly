'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

interface VoteOrActivity {
  id: string;
  bill: string;
  description: string;
  position: string | null;
  date: string;
  result: string;
}

interface Bio {
  name: string;
  birthYear: string | null;
  website: string | null;
  firstTermYear: number | null;
  termCount: number;
  chambersServed: string[];
  yearsServed: number | null;
  leadership: { type: string; congress: number; isCurrent: boolean }[];
  partyHistory: { party: string; startYear: number }[];
  currentlySwitchedParty: boolean;
}

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}
  whatThisMeansForYou: string;
  economicImpact: string;
  stageLabel: string;
  stagePercent: number;
}

const STAGE_COLOR = (percent: number) => (percent >= 100 ? '#2D7A65' : percent >= 55 ? '#8FBFA8' : '#D9A55E');

function MemberDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const chamber = searchParams.get('chamber') || '';
  const isHouse = chamber.includes('House');

  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostRecent, setMostRecent] = useState<VoteOrActivity | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [bioLoading, setBioLoading] = useState(true);
  const [isActivity, setIsActivity] = useState(false);
  const [attendance, setAttendance] = useState<number | null>(null);
  const [billsCount, setBillsCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [location, setLocation] = useState('');

  useEffect(() => {
    setBioLoading(true);
    fetch(`/api/congress?type=bio&memberId=${memberId}`)
      .then((r) => r.json())
      .then((d) => setBio(d.error ? null : d))
      .catch(() => setBio(null))
      .finally(() => setBioLoading(false));
  }, [memberId]);

  useEffect(() => {
    try {
      setLocation(localStorage.getItem('plainly-location') || '');
    } catch {}

    setLoading(true);
    Promise.all([
      fetch(`/api/congress?type=votes&memberId=${memberId}&chamber=${encodeURIComponent(chamber)}`).then((r) => r.json()),
      fetch(`/api/congress?type=bills-sponsored-count&memberId=${memberId}`).then((r) => r.json()),
    ])
      .then(([votesRes, billsRes]) => {
        if (votesRes.error) {
          setError(votesRes.error);
          return;
        }
        const list: VoteOrActivity[] = votesRes.votes || [];
        setMostRecent(list[0] || null);
        setIsActivity(!!votesRes.isActivity);
        setAttendance(votesRes.attendance ?? null);
        setBillsCount(billsRes.count ?? null);
      })
      .catch(() => setError('Could not load this representative.'))
      .finally(() => setLoading(false));
  }, [memberId, chamber]);

  useEffect(() => {
    if (!mostRecent) return;
    setSummaryLoading(true);
    fetch('/api/congress-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: mostRecent.bill,
        description: mostRecent.description,
        position: mostRecent.position,
        latestAction: mostRecent.result,
        location,
      }),
    })
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {})
      .finally(() => setSummaryLoading(false));
  }, [mostRecent, location]);

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-2xl px-[6vw] pb-16 pt-6">
        <button onClick={() => router.push('/government')} className="mb-4 flex items-center gap-2 text-sm text-muted">
          ← Your representatives
        </button>

        {bioLoading ? (
          <div className="mb-4 h-28 animate-pulse rounded-2xl bg-card" />
        ) : bio ? (
          <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Profile</p>
            <div className="flex flex-col gap-1.5 text-sm text-navy">
              {bio.firstTermYear && (
                <div>
                  In {isHouse ? 'the House' : 'the Senate'} since {bio.firstTermYear}
                  {bio.yearsServed !== null && ` — ${bio.yearsServed} year${bio.yearsServed === 1 ? '' : 's'} of service`}
                  {bio.termCount > 1 && ` (${bio.termCount} terms)`}
                </div>
              )}
              {bio.chambersServed.length > 1 && (
                <div>Previously served in: {bio.chambersServed.filter((c) => c !== chamber).join(', ')}</div>
              )}
              {bio.leadership.length > 0 && (
                <div>
                  Leadership: {bio.leadership.map((l) => `${l.type}${l.isCurrent ? ' (current)' : ` (${ordinal(l.congress)} Congress)`}`).join(', ')}
                </div>
              )}
              {bio.currentlySwitchedParty && (
                <div>Party history: {bio.partyHistory.map((p) => `${p.party} (since ${p.startYear})`).join(' → ')}</div>
              )}
              {bio.birthYear && <div>Born {bio.birthYear}</div>}
              {bio.website && (
                <a href={bio.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-terracotta">
                  Official website ↗
                </a>
              )}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-20 animate-pulse rounded-2xl bg-card" />
            <div className="h-40 animate-pulse rounded-2xl bg-card" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card p-8 text-center text-muted">{error}</div>
        ) : (
          <>
            {!isActivity && (
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                {billsCount !== null && (
                  <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                    <div className="font-display text-xl font-bold text-terracotta">{billsCount}</div>
                    <div className="text-[11px] text-muted">Bills sponsored</div>
                  </div>
                )}
                {attendance !== null && (
                  <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                    <div className="font-display text-xl font-bold text-green">{attendance}%</div>
                    <div className="text-[11px] text-muted">Attendance</div>
                  </div>
                )}
              </div>
            )}

            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
              {isActivity ? 'Most recent activity' : 'Most recent vote'}
            </p>

            {!mostRecent ? (
              <div className="rounded-2xl bg-card p-8 text-center text-muted">
                {isHouse ? 'No recent votes found yet.' : 'No recent activity found yet.'}
              </div>
            ) : (
              <div className="rounded-2xl bg-card p-5 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-base font-bold leading-snug text-navy">{mostRecent.bill}</div>
                    {mostRecent.date && <div className="mt-0.5 text-xs text-muted">{mostRecent.date}</div>}
                  </div>
                  {mostRecent.position && (
                    <span className="flex-shrink-0 rounded-full bg-[#E8F4F0] px-2.5 py-1 text-[11px] font-bold text-[#1e5c4a]">
                      YES
                    </span>
                  )}
                </div>

                {summaryLoading ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="h-16 animate-pulse rounded-xl bg-page" />
                    <div className="h-12 animate-pulse rounded-xl bg-page" />
                  </div>
                ) : summary ? (
                  <>
                    <div className="mt-3.5 rounded-xl bg-[#FFF8F3] p-3.5">
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

                <button
                  onClick={() => router.push(`/government/${memberId}/bills?chamber=${encodeURIComponent(chamber)}`)}
                  className="mt-4 w-full rounded-xl bg-terracotta py-3 text-sm font-bold text-cream"
                >
                  View all bills →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function MemberDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <MemberDetailContent />
    </Suspense>
  );
}

