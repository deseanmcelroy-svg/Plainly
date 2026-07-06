'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

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

const PLACEHOLDER_COLORS = {
  local: 'linear-gradient(135deg, #1A5C3A, #5B8C7B)',
  state: 'linear-gradient(135deg, #2D4FB5, #4A72D4)',
  national: 'linear-gradient(135deg, #8B3A1A, #D9663E)',
};

function NewsDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');

  useEffect(() => {
    try {
      setLocation(localStorage.getItem('plainly-location') || '');
      const data = searchParams.get('data');
      if (data) {
        const parsed = JSON.parse(decodeURIComponent(data));
        setArticle(parsed);
        fetchSummary(parsed);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  async function fetchSummary(a: Article) {
    setLoading(true);
    try {
      const res = await fetch('/api/news-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: a.title,
          description: a.description,
          location,
        }),
      });
      const data = await res.json();
      setSummary(data);
    } catch {}
    setLoading(false);
  }

  if (!article) return (
    <main className="min-h-screen bg-page">
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <div className="px-[6vw] py-16 text-center text-muted">Article not found.</div>
      <Footer />
    </main>
  );

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

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
          <img src={article.imageUrl} alt={article.title} className="w-full h-52 object-cover" />
        ) : (
          <div
            className="w-full h-52 flex items-center justify-center text-6xl"
            style={{ background: PLACEHOLDER_COLORS[article.category] }}
          >
            {article.category === 'local' ? '🏘️' : article.category === 'state' ? '🏛️' : '🗺️'}
          </div>
        )}

        <div className="px-[6vw] mt-5">
          <h1 className="font-display text-2xl font-bold text-navy leading-snug mb-2">
            {article.title}
          </h1>
          <p className="text-xs text-muted mb-6">{article.source}</p>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl bg-card h-32 animate-pulse" />
              ))}
            </div>
          ) : summary ? (
            <div className="flex flex-col gap-4">

              <div className="rounded-2xl bg-card border border-line p-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">
                  📋 What this means for you
                </div>
                <p className="text-sm text-navy leading-relaxed">{summary.shortSummary}</p>
              </div>

              {summary.whatYourVoteDoes.length > 0 && (
                <div className="rounded-2xl bg-card border border-line p-5">
                  <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">
                    🗳️ What your vote does
                  </div>
                  <div className="flex flex-col gap-3">
                    {summary.whatYourVoteDoes.map(item => (
                      <div key={item.vote} className="flex gap-3 items-start">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-terracotta flex-shrink-0" />
                        <p className="text-sm text-navy leading-relaxed">
                          <span className="font-bold">{item.vote}</span> — {item.means}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-card border border-line p-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-terracotta">
                  🏘️ Local context
                </div>
                <p className="text-sm text-navy leading-relaxed">{summary.localContext}</p>
              </div>

              {summary.relatedTags.length > 0 && (
                <div className="rounded-2xl bg-card border border-line p-5">
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

              
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl bg-navy py-4 text-center text-base font-bold text-cream"
              >
                Read full article →
              </a>
            </div>
          ) : (
            <p className="text-muted text-sm">Could not load summary. Try again later.</p>
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
