'use client';

import { useState } from 'react';
import { BallotItem, GovernmentLevel } from '@/lib/types';

interface RaceListProps {
  items: BallotItem[];
}

type Filter = 'all' | GovernmentLevel;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'local', label: 'My community' },
  { key: 'state', label: 'My state' },
  { key: 'federal', label: 'National' },
];

const ICON_BG: Record<GovernmentLevel, string> = {
  local: 'bg-green/15',
  state: 'bg-terracotta/15',
  federal: 'bg-[#7d6fb3]/15',
};

export default function RaceList({ items }: RaceListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const visible = items.filter((item) => filter === 'all' || item.level === filter);

  return (
    <section id="races" className="mx-auto max-w-[1000px] px-[6vw] py-12">
      <div className="mb-9 text-center">
        <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold tracking-tight">
          What you&apos;ll see on Election Day
        </h2>
        <p className="mx-auto max-w-[480px] text-base text-muted">
          Tap any card to learn who&apos;s running and what it means for you.
        </p>
      </div>

      <div className="mb-7 flex flex-wrap justify-center gap-2.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-3xl border-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
              filter === f.key
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-white text-navy hover:border-navy'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[14px]">
        {visible.map((item) => {
          const isOpen = expanded.has(item.id);
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => toggle(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(item.id);
                }
              }}
              className="cursor-pointer rounded-2xl border border-line bg-card px-[26px] py-6 transition-shadow hover:border-transparent hover:shadow-[0_12px_30px_-20px_rgba(26,43,61,0.25)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-[14px]">
                  <div
                    className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl text-xl ${ICON_BG[item.level]}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-[1.15rem] font-bold leading-tight">
                      {item.title}
                    </h3>
                    <div className="text-sm text-muted">{item.tag}</div>
                  </div>
                </div>
                <div
                  className={`flex-shrink-0 text-2xl text-[#c5cdd2] transition-transform ${
                    isOpen ? 'rotate-90 text-terracotta' : ''
                  }`}
                >
                  ›
                </div>
              </div>
              {isOpen && (
                <div className="mt-4 border-t border-line pt-4 text-base text-muted">
                  <div className="mb-2 font-semibold text-navy">{item.summary}</div>
                  {item.full}
                  {item.candidates && item.candidates.length > 0 && (
                    <div className="mt-3 text-sm">
                      <span className="font-semibold text-navy">Candidates: </span>
                      {item.candidates.map((c) => c.name).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
