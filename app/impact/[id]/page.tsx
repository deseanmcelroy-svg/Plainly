'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { BallotItem, HouseholdProfile, ImpactEstimate } from '@/lib/types';
import { buildAdditionalContext, buildHomeValueComparison } from '@/lib/impactEstimate';

interface StoredImpact {
  item: BallotItem;
  profile: HouseholdProfile;
  impact: ImpactEstimate;
}

const HOME_VALUE_LABELS: Record<NonNullable<HouseholdProfile['home_value_range']>, string> = {
  under_150k: 'under $150,000',
  '150k_300k': '$150,000\u2013$300,000',
  '300k_500k': '$300,000\u2013$500,000',
  '500k_plus': '$500,000+',
};

export default function ImpactDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<StoredImpact | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`plainly-impact-${id}`);
      if (raw) setData(JSON.parse(raw));
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, [id]);

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">
        {!loaded && <div className="py-12 text-center text-muted">Loading…</div>}

        {loaded && !data && (
          <div className="py-12 text-center">
            <h1 className="font-display text-2xl font-bold">We lost track of that one</h1>
            <p className="mx-auto mt-3 max-w-[420px] text-base text-muted">
              This page only works when you get here from a ballot item.
              Head back to your ballot and tap &quot;Additional context&quot;
              on the measure you&apos;re curious about.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-terracotta px-5 py-3 text-base font-bold text-white"
            >
              Back to my ballot
            </Link>
          </div>
        )}

        {loaded && data && <DetailContent item={data.item} profile={data.profile} impact={data.impact} />}
      </div>

      <Footer />
    </main>
  );
}

function DetailContent({
  item,
  profile,
  impact,
}: {
  item: BallotItem;
  profile: HouseholdProfile;
  impact: ImpactEstimate;
}) {
  const additionalContext = buildAdditionalContext(item, profile);
  const comparison = buildHomeValueComparison(item);
  const yourLabel = profile.home_value_range ? HOME_VALUE_LABELS[profile.home_value_range] : null;

  return (
    <>
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{item.tag}</div>
      <h1 className="font-display text-[clamp(1.8rem,4.5vw,2.4rem)] font-bold leading-tight">
        {item.title}
      </h1>
      <p className="mt-3 text-lg text-muted">{item.summary}</p>

      <div className="mt-6 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-display text-lg font-bold">The short version</h2>
        <p className="mt-2 text-base text-muted">{item.full}</p>
      </div>

      {item.voteMeaning && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-green/10 p-4">
            <div className="mb-1 text-sm font-bold uppercase tracking-wide text-green">If you vote YES</div>
            <div className="text-sm text-navy/90">{item.voteMeaning.yes}</div>
          </div>
          <div className="rounded-xl bg-terracotta/10 p-4">
            <div className="mb-1 text-sm font-bold uppercase tracking-wide text-terracotta">If you vote NO</div>
            <div className="text-sm text-navy/90">{item.voteMeaning.no}</div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-cream p-6">
        <h2 className="font-display text-lg font-bold">What this could mean for your household</h2>
        <div className="mt-2 text-xl font-bold text-terracotta">{impact.amount}</div>
        <p className="mt-2 text-base text-muted">{impact.basis}</p>

        {additionalContext.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
            {additionalContext.map((note, i) => (
              <p key={i} className="text-sm text-muted">
                {note}
              </p>
            ))}
          </div>
        )}
      </div>

      {comparison && (
        <div className="mt-6 rounded-2xl border border-line bg-card p-6">
          <h2 className="font-display text-lg font-bold">How this compares by home value</h2>
          <p className="mt-2 text-sm text-muted">
            Here&apos;s roughly what this measure could mean across different home
            values, for context:
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {comparison.map((row) => {
              const isYours = yourLabel === row.label;
              return (
                <div
                  key={row.label}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                    isYours ? 'bg-navy text-cream' : 'bg-cream text-navy'
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {row.label}
                    {isYours && ' (you)'}
                  </span>
                  <span className="text-sm">{row.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {item.sourceText && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-navy underline">
            Read the official ballot text
          </summary>
          <div className="mt-2 whitespace-pre-wrap rounded-xl bg-cream p-4 text-sm text-muted">
            {item.sourceText}
          </div>
        </details>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        These estimates are approximate and based on the broad ranges you shared
        on{' '}
        <Link href="/profile" className="text-terracotta underline">
          your household page
        </Link>
        . They&apos;re meant to help you understand the scale of a measure —
        not to tell you how to vote.
      </p>

      <Link href="/#races" className="mt-6 inline-block text-sm text-terracotta underline">
        ← Back to my ballot
      </Link>
    </>
  );
}
