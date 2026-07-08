'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

function ListContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const type = searchParams.get('type') || 'votes';
  const memberName = searchParams.get('name') || 'Your representative';
  const displayName = memberName.split(',').reverse().join(' ').trim();

  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [location, setLocation] = useState('');

  useEffect(() => {
    try { setLocation(localStorage.getItem('plainly-location') || ''); } catch {}
    fetch('/api/congress?type=' + type + '&memberId=' + memberId)
      .then(r => r.json())
      .then(d => setItems(type === 'votes' ? (d.votes || []) : (d.bills || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId, type]);

  const filtered = type === 'votes' && filter !== 'all'
    ? items.filter(v => v.position?.toLowerCase() === filter)
    : items;

  const title = type === 'votes' ? 'Votes cast by ' + displayName : 'Bills sponsored by ' + displayName;

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-2xl pb-16">
        <div className="px-[6vw] mb-4">
          <button onClick={() => router.back()} className="text-sm text-muted">← Back</button>
        </div>

        <div className="px-[6vw] mb-4">
          <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 text-sm text-muted">{filtered.length} {type === 'votes' ? 'votes' : 'bills'} found</p>
        </div>

        {type === 'votes' && (
          <div className="flex gap-2 px-[6vw] mb-4 flex-wrap">
            {['all', 'yes', 'no'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={'rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ' + (filter === f ? 'bg-terracotta text-white' : 'bg-card text-navy border border-line')}>
                {f === 'all' ? 'All votes' : f === 'yes' ? 'YES votes' : 'NO votes'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3 px-[6vw]">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-[6vw]">
            {filtered.map((item, i) => (
              <div
                key={i}
                className="cursor-pointer rounded-2xl border border-line bg-card p-4 transition-colors hover:border-terracotta"
                onClick={() => {
                  const title = type === 'votes' ? item.bill : item.title;
                  const desc = type === 'votes' ? item.description : item.latestAction;
                  const vote = type === 'votes' ? item.position : null;
                  router.push('/government/detail?title=' + encodeURIComponent(title) + '&member=' + encodeURIComponent(memberName) + '&location=' + encodeURIComponent(location) + '&type=' + (type === 'votes' ? 'vote' : 'bill') + (desc ? '&desc=' + encodeURIComponent(desc) : '') + (vote ? '&vote=' + encodeURIComponent(vote) : ''));
                }}
              >
                {type === 'votes' ? (
                  <>
                    <div className="mb-2 flex items-start gap-2">
                      <span className={'rounded-full px-2 py-0.5 text-xs font-bold flex-shrink-0 ' + (item.position === 'Yes' ? 'bg-green/10 text-green' : item.position === 'No' ? 'bg-terracotta/10 text-terracotta' : 'bg-line text-muted')}>
                        {item.position?.toUpperCase() || 'N/A'}
                      </span>
                      <p className="text-sm font-semibold leading-snug text-navy">{item.bill}</p>
                    </div>
                    {item.date && <p className="text-xs text-muted mb-1">{item.date}</p>}
                    {item.result && <p className="text-xs text-muted mb-2">Final result: {item.result}</p>}
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex items-start gap-2">
                      {item.number && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600 flex-shrink-0">
                          {item.number}
                        </span>
                      )}
                      <p className="text-sm font-semibold leading-snug text-navy">{item.title}</p>
                    </div>
                    {item.introducedDate && <p className="text-xs text-muted mb-1">Introduced: {item.introducedDate}</p>}
                    {item.latestAction && <p className="text-xs text-muted mb-2">{item.latestAction}</p>}
                    {item.policyArea && (
                      <span className="rounded-full bg-page px-2 py-0.5 text-xs font-semibold text-green">
                        {item.policyArea}
                      </span>
                    )}
                  </>
                )}
                <p className="mt-2 text-xs font-semibold text-terracotta">What this means for you →</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function MemberListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <ListContent />
    </Suspense>
  );
}
