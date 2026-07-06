'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
  category: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return days + 'd ago';
  if (hours > 0) return hours + 'h ago';
  return 'Just now';
}

const CAT: Record<string, { bg: string; color: string; label: string; gradient: string }> = {
  local: { bg: '#E8F4F0', color: '#2D7A65', label: 'Local', gradient: 'linear-gradient(135deg,#1A5C3A,#5B8C7B)' },
  state: { bg: '#EEF2FB', color: '#2D4FB5', label: 'State', gradient: 'linear-gradient(135deg,#2D4FB5,#4A72D4)' },
  national: { bg: '#FFF0EB', color: '#C04A1A', label: 'National', gradient: 'linear-gradient(135deg,#8B3A1A,#D9663E)' },
};

function ArticleCard({ article }: { article: Article }) {
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(true);
  const cat = CAT[article.category] || CAT.national;

  useEffect(() => {
    let loc = '';
    try { loc = localStorage.getItem('plainly-location') || ''; } catch {}
    fetch('/api/news-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: article.title, description: article.description, location: loc, shortOnly: true }),
    })
      .then(r => r.json())
      .then(d => setSummary(d.shortSummary || ''))
      .catch(() => setSummary(''))
      .finally(() => setLoadingSummary(false));
  }, []);

  const encoded = encodeURIComponent(JSON.stringify({ ...article, quickSummary: summary }));

  return (
    <div className="overflow-hidden rounded-2xl bg-card border border-line">
      <div className="relative">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title} className="w-full h-44 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-44 flex items-center justify-center text-5xl" style={{ background: cat.gradient }}>
            {article.category === 'local' ? '🏘️' : article.category === 'state' ? '🏛️' : '🗺️'}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ background: cat.bg, color: cat.color }}>
            {cat.label}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-navy">{article.source}</span>
          <span className="text-xs text-muted">· {timeAgo(article.publishedAt)}</span>
        </div>
        <h2 className="mb-2 text-base font-bold text-navy leading-snug">{article.title}</h2>
        <p className="mb-3 text-sm text-muted leading-relaxed line-clamp-2">{article.description}</p>

        <div className="mb-3 rounded-xl bg-page border border-line p-3">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-terracotta">
            What this means for you
          </div>
          {loadingSummary ? (
            <div className="h-4 w-3/4 animate-pulse rounded bg-line" />
          ) : summary ? (
            <p className="text-xs text-navy leading-relaxed">{summary}</p>
          ) : (
            <p className="text-xs text-muted">Summary unavailable.</p>
          )}
          <Link
            href={'/news/' + encodeURIComponent(article.id) + '?data=' + encoded}
            className="mt-2 block text-xs font-semibold text-terracotta"
          >
            Tap to understand deeper context →
          </Link>
        </div>

        <a href={article.url} target="_blank" rel="noopener noreferrer" className="block w-full rounded-xl bg-navy py-2.5 text-center text-sm font-bold text-cream">
          Read article
        </a>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [location, setLocation] = useState('');

  useEffect(() => {
    let loc = '';
    try { loc = localStorage.getItem('plainly-location') || ''; } catch {}
    setLocation(loc);
    fetch('/api/news?location=' + encodeURIComponent(loc))
      .then(r => r.json())
      .then(d => setArticles(d.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter);

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <div className="mx-auto max-w-2xl px-[6vw] pb-16">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-navy">In the news</h1>
          <p className="mt-1 text-sm text-muted">
            {location ? 'Stories relevant to your ballot · ' + location : 'Civic news relevant to voters'}
          </p>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'local', 'state', 'national'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={'rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ' + (filter === f ? 'bg-terracotta text-white' : 'bg-card text-navy border border-line')}>
              {f}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => <div key={i} className="rounded-2xl bg-card h-64 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center"><p className="text-muted">No stories found.</p></div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(article => <ArticleCard key={article.id} article={article} />)}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
