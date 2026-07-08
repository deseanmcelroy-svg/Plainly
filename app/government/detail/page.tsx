'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

interface Summary {
  plainSummary: string;
  householdImpact: string;
  economicImpact: string;
  implementationUpdate: string;
  relatedTags: string[];
}

function DetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || '';
  const billNumber = searchParams.get('billNumber') || '';
  const position = searchParams.get('position') || '';
  const latestAction = searchParams.get('latestAction') || '';
  const location = searchParams.get('location') || '';

  useEffect(() => {
    if (!title) {
      setError('No item selected.');
      setLoading(false);
      return;
    }
    fetch('/api/congress-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, billNumber, position, latestAction, location }),
    })
      .then((r) => r.json())
      .then((d) => setSummary(d))
      .catch(() => setError('Could not load summary.'))
      .finally(() => setLoading(false));
  }, [title]);

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-2xl px-[6vw] pb-16 pt-2">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-muted">
          ← Back
        </button>

        {billNumber && (
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-terracotta">{billNumber}</p>
        )}
        <h1 className="mb-6 font-display text-2xl font-bold leading-snug text-navy">{title || 'Item'}</h1>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted">{error}</p>
        ) : summary ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">📋 Plain summary</div>
              <p className="text-sm leading-relaxed text-navy">{summary.plainSummary}</p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">🏠 Household impact</div>
              <p className="text-sm leading-relaxed text-navy">{summary.householdImpact}</p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">📈 Economic impact</div>
              <p className="text-sm leading-relaxed text-navy">{summary.economicImpact}</p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">🔄 Current status</div>
              <p className="text-sm leading-relaxed text-navy">{summary.implementationUpdate}</p>
            </div>

            {summary.relatedTags?.length > 0 && (
              <div className="rounded-2xl border border-line bg-card p-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">🔗 Related topics</div>
                <div className="flex flex-wrap gap-2">
                  {summary.relatedTags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-page px-3 py-1 text-xs font-semibold text-green">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">Could not load summary. Please try again.</p>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <DetailContent />
    </Suspense>
  );
}
