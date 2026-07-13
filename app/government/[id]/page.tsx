'use client';

import { useEffect, useState, Suspense } from 'react';
import { useHouseholdProfile } from '@/lib/householdProfile';
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
  cosponsoredCount: number | null;
}

const CANDIDATE_PARTY_COLOR: Record<string, { bg: string; border: string; text: string; avatar: string }> = {
  Republican: { bg: '#FFF8F3', border: '#F0E4D8', text: '#993C1D', avatar: '#D9663E' },
  Democratic: { bg: '#EEF3F8', border: '#DCE8F2', text: '#0C447C', avatar: '#378ADD' },
  Independent: { bg: '#EAF3DE', border: '#D9E8C4', text: '#27500A', avatar: '#8FBFA8' },
  Libertarian: { bg: '#FBEAF0', border: '#F0D0DE', text: '#72243E', avatar: '#D4537E' },
  Green: { bg: '#EAF3DE', border: '#D9E8C4', text: '#173404', avatar: '#639922' },
};

function candidatePartyStyle(party: string) {
  return CANDIDATE_PARTY_COLOR[party] || { bg: '#F4F2EA', border: '#E5E2D8', text: '#5f5e5a', avatar: '#B4B2A9' };
}

function candidateInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function ordinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

const PARTY: Record<string, { pillBg: string; pillText: string; gradient: string }> = {
  Republican: { pillBg: 'rgba(217,102,62,0.25)', pillText: '#FAECE7', gradient: 'linear-gradient(135deg,#D9663E,#c25530)' },
  Democratic: { pillBg: 'rgba(91,143,217,0.25)', pillText: '#E6F1FB', gradient: 'linear-gradient(135deg,#5B8FD9,#4577c2)' },
  Independent: { pillBg: 'rgba(143,191,168,0.25)', pillText: '#EAF3DE', gradient: 'linear-gradient(135deg,#5B8C7B,#4a7566)' },
};

