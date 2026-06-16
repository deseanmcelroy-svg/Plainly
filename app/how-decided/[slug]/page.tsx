'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { getHowDecidedContent } from '@/lib/howDecided';
import { useState } from 'react';

export default function HowDecidedPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : 'generic';
  const [menuOpen, setMenuOpen] = useState(false);
  const content = getHowDecidedContent(slug);

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">
        <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          How it gets decided
        </div>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{content.icon}</span>
          <h1 className="font-display text-[clamp(1.8rem,4.5vw,2.4rem)] font-bold leading-tight">
            {content.raceLabel}
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-5">

          <Section title="How the winner is determined" icon="🏆">
            <p className="text-base leading-relaxed text-navy/90">
              {content.howWinnerIsDecided}
            </p>
          </Section>

          <Section title="Who officially decides" icon="✅">
            <p className="text-base leading-relaxed text-navy/90">
              {content.whoDecides}
            </p>
          </Section>

          <Section title="What happens after Election Day" icon="📅">
            <ol className="flex flex-col gap-3">
              {content.afterElectionDay.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-cream">
                    {i + 1}
                  </span>
                  <span className="text-base leading-relaxed text-navy/90">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="When is it final?" icon="🔒">
            <p className="text-base leading-relaxed text-navy/90">
              {content.whenItsFinal}
            </p>
          </Section>

          {content.edgeCases.length > 0 && (
            <Section title="Edge cases — ties, recounts, and what-ifs" icon="⚖️">
              <ul className="flex flex-col gap-3">
                {content.edgeCases.map((edge, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta" />
                    <span className="text-base leading-relaxed text-navy/90">{edge}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

        </div>

        <Link href="/#races" className="mt-8 inline-block text-sm text-terracotta underline">
          &larr; Back to my ballot
        </Link>
      </div>

      <Footer />
    </main>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>
        <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}
