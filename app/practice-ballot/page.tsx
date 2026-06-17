'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { useHouseholdProfile } from '@/lib/householdProfile';
import { estimateImpact, hasProfileData, buildPracticeImpactSynopsis } from '@/lib/impactEstimate';
import { BallotItem, HouseholdProfile, LocationBallot } from '@/lib/types';

type Selections = Record<string, string>;

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

const STORAGE_PREFIX = 'plainly-practice-';
const SUBMITTED_KEY_PREFIX = 'plainly-practice-submitted-';

function storageKey(location: string) {
  return `${STORAGE_PREFIX}${location.toLowerCase().replace(/\s+/g, '-')}`;
}

function submittedKey(location: string) {
  return `${SUBMITTED_KEY_PREFIX}${location.toLowerCase().replace(/\s+/g, '-')}`;
}

export default function PracticeBallotPage() {
  const { user } = useAuth();
  const { profile, loaded: profileLoaded } = useHouseholdProfile();
  const profileHasData = profileLoaded && hasProfileData(profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [ballot, setBallot] = useState<LocationBallot | null>(null);
  const [selections, setSelections] = useState<Selections>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStat[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => { if (p?.saved_location) setInputValue(p.saved_location); })
      .catch(() => {});
  }, [user]);

  async function loadBallot(loc: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ballot?location=${encodeURIComponent(loc)}`);
      if (!res.ok) throw new Error();
      const data: LocationBallot = await res.json();
      setBallot(data);
      setLocation(loc);
      // Check if already submitted this location
      try {
        const saved = localStorage.getItem(storageKey(loc));
        setSelections(saved ? JSON.parse(saved) : {});
        setAlreadySubmitted(!!localStorage.getItem(submittedKey(loc)));
      } catch {
        setSelections({});
        setAlreadySubmitted(false);
      }
    } catch {
      setError("We couldn't load ballot data for that location. Try a full street address or ZIP code.");
    } finally {
      setLoading(false);
    }
  }

  async function submitToCommunity() {
    if (!ballot || !location) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const votes = ballot.ballotItems
        .filter((item) => selections[item.id])
        .map((item) => ({
          itemId: item.id,
          itemTitle: item.title,
          itemLevel: item.level,
          selection: selections[item.id],
        }));

      const res = await fetch('/api/community-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, votes }),
      });

      if (!res.ok) throw new Error();

      try { localStorage.setItem(submittedKey(location), '1'); } catch {}
      setAlreadySubmitted(true);
      // Redirect to word-around-town page with location
      window.location.href = `/word-around-town?location=${encodeURIComponent(location)}`;
    } catch {
      setSubmitError("Couldn't submit right now \u2014 try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const loc = inputValue.trim();
    if (loc) loadBallot(loc);
  }

  function select(itemId: string, value: string) {
    const next = { ...selections, [itemId]: value };
    setSelections(next);
    if (location) {
      try { localStorage.setItem(storageKey(location), JSON.stringify(next)); } catch {}
    }
  }

  function clearAll() {
    setSelections({});
    if (location) {
      try {
        localStorage.removeItem(storageKey(location));
        localStorage.removeItem(submittedKey(location));
      } catch {}
    }
    setAlreadySubmitted(false);
  }

  const totalItems = ballot?.ballotItems.length ?? 0;
  const completedItems = Object.keys(selections).filter((id) =>
    ballot?.ballotItems.some((item) => item.id === id)
  ).length;
  const allDone = totalItems > 0 && completedItems === totalItems;

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">
        <h1 className="font-display text-[clamp(2rem,5vw,2.6rem)] font-bold leading-tight">
          Practice ballot
        </h1>
        <p className="mt-3 text-lg text-muted">
          See what&apos;s on your real ballot, read plain-language explainers,
          and make your practice selections before Election Day. Nothing here
          is submitted anywhere &mdash; it&apos;s just for you.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your address or ZIP code"
            aria-label="Enter your address or ZIP code"
            className="flex-1 rounded-xl border-2 border-navy bg-card px-4 py-3 text-base text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-terracotta px-5 py-3 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b04f30]"
          >
            Load my ballot
          </button>
        </form>

        {loading && (
          <div className="mt-8 text-center text-muted">Loading your ballot&hellip;</div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-terracotta/30 bg-terracotta/10 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {ballot && !loading && (
          <>
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-navy">
                  {completedItems} of {totalItems} completed
                </span>
                {completedItems > 0 && (
                  <button onClick={clearAll} className="text-muted underline hover:text-navy">
                    Clear all
                  </button>
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full rounded-full bg-terracotta transition-all duration-300"
                  style={{ width: `${totalItems ? (completedItems / totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              {ballot.ballotItems.map((item) => (
                <BallotCard
                  key={item.id}
                  item={item}
                  selected={selections[item.id]}
                  onSelect={(value) => select(item.id, value)}
                  profile={profile}
                  profileHasData={profileHasData}
                />
              ))}
            </div>

            <div ref={summaryRef} className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Your practice ballot</h2>
                {allDone && (
                  <span className="rounded-full bg-green/15 px-3 py-1 text-sm font-semibold text-green">
                    All done!
                  </span>
                )}
              </div>

              {completedItems === 0 ? (
                <p className="text-sm text-muted">
                  Make your selections above and they&apos;ll appear here as
                  a summary you can review before the real thing.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {ballot.ballotItems.map((item) => {
                    const sel = selections[item.id];
                    const isMeasure = !!item.voteMeaning || !item.candidates?.length;
                    if (!sel) {
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-dashed border-line px-4 py-3 text-sm"
                        >
                          <span className="text-muted">{item.title}</span>
                          <span className="text-xs text-muted">Not selected</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-semibold text-navy">{item.title}</div>
                          <div className="text-xs text-muted">{item.tag}</div>
                        </div>
                        <span
                          className={`ml-4 flex-shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                            isMeasure
                              ? sel === 'yes'
                                ? 'bg-green/15 text-green'
                                : 'bg-terracotta/15 text-terracotta'
                              : 'bg-navy/10 text-navy'
                          }`}
                        >
                          {isMeasure ? sel.toUpperCase() : sel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {completedItems > 0 && (
                <p className="mt-4 text-center text-sm text-muted">
                  Your selections are saved for this location. Come back
                  anytime to review or change them before Election Day.
                </p>
              )}
            </div>

            {allDone && (
              <div className="mt-6 rounded-2xl border border-green/30 bg-green/10 p-5 text-center">
                <div className="text-3xl">🎉</div>
                <div className="mt-2 font-display text-lg font-bold text-navy">
                  You&apos;re ready to vote!
                </div>
                <p className="mt-1 text-sm text-muted">
                  You&apos;ve gone through every item on your ballot. On
                  Election Day you&apos;ll know exactly what to expect.
                </p>
                <Link
                  href="/#vote"
                  className="mt-4 inline-block rounded-xl bg-terracotta px-5 py-2.5 text-sm font-bold text-white"
                >
                  Check your voter checklist &rarr;
                </Link>
              </div>
            )}

            {/* Community stats section */}
            {allDone && (
              <div className="mt-8 rounded-2xl border border-line bg-card p-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏘️</span>
                  <h2 className="font-display text-xl font-bold">Word around town</h2>
                </div>
                <p className="mt-2 text-sm text-muted">
                  See how other Plainly users in your area are leaning on
                  these issues. Completely anonymous &mdash; only your ZIP
                  code and ballot selections are ever stored.
                </p>

                {!alreadySubmitted ? (
                  <>
                    <button
                      onClick={submitToCommunity}
                      disabled={submitting}
                      className="mt-4 w-full rounded-xl bg-navy px-5 py-3 text-sm font-bold text-cream transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {submitting ? 'Sharing\u2026' : 'Share anonymously and see community results \u2192'}
                    </button>
                    {submitError && (
                      <p className="mt-2 text-xs text-terracotta">{submitError}</p>
                    )}
                  </>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="rounded-xl border border-green/20 bg-green/5 p-3 text-sm text-green">
                      Your selections have been shared. Thanks for contributing!
                    </div>
                    <Link
                      href={`/word-around-town?location=${encodeURIComponent(location)}`}
                      className="text-center text-sm font-semibold text-terracotta underline"
                    >
                      View community results \u2192
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}

function BallotCard({
  item,
  selected,
  onSelect,
  profile,
  profileHasData,
}: {
  item: BallotItem;
  selected: string | undefined;
  onSelect: (value: string) => void;
  profile: HouseholdProfile;
  profileHasData: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isMeasure = !!item.voteMeaning || !item.candidates?.length;
  const impact = profileHasData ? estimateImpact(item, profile) : null;
  const practiceImpact = profileHasData ? buildPracticeImpactSynopsis(item, profile) : null;

  return (
    <div
      className={`rounded-2xl border-2 bg-card p-5 transition-colors ${
        selected ? 'border-navy' : 'border-line'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">{item.icon}</span>
        <div className="flex-1">
          <div className="font-display text-[1.1rem] font-bold leading-tight text-navy">
            {item.title}
          </div>
          <div className="mt-0.5 text-sm text-muted">{item.tag}</div>
          <p className="mt-2 text-sm leading-relaxed text-navy/80">{item.summary}</p>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-sm font-semibold text-terracotta hover:underline"
      >
        {expanded ? 'Hide details' : 'Read more'} {expanded ? '\u25B2' : '\u25BC'}
      </button>

      {expanded && (
        <div className="mt-3 rounded-xl bg-cream p-4 text-sm leading-relaxed text-navy/90">
          <p>{item.full}</p>
          {item.voteMeaning && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-green/10 p-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-green">
                  YES means
                </div>
                <div>{item.voteMeaning.yes}</div>
              </div>
              <div className="rounded-lg bg-terracotta/10 p-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-terracotta">
                  NO means
                </div>
                <div>{item.voteMeaning.no}</div>
              </div>
            </div>
          )}
          {practiceImpact && (
            <div className="mt-3 border-t border-navy/10 pt-3 flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wide text-navy">
                What this could mean for your household
              </div>
              <div className="font-semibold text-terracotta">{impact?.amount}</div>
              <p className="text-xs leading-relaxed text-navy/80">{practiceImpact.synopsis}</p>
              <div className="mt-1 rounded-lg bg-navy/5 p-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-navy/60">
                  Real-world example
                </div>
                <p className="text-xs leading-relaxed text-navy/80">{practiceImpact.realWorldExample}</p>
              </div>
            </div>
          )}
          {!profileHasData && (item.level === 'local' || item.level === 'state') && (
            <div className="mt-3 border-t border-navy/10 pt-3 text-xs text-muted">
              <Link href="/profile" className="text-terracotta underline">
                Fill out your household profile
              </Link>{' '}
              to see a personalized impact estimate and real-world example for measures like this.
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-line pt-4">
        {isMeasure ? (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Your practice vote
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onSelect('yes')}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${
                  selected === 'yes'
                    ? 'border-green bg-green text-white'
                    : 'border-line text-navy hover:border-green'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => onSelect('no')}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${
                  selected === 'no'
                    ? 'border-terracotta bg-terracotta text-white'
                    : 'border-line text-navy hover:border-terracotta'
                }`}
              >
                NO
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Your practice vote
            </div>
            <div className="flex flex-col gap-3">
              {item.candidates?.map((c) => {
                const isSelected = selected === c.name;
                return (
                  <div
                    key={c.name}
                    className={`rounded-xl border-2 transition-colors ${
                      isSelected ? 'border-navy bg-navy' : 'border-line bg-card'
                    }`}
                  >
                    {/* Selectable row */}
                    <button
                      onClick={() => onSelect(c.name)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected ? 'border-cream' : 'border-muted'
                        }`}
                      >
                        {isSelected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-cream" />
                        )}
                      </span>
                      <span>
                        <span className={`block text-sm font-semibold ${isSelected ? 'text-cream' : 'text-navy'}`}>
                          {c.name}
                        </span>
                        {c.party && (
                          <span className={`text-xs ${isSelected ? 'text-cream/70' : 'text-muted'}`}>
                            {c.party}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* What are they proposing? */}
                    <div className={`border-t px-4 py-2.5 ${isSelected ? 'border-white/20' : 'border-line'}`}>
                      <div className={`mb-0.5 text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-cream/60' : 'text-muted'}`}>
                        What are they proposing?
                      </div>
                      <a
                        href={c.ballotpediaUrl ?? `https://ballotpedia.org/wiki/index.php?search=${encodeURIComponent(c.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs underline ${isSelected ? 'text-cream/80' : 'text-terracotta'}`}
                      >
                        Read {c.name.split(' ')[0]}&apos;s platform and positions on Ballotpedia &rarr;
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
