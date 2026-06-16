'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BallotItem, GovernmentLevel } from '@/lib/types';
import { useHouseholdProfile } from '@/lib/householdProfile';
import { estimateImpact, hasProfileData } from '@/lib/impactEstimate';

type Filter = 'all' | GovernmentLevel;

interface RaceListProps {
  items: BallotItem[];
  initialFilter?: Filter;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'local', label: 'My community' },
  { key: 'state', label: 'My state' },
  { key: 'federal', label: 'National' },
];

const ICON_BG: Record<GovernmentLevel, string> = {
  local: 'bg-green/15',
  state: 'bg-terracotta/15',
  federal: 'bg-[#7d6fb3]/15',
};

export default function RaceList({ items, initialFilter = 'all' }: RaceListProps) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { profile, loaded: profileLoaded } = useHouseholdProfile();
  const profileHasData = profileLoaded && hasProfileData(profile);

  // Support linking directly to local issues, e.g. from the ballot summary's
  // "Local issues" callout: /#races-local
  useEffect(() => {
    function checkHash() {
      if (window.location.hash === '#races-local') {
        setFilter('local');
      }
    }
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const visible = items.filter((item) => filter === 'all' || item.level === filter);

  return (
    <section id="races" className="mx-auto max-w-[1000px] px-[6vw] py-12">
      <span id="races-local" className="block h-0 w-0" aria-hidden="true" />
      <div className="mb-9 text-center">
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight">
          What you&apos;ll see on Election Day
        </h2>
        <p className="mx-auto max-w-[480px] text-base text-muted">
          Tap any card to learn who&apos;s running and what it means for you.
        </p>
      </div>

      <div className="mb-7 flex flex-wrap justify-center gap-2.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-3xl border-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
              filter === f.key
                ? 'border-navy bg-navy text-cream'
                : 'border-line bg-card text-navy hover:border-navy'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[14px]">
        {visible.map((item) => {
          const isOpen = expanded.has(item.id);
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => toggle(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(item.id);
                }
              }}
              className="cursor-pointer rounded-2xl border border-line bg-card px-[26px] py-6 transition-shadow hover:border-transparent hover:shadow-[0_12px_30px_-20px_rgba(26,43,61,0.25)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-[14px]">
                  <div
                    className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl text-xl ${ICON_BG[item.level]}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-[1.15rem] font-bold leading-tight">
                      {item.title}
                    </h3>
                    <div className="text-sm text-muted">{item.tag}</div>
                  </div>
                </div>
                <div
                  className={`flex-shrink-0 text-2xl text-muted/50 transition-transform ${
                    isOpen ? 'rotate-90 text-terracotta' : ''
                  }`}
                >
                  ›
                </div>
              </div>
              {isOpen && (
                <div className="mt-4 border-t border-line pt-4 text-base text-muted">
                  <div className="mb-2 font-semibold text-navy">{item.summary}</div>
                  {item.full}
                  {item.voteMeaning && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-green/10 p-4">
                        <div className="mb-1 text-sm font-bold uppercase tracking-wide text-green">
                          If you vote YES
                        </div>
                        <div className="text-sm text-navy/90">{item.voteMeaning.yes}</div>
                      </div>
                      <div className="rounded-xl bg-terracotta/10 p-4">
                        <div className="mb-1 text-sm font-bold uppercase tracking-wide text-terracotta">
                          If you vote NO
                        </div>
                        <div className="text-sm text-navy/90">{item.voteMeaning.no}</div>
                      </div>
                    </div>
                  )}
                  {profileHasData &&
                    (() => {
                      const impact = estimateImpact(item, profile);
                      if (!impact) return null;
                      return (
                        <div className="mt-4 rounded-xl border border-line bg-cream p-4">
                          <div className="mb-1 text-sm font-bold uppercase tracking-wide text-navy">
                            What this could mean for you
                          </div>
                          <div className="text-lg font-bold text-terracotta">{impact.amount}</div>
                          <div className="mt-1 text-sm text-muted">{impact.basis}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                sessionStorage.setItem(
                                  `plainly-impact-${item.id}`,
                                  JSON.stringify({ item, profile, impact })
                                );
                              } catch {
                                // sessionStorage unavailable — link still
                                // works, the detail page just won't have
                                // pre-loaded data and will show a fallback.
                              }
                              window.location.href = `/impact/${item.id}`;
                            }}
                            className="mt-3 text-sm font-semibold text-terracotta underline"
                          >
                            Additional context →
                          </button>
                        </div>
                      );
                    })()}
                  {!profileHasData && (item.level === 'local' || item.level === 'state') && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted"
                    >
                      <Link href="/profile" className="text-terracotta underline">
                        Tell us a bit about your household
                      </Link>{' '}
                      to see an estimate of what measures like this could mean for you.
                    </div>
                  )}
                  {item.candidates && item.candidates.length > 0 && (
                    <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                      <div className="mb-2 text-sm font-bold uppercase tracking-wide text-navy">
                        Candidates
                      </div>
                      <div className="flex flex-col gap-2">
                        {item.candidates.map((c) => {
                          const slug = encodeURIComponent(c.name.toLowerCase().replace(/\s+/g, '-'));
                          return (
                            <button
                              key={c.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  sessionStorage.setItem(
                                    `plainly-candidate-${slug}`,
                                    JSON.stringify({ ...c, raceTitle: item.title, raceTag: item.tag })
                                  );
                                } catch {}
                                window.location.href = `/candidate/${slug}`;
                              }}
                              className="flex items-center justify-between rounded-xl border border-line bg-cream px-4 py-3 text-left transition-colors hover:border-navy hover:bg-card"
                            >
                              <span>
                                <span className="block text-sm font-semibold text-navy">{c.name}</span>
                                {c.party && (
                                  <span className="text-xs text-muted">{c.party}</span>
                                )}
                              </span>
                              <span className="text-sm text-terracotta">View profile ›</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {item.sourceText && (
                    <details className="mt-4">
                      <summary
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer text-sm font-semibold text-navy underline"
                      >
                        Read the official ballot text
                      </summary>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 whitespace-pre-wrap rounded-xl bg-cream p-4 text-sm text-muted"
                      >
                        {item.sourceText}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