function partyStyle(party: string) {
  return PARTY[party] || PARTY.Independent;
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

function isOnBallotThisCycle(nextElection: string): boolean {
  if (!nextElection) return false;
  const year = parseInt(nextElection, 10);
  return year - new Date().getFullYear() <= 1;
}

interface Summary {
  whatThisMeansForYou: string;
  economicImpact: string;
  stageLabel: string;
  stagePercent: number;
}

const STAGE_COLOR = (percent: number) => (percent >= 100 ? '#2D7A65' : percent >= 55 ? '#8FBFA8' : '#D9A55E');

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

function MemberDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;

  const { profile } = useHouseholdProfile();
  const [chamber, setChamber] = useState(searchParams.get('chamber') || '');
  const [repName, setRepName] = useState(searchParams.get('name') || '');
  const [repParty, setRepParty] = useState(searchParams.get('party') || '');
  const [repDistrict, setRepDistrict] = useState(searchParams.get('district') || '');
  const [repDepiction, setRepDepiction] = useState(searchParams.get('depiction') || '');
  const [repNextElection, setRepNextElection] = useState(searchParams.get('nextElection') || '');
  const [repState, setRepState] = useState(searchParams.get('state') || '');
  const isHouse = chamber.includes('House');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostRecent, setMostRecent] = useState<VoteOrActivity | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [bioLoading, setBioLoading] = useState(true);
  const [policyAreas, setPolicyAreas] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<{ name: string; party: string; role: string }[]>([]);
  const [electionDate, setElectionDate] = useState<string | null>(null);
  const [isActivity, setIsActivity] = useState(false);
  const [attendance, setAttendance] = useState<number | null>(null);
  const [billsCount, setBillsCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [dataAsOf, setDataAsOf] = useState<string | null>(null);

  useEffect(() => {
    if (repName || !memberId) return;
    fetch(`/api/congress?type=member-info&memberId=${memberId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setRepName(d.name || '');
        setRepParty(d.party || '');
        setRepDistrict(d.district?.toString() || '');
        setRepDepiction(d.depiction || '');
        setRepNextElection(d.nextElection || '');
        setRepState(d.state || '');
        setChamber(d.chamber || '');
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  useEffect(() => {
    setBioLoading(true);
    fetch(`/api/congress?type=bio&memberId=${memberId}`)
      .then((r) => r.json())
      .then((d) => setBio(d.error ? null : d))
      .catch(() => setBio(null))
      .finally(() => setBioLoading(false));

    fetch(`/api/congress?type=policy-areas&memberId=${memberId}`)
      .then((r) => r.json())
      .then((d) => setPolicyAreas(d.policyAreas || []))
      .catch(() => {});
  }, [memberId]);

  useEffect(() => {
    if (!chamber || !repState || !repNextElection) return;
    const q = new URLSearchParams({
      chamber,
      state: repState,
      district: repDistrict || '',
      cycle: repNextElection,
    });
    fetch(`/api/congress?type=candidates&${q.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setCandidates(d.candidates || []);
        setElectionDate(d.electionDate || null);
      })
      .catch(() => {});
  }, [chamber, repState, repDistrict, repNextElection]);

  useEffect(() => {
    if (!chamber) return;
    try {
      setLocation(profile.zip_code || '');
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
        setDataAsOf(votesRes.dataAsOf ?? null);
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

  const freshness = relativeTime(dataAsOf);

  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto max-w-2xl px-[6vw] pb-16 pt-6">
        <button onClick={() => router.push('/government')} className="mb-4 flex items-center gap-2 text-sm text-muted">
          ← Your representatives
        </button>

        {bioLoading && !repName ? (
          <div className="mb-4 h-48 animate-pulse rounded-2xl bg-card" />
        ) : (
          <div className="mb-4 overflow-hidden rounded-2xl bg-card shadow-md">
            <div
              className="flex items-center gap-3.5 p-5"
              style={{ background: 'linear-gradient(135deg,#1A2B3D,#243B52)' }}
            >
              {repDepiction ? (
                <img src={repDepiction} alt={repName} className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover" />
              ) : (
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white"
                  style={{ background: partyStyle(repParty).gradient }}
                >
                  {initials(repName)}
                </div>
              )}
              <div>
                <div className="font-display text-lg font-bold text-cream">
                  {isHouse ? 'Rep. ' : 'Sen. '}
                  {repName}
                </div>
                <div className="mt-0.5 text-xs text-cream/60">
                  {isHouse
                    ? `${repState || 'Their state'}'s ${repDistrict}${ordinalSuffix(Number(repDistrict))} District`
                    : `United States Senate${repState ? ` · ${repState}` : ''}`}
                </div>
                {repParty && (
                  <span
                    className="mt-1.5 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ background: partyStyle(repParty).pillBg, color: partyStyle(repParty).pillText }}
                  >
                    {repParty}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col px-4">
              {bio?.firstTermYear && (
                <div className="flex items-center gap-2.5 border-b border-line/60 py-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3DE]">
                    <span className="text-sm">📅</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-navy">
                      In {isHouse ? 'the House' : 'the Senate'} since {bio.firstTermYear}
                    </div>
                    <div className="text-xs text-muted">
                      {bio.yearsServed} year{bio.yearsServed === 1 ? '' : 's'} of service
                      {bio.termCount > 1 && ` · ${bio.termCount} terms`}
                    </div>
                  </div>
                </div>
              )}

              {bio && bio.chambersServed.length > 1 && (
                <div className="flex items-center gap-2.5 border-b border-line/60 py-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF3F8]">
                    <span className="text-sm">🏛️</span>
                  </div>
                  <div className="text-[13px] font-semibold text-navy">
                    Also served in: {bio.chambersServed.filter((c) => c !== chamber).join(', ')}
                  </div>
                </div>
              )}

              {bio && bio.leadership.length > 0 && (
                <div className="flex items-center gap-2.5 border-b border-line/60 py-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF0EB]">
                    <span className="text-sm">⭐</span>
                  </div>
                  <div className="text-[13px] font-semibold text-navy">
                    {bio.leadership.map((l) => `${l.type}${l.isCurrent ? ' (current)' : ` (${ordinal(l.congress)} Congress)`}`).join(', ')}
                  </div>
                </div>
              )}

              {repNextElection && (
                <div className="flex items-center gap-2.5 border-b border-line/60 py-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF3F8]">
                    <span className="text-sm">🗳️</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-navy">Up for reelection Nov {repNextElection}</div>
                    {isOnBallotThisCycle(repNextElection) && (
                      <div className="text-xs text-muted">On your ballot this cycle</div>
                    )}
                  </div>
                </div>
              )}

              {bio?.birthYear && (
                <div className="flex items-center gap-2.5 py-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F4F2EA]">
                    <span className="text-sm">🎂</span>
                  </div>
                  <div className="text-[13px] font-semibold text-navy">Born {bio.birthYear}</div>
                </div>
              )}
            </div>

            {policyAreas.length > 0 && (
              <div className="border-t border-line/60 px-4 py-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Policy focus</div>
                <div className="flex flex-wrap gap-1.5">
                  {policyAreas.map((area) => (
                    <span key={area} className="rounded-full bg-[#F4F2EA] px-2.5 py-1 text-[11px] font-semibold text-navy">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {bio?.website && (
              <a
                href={bio.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border-t border-line bg-page py-3 text-sm font-bold text-terracotta"
              >
                Official website ↗
              </a>
            )}
          </div>
        )}

        {candidates.filter((c) => c.role !== 'Incumbent').length > 0 && (
          <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Who is running against your representative</p>
            <div className="flex flex-col gap-2">
              {candidates
                .filter((c) => c.role !== 'Incumbent')
                .map((c, i) => {
                  const style = candidatePartyStyle(c.party);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl p-2.5"
                      style={{ background: style.bg, border: `0.5px solid ${style.border}` }}
                    >
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                        style={{ background: style.avatar }}
                      >
                        {candidateInitials(c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-navy">{c.name}</div>
                        <div className="text-[11px]" style={{ color: style.text }}>
                          {c.party}. Running against {repName}
                          {electionDate ? ` ${electionDate}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
              Based on FEC candidate filings. Reflects who has registered to run — not a confirmed general-election
              matchup.
            </p>
          </div>
        )}

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
              <div className="mb-4 grid grid-cols-3 gap-2.5">
                {billsCount !== null && (
                  <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                    <div className="font-display text-xl font-bold text-terracotta">{billsCount}</div>
                    <div className="text-[11px] text-muted">Sponsored</div>
                  </div>
                )}
                {bio?.cosponsoredCount != null && (
                  <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                    <div className="font-display text-xl font-bold text-[#378ADD]">{bio.cosponsoredCount}</div>
                    <div className="text-[11px] text-muted">Cosponsored</div>
                  </div>
                )}
                {attendance !== null && (
                  <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                    <div className="font-display text-xl font-bold text-green">{attendance}%</div>
                    <div className="text-[11px] text-muted">Attendance</div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-green" style={{ width: `${attendance}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">
                {isActivity ? 'Most recent activity' : 'Most recent vote'}
              </p>
              {freshness && <p className="text-[11px] text-muted">Updated {freshness}</p>}
            </div>

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
                    <span
                      className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={
                        mostRecent.position.toLowerCase().includes('aye')
                          ? { background: '#E8F4F0', color: '#1e5c4a' }
                          : { background: '#FFF0EB', color: '#993C1D' }
                      }
                    >
                      {mostRecent.position.toLowerCase().includes('aye') ? 'YES' : 'NO'}
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

