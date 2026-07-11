'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import Link from 'next/link';

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}

const CATEGORY_COLORS = {
  local: { bg: '#E8F4F0', text: '#2D7A65', label: 'Local' },
  state: { bg: '#EEF2FB', text: '#2D4FB5', label: 'State' },
  national: { bg: '#FFF0EB', text: '#C04A1A', label: 'National' },
};

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

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'local' | 'state' | 'national'>('all');
  const [location, setLocation] = useState('');

  useEffect(() => {
    let loc = '';
    try {
      loc = localStorage.getItem('plainly-location') || '';
    } catch {}
    setLocation(loc);
    fetch(`/api/news?location=${encodeURIComponent(loc)}`)
      .then(r => r.json())
      .then(d => setArticles(d.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? articles
    : articles.filter(a => a.category === filter);

  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto max-w-2xl px-[6vw] pb-16">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-navy">In the news</h1>
          <p className="mt-1 text-sm text-muted">
            {location
              ? `Stories relevant to your ballot · ${location}`
              : 'Civic news relevant to voters'}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'local', 'state', 'national'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-terracotta text-white'
                  : 'bg-card text-navy border border-line'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center">
            <p className="text-muted">No stories found for this filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(article => (
              <div
                key={article.id}
                className="overflow-hidden rounded-2xl border border-line bg-card"
              >
                <div className="relative">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-44 w-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className="flex h-44 w-full items-center justify-center text-5xl"
                      style={{ background: PLACEHOLDER_BG[article.category] }}
                    >
                      {PLACEHOLDER_EMOJI[article.category]}
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <span
                      className="rounded-full px-2 py-1 text-xs font-bold"
                      style={{
                        background: CATEGORY_COLORS[article.category].bg,
                        color: CATEGORY_COLORS[article.category].text,
                      }}
                    >
                      {CATEGORY_COLORS[article.category].label}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy">{article.source}</span>
                    <span className="text-xs text-muted">· {timeAgo(article.publishedAt)}</span>
                  </div>
                  <h2 className="mb-2 text-base font-bold leading-snug text-navy">
                    {article.title}
                  </h2>
                  <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted">
                    {article.description}
                  </p>

                  <Link
                    href={`/news/${encodeURIComponent(article.id)}?data=${encodeURIComponent(JSON.stringify(article))}`}
                    className="mb-3 block w-full cursor-pointer rounded-xl border border-terracotta/30 bg-page p-3 transition-colors hover:border-terracotta"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-terracotta">
                        What this means for you
                      </span>
                      <span className="text-xs text-terracotta">→</span>
                    </div>
                    <p className="text-xs text-navy">Tap to understand deeper context</p>
                  </Link>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl bg-navy py-2.5 text-center text-sm font-bold text-cream"
                  >
                    Read article
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
