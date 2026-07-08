'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

interface Summary {
  shortSummary: string;
  householdImpact: string[];
  economicImpact: string[];
  currentUpdate: string;
  relatedTags: string[];
}

function DetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const title = searchParams.get('title') || '';
  const vote = searchParams.get('vote') || '';
  const member = searchParams.get('member') || '';
  const location = searchParams.get('location') || '';
  const type = searchParams.get('type') || 'vote';
  const desc = searchParams.get('desc') || '';
  const displayName = member.split(',').reverse().join(' ').trim();

  useEffect(() => {
    if (!title) { setLoading(false); return; }
    fetch('/api/congress-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc, vote, memberName: displayName, location, type }),
    })
      .then(r => r.json())
      .then(d => setSummary(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!title) return (
    <main className="min-h-screen bg-page">
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <div className="px-[6vw] py-16 text-center text-muted">Item not found.</div>
      <Footer />
    </main>
  );

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="bg-navy px-[6vw] pb-6 pt-4">
        <button onClick={() => router.back()} className="mb-3 flex items-center gap-2 text-sm text-cream/70">
          ← Back
        </button>
        {vote && (
          <div className={'mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ' + (vote === 'Yes' ? 'bg-green/20 text-green' : vote === 'No' ? 'bg-terracotta/20 text-terracotta' : 'bg-white/10 text-cream/70')}>
            {displayName} voted {vote.toUpperCase()}
          </div>
        )}
        {type === 'bill' && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-900/40 px-3 py-1 text-xs font-bold text-blue-300">
            Bill sponsored by {displayName}
          </div>
        )}
        <h1 className="font-display text-xl font-bold leading-snug text-cream">{title}</h1>
        {desc && <p className="mt-2 text-xs text-cream/50">{desc}</p>}
      </div>

      <div className="mx-auto max-w-2xl px-[6vw] py-4 pb-16">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />)}
          </div>
        ) : summary ? (
          <div className="flex flex-col gap-4">

            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">📋 What this means for you</p>
              <p className="text-sm leading-relaxed text-navy">{summary.shortSummary}</p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">🏠 Household impact</p>
              <div className="flex flex-col gap-2">
                {summary.householdImpact.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
                    <p className="text-sm leading-relaxed text-navy">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">📈 Economic impact</p>
              <div className="flex flex-col gap-2">
                {summary.economicImpact.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
                    <p className="text-sm leading-relaxed text-navy">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-navy p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-terracotta">📡 Current implementation update</p>
              <p className="text-xs text-cream/50 mb-3">As of mid-2026</p>
              <p className="text-sm leading-relaxed text-cream">{summary.currentUpdate}</p>
            </div>

            {summary.relatedTags.length > 0 && (
              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">🔗 Related topics</p>
                <div className="flex flex-wrap gap-2">
                  {summary.relatedTags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-page px-3 py-1 text-xs font-semibold text-green">{tag}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <p className="text-sm text-muted">Could not load context. Please try again.</p>
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
