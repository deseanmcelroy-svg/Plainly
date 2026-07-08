'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SlideMenu from '@/components/SlideMenu';

interface Member {
  id: string;
  name: string;
  party: string;
  chamber: string;
  state: string;
  district?: string;
  depiction: string | null;
  nextElection: string | null;
}

const PARTY_COLORS: Record<string, { bg: string; text: string }> = {
  Republican: { bg: 'rgba(239,68,68,0.2)', text: '#FCA5A5' },
  Democrat: { bg: 'rgba(59,130,246,0.2)', text: '#93C5FD' },
  Democratic: { bg: 'rgba(59,130,246,0.2)', text: '#93C5FD' },
  Independent: { bg: 'rgba(147,51,234,0.2)', text: '#C4B5FD' },
};

function getInitials(name: string): string {
  return name.split(',').reverse().join(' ').trim().split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getReelectionText(year: string | null): { text: string; soon: boolean } {
  if (!year) return { text: 'Reelection date unknown', soon: false };
  const y = parseInt(year);
  const soon = y <= 2026;
  return {
    text: soon
      ? `Up for reelection in Nov ${y} — on your ballot this cycle`
      : `Up for reelection in Nov ${y}`,
    soon,
  };
}

export default function GovernmentPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let loc = '';
    try { loc = localStorage.getItem('plainly-location') || ''; } catch {}
    setLocation(loc);
    fetch('/api/congress?type=members&location=' + encodeURIComponent(loc))
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setMembers(d.members || []);
      })
      .catch(() => setError('Could not load representatives.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-page">
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />

      <div className="mx-auto max-w-2xl px-[6vw] pb-16">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-navy">Grade your government</h1>
          <p className="mt-1 text-sm text-muted">
            {location ? `How your representatives have voted · ${location}` : 'How your federal representatives have voted'}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl bg-card" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-card p-8 text-center">
            <p className="text-muted">{error}</p>
            <p className="mt-2 text-xs text-muted">Enter your ZIP on the home page to see your representatives.</p>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center">
            <p className="text-muted">No representatives found.</p>
            <p className="mt-2 text-xs text-muted">Enter your ZIP on the home page to see your representatives.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {members.map(member => {
              const partyColor = PARTY_COLORS[member.party] || { bg: 'rgba(100,100,100,0.2)', text: '#ccc' };
              const reelection = getReelectionText(member.nextElection);
              const chamber = member.chamber.includes('Senate') ? 'U.S. Senator' : 'U.S. Representative';
              const role = member.district
                ? `${chamber} · District ${member.district}`
                : `${chamber} · ${member.state}`;

              return (
                <div key={member.id} className="overflow-hidden rounded-2xl border border-line bg-card">
                  <div className="flex items-center gap-3 bg-navy p-4">
                    {member.depiction ? (
                      <img src={member.depiction} alt={member.name} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green text-base font-bold text-cream">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-cream truncate">{member.name.split(',').reverse().join(' ').trim()}</p>
                      <p className="text-xs text-cream/60 mt-0.5">{role}</p>
                    </div>
                    <span className="rounded-full px-2 py-1 text-xs font-bold flex-shrink-0"
                      style={{ background: partyColor.bg, color: partyColor.text }}>
                      {member.party}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-b border-line px-4 py-2">
                    <span className="text-sm">🗓️</span>
                    <span className={'text-xs font-semibold ' + (reelection.soon ? 'text-terracotta' : 'text-green')}>
                      {reelection.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
                    <button
                      onClick={() => router.push('/government/' + member.id + '?type=bills&name=' + encodeURIComponent(member.name))}
                      className="py-3 text-center hover:bg-line/20 transition-colors"
                    >
                      <p className="text-lg font-bold text-terracotta underline decoration-dotted">Bills</p>
                      <p className="text-xs text-muted">sponsored</p>
                      <p className="text-xs text-terracotta font-semibold mt-0.5">Tap to view all</p>
                    </button>
                    <button
                      onClick={() => router.push('/government/' + member.id + '?type=votes&name=' + encodeURIComponent(member.name))}
                      className="py-3 text-center hover:bg-line/20 transition-colors"
                    >
                      <p className="text-lg font-bold text-terracotta underline decoration-dotted">Votes</p>
                      <p className="text-xs text-muted">cast this term</p>
                      <p className="text-xs text-terracotta font-semibold mt-0.5">Tap to view all</p>
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Recent votes</p>
                    <RecentVotes memberId={member.id} memberName={member.name} location={location} />
                  </div>

                  <p className="pb-3 text-center text-xs text-muted">Source: Congress.gov API</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

function RecentVotes({ memberId, memberName, location }: { memberId: string; memberName: string; location: string }) {
  const router = useRouter();
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/congress?type=votes&memberId=' + memberId)
      .then(r => r.json())
      .then(d => setVotes((d.votes || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-line/20" />;
  if (votes.length === 0) return <p className="text-sm text-muted">No recent votes found.</p>;

  return (
    <div className="flex flex-col gap-2">
      {votes.map((vote, i) => (
        <div
          key={i}
          className="cursor-pointer rounded-xl border border-line bg-page p-3 transition-colors hover:border-terracotta"
          onClick={() => router.push('/government/detail?title=' + encodeURIComponent(vote.bill) + '&vote=' + encodeURIComponent(vote.position) + '&member=' + encodeURIComponent(memberName) + '&location=' + encodeURIComponent(location) + '&type=vote&desc=' + encodeURIComponent(vote.description))}
        >
          <div className="mb-1 flex items-start gap-2">
            <span className={'rounded-full px-2 py-0.5 text-xs font-bold flex-shrink-0 ' + (vote.position === 'Yes' ? 'bg-green/10 text-green' : vote.position === 'No' ? 'bg-terracotta/10 text-terracotta' : 'bg-line text-muted')}>
              {vote.position?.toUpperCase() || 'N/A'}
            </span>
            <p className="text-sm font-semibold leading-snug text-navy">{vote.bill}</p>
          </div>
          {vote.date && <p className="text-xs text-muted">{vote.date}</p>}
          <p className="mt-1 text-xs font-semibold text-terracotta">What this means for you →</p>
        </div>
      ))}
    </div>
  );
}
