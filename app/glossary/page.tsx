'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { GLOSSARY, getAllTerms } from '@/lib/glossary';

const CATEGORY_ICONS: Record<string, string> = {
  'voting-process': 'Voting process',
  'ballot-measures': 'Ballot measures',
  'government-roles': 'Government roles',
  'election-admin': 'Election admin',
  'civic-terms': 'Civic terms',
};

export default function GlossaryPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allTerms = useMemo(() => getAllTerms(), []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q) {
      return allTerms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          t.example.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      const cat = GLOSSARY.find((c) => c.id === activeCategory);
      return cat ? cat.terms.map((t) => ({ ...t, categoryId: cat.id, categoryLabel: cat.label })) : [];
    }
    return allTerms;
  }, [query, activeCategory, allTerms]);

  const isSearching = query.trim().length > 0;

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">
        <h1 className="font-display text-[clamp(2rem,5vw,2.6rem)] font-bold leading-tight">
          Civic glossary
        </h1>
        <p className="mt-3 text-lg text-muted">
          Plain-language definitions for the terms you will see on your ballot
          and in the news, with real-world examples for each.
        </p>

        <div className="relative mt-6">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) setActiveCategory(null);
            }}
            placeholder="Search terms, e.g. levy, recount, precinct..."
            aria-label="Search glossary terms"
            className="w-full rounded-xl border-2 border-navy bg-card py-3 pl-5 pr-4 text-base text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
          />
        </div>

        {!isSearching && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                !activeCategory ? 'border-navy bg-navy text-cream' : 'border-line text-navy hover:border-navy'
              }`}
            >
              All terms
            </button>
            {GLOSSARY.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === cat.id ? 'border-navy bg-navy text-cream' : 'border-line text-navy hover:border-navy'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <p className="mt-4 text-sm text-muted">
            {results.length === 0 ? 'No terms match that search.' : `${results.length} term${results.length === 1 ? '' : 's'} found`}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {isSearching || activeCategory ? (
            results.map((t) => (
              <TermCard
                key={t.term}
                term={t.term}
                definition={t.definition}
                example={t.example}
                categoryLabel={isSearching ? t.categoryLabel : undefined}
              />
            ))
          ) : (
            GLOSSARY.map((cat) => (
              <div key={cat.id}>
                <div className="mb-3 mt-6 flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold">{cat.label}</h2>
                  <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
                    {cat.terms.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {cat.terms.map((t) => (
                    <TermCard key={t.term} term={t.term} definition={t.definition} example={t.example} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-10 text-center text-sm text-muted">
          {allTerms.length} terms across {GLOSSARY.length} categories. Spotted a term we missed? Let us know.
        </p>
      </div>

      <Footer />
    </main>
  );
}

function TermCard({
  term,
  definition,
  example,
  categoryLabel,
}: {
  term: string;
  definition: string;
  example: string;
  categoryLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div
        className="flex cursor-pointer items-start justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          {categoryLabel && (
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {categoryLabel}
            </div>
          )}
          <div className="font-display text-lg font-bold text-navy">{term}</div>
          {!expanded && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{definition}</p>
          )}
        </div>
        <span className="mt-1 flex-shrink-0 text-sm text-terracotta">
          {expanded ? '\u25B2' : '\u25BC'}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-base leading-relaxed text-navy/90">{definition}</p>
          <div className="mt-3 rounded-xl bg-cream p-4">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
              Real-world example
            </div>
            <p className="text-sm leading-relaxed text-navy/80">{example}</p>
          </div>
        </div>
      )}
    </div>
  );
}
