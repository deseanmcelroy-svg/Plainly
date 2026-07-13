'use client';

import { useEffect, useState, Suspense } from 'react';
import { useHouseholdProfile } from '@/lib/householdProfile';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
  category: 'local' | 'state' | 'national';
}

interface Summary {
  shortSummary: string;
  whatYourVoteDoes: { vote: string; means: string }[];
  localContext: string;
  relatedTags: string[];
}

const PLACEHOLDER_BG = {
  local: 'linear-gradient(135deg, #1A5C3A, #5B8C7B)',
  state: 'linear-gradient(135deg, #2D4FB5, #4A72D4)',
  national: 'linear-gradient(135deg, #8B3A1A, #D9663E)',
};

const PLACEHOLDER_EMOJI = {
  local: '🏘️',
  state: '🏛️',
  national: '🗺️',
};

function NewsDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useHouseholdProfile();
  const [article, setArticle] = useState<Article | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = searchParams.get('data');
      if (data) {
        const parsed: Article = JSON.parse(decodeURIComponent(data));
        setArticle(parsed);
        let loc = '';
        loc = profile.zip_code || '';
        fetch('/api/news-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: parsed.title,
            description: parsed.description,
            location: loc,
          }),
        })
          .then(r => r.json())
          .then(d => setSummary(d))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  if (!article) {
    return (
      <main className="min-h-screen bg-page">
        <div className="px-[6vw] py-16 text-center text-muted">Article not found.</div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page">

      <div className="mx-auto max-w-2xl pb-16">
        <div className="px-[6vw] mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted"
          >
            ← Back to news
          </button>
        </div>

        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div
            className="flex h-52 w-full items-center justify-center text-6xl"
            style={{ background: PLACEHOLDER_BG[article.category] }}
          >
            {PLACEHOLDER_EMOJI[article.category]}
          </div>
        )}

        <div className="px-[6vw] mt-5">
          <h1 className="font-display mb-2 text-2xl font-bold leading-snug text-navy">
            {article.title}
          </h1>
          <p className="mb-6 text-xs text-muted">{article.source}</p>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          ) : summary ? (
            <div className="flex flex-col gap-4">

              <div className="rounded-2xl border border-line bg-card p-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">
                  📋 What this means for you
                </div>
                <p className="text-sm leading-relaxed text-navy">{summary.shortSummary}</p>
              </div>

              {summary.whatYourVoteDoes.length > 0 && (
                <div className="rounded-2xl border border-line bg-card p-5">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">
                    🗳️ What your vote does
                  </div>
                  <div className="flex flex-col gap-3">
                    {summary.whatYourVoteDoes.map(item => (
                      <div key={item.vote} className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
                        <p className="text-sm leading-relaxed text-navy">
                          <span className="font-bold">{item.vote}</span> — {item.means}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-line bg-card p-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">
                  🏘️ Local context
                </div>
                <p className="text-sm leading-relaxed text-navy">{summary.localContext}</p>
              </div>

              {summary.relatedTags.length > 0 && (
                <div className="rounded-2xl border border-line bg-card p-5">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">
                    🔗 Related topics
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary.relatedTags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-full bg-page px-3 py-1 text-xs font-semibold text-green"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl bg-navy py-4 text-center text-base font-bold text-cream"
              >
                Read full article →
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted">Could not load summary. Please try again.</p>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function NewsDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <NewsDetailContent />
    </Suspense>
  );
}
