'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { Candidate } from '@/lib/types';

interface StoredCandidate extends Candidate {
  raceTitle?: string;
  raceTag?: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  Twitter: 'Twitter / X',
  Facebook: 'Facebook',
  YouTube: 'YouTube',
  GooglePlus: 'Google+',
  LinkedIn: 'LinkedIn',
  Instagram: 'Instagram',
};

const CHANNEL_URLS: Record<string, (id: string) => string> = {
  Twitter: (id) => `https://twitter.com/${id}`,
  Facebook: (id) => `https://facebook.com/${id}`,
  YouTube: (id) => `https://youtube.com/${id}`,
  Instagram: (id) => `https://instagram.com/${id}`,
  LinkedIn: (id) => `https://linkedin.com/in/${id}`,
};

export default function CandidatePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [menuOpen, setMenuOpen] = useState(false);
  const [candidate, setCandidate] = useState<StoredCandidate | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`plainly-candidate-${slug}`);
      if (raw) setCandidate(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [slug]);

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">
        {!loaded && (
          <div className="py-12 text-center text-muted">Loading&hellip;</div>
        )}

        {loaded && !candidate && (
          <div className="py-12 text-center">
            <h1 className="font-display text-2xl font-bold">Candidate not found</h1>
            <p className="mx-auto mt-3 max-w-[420px] text-base text-muted">
              This page works when you arrive from a ballot race card.
              Head back to your ballot and tap a candidate to see their
              profile.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-terracotta px-5 py-3 text-base font-bold text-white"
            >
              Back to my ballot
            </Link>
          </div>
        )}

        {loaded && candidate && (
          <ProfileContent candidate={candidate} />
        )}
      </div>

      <Footer />
    </main>
  );
}

function ProfileContent({ candidate }: { candidate: StoredCandidate }) {
  const partyLower = candidate.party?.toLowerCase() ?? '';
  const partyColor = partyLower.includes('democrat')
    ? 'text-[#3b82f6]'
    : partyLower.includes('republican')
    ? 'text-[#ef4444]'
    : 'text-muted';

  return (
    <>
      {candidate.raceTag && (
        <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {candidate.raceTag}
        </div>
      )}

      <div className="flex items-center gap-5">
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-cream text-3xl font-bold text-navy">
            {candidate.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="font-display text-[clamp(1.6rem,4vw,2.2rem)] font-bold leading-tight">
            {candidate.name}
          </h1>
          {candidate.party && (
            <div className={`mt-1 text-base font-semibold ${partyColor}`}>
              {candidate.party}
            </div>
          )}
          {candidate.raceTitle && (
            <div className="mt-0.5 text-sm text-muted">
              Running for {candidate.raceTitle}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">

        {candidate.ballotpediaUrl && (
          <a
            href={candidate.ballotpediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-line bg-card px-5 py-4 transition-colors hover:border-navy"
          >
            <div>
              <div className="text-base font-bold text-navy">Ballotpedia profile</div>
              <div className="mt-0.5 text-sm text-muted">
                Nonpartisan background, voting record, and endorsements
              </div>
            </div>
            <span className="ml-4 flex-shrink-0 text-lg text-terracotta">&rarr;</span>
          </a>
        )}

        {candidate.infoUrl && (
          <a
            href={candidate.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-line bg-card px-5 py-4 transition-colors hover:border-navy"
          >
            <div>
              <div className="text-base font-bold text-navy">Official campaign website</div>
              <div className="mt-0.5 text-sm text-muted">
                Positions, priorities, and contact info direct from the candidate
              </div>
            </div>
            <span className="ml-4 flex-shrink-0 text-lg text-terracotta">&rarr;</span>
          </a>
        )}

        {candidate.channels && candidate.channels.length > 0 && (
          <div className="rounded-2xl border border-line bg-card px-5 py-4">
            <div className="mb-3 text-base font-bold text-navy">Social media</div>
            <div className="flex flex-col gap-2">
              {candidate.channels.map((ch) => {
                const getUrl = CHANNEL_URLS[ch.type];
                const label = CHANNEL_LABELS[ch.type] ?? ch.type;
                if (!getUrl) return null;
                return (
                  <a
                    key={ch.type}
                    href={getUrl(ch.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm hover:text-navy hover:underline"
                  >
                    <span className="text-navy">{label}</span>
                    <span className="text-xs text-muted">@{ch.id} &rarr;</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          Plainly links to nonpartisan and official sources only. We
          don&apos;t endorse any candidate &mdash; the information above
          comes from Ballotpedia and the candidate&apos;s own published
          materials, not from Plainly.
        </div>
      </div>

      <Link href="/#races" className="mt-8 inline-block text-sm text-terracotta underline">
        &larr; Back to my ballot
      </Link>
    </>
  );
}
