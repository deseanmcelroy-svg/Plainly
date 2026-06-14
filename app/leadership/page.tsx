'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { GOVERNMENT_ROLE_SECTIONS } from '@/lib/leadership';
import { GovernmentLevel } from '@/lib/types';

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

export default function LeadershipPage() {
  const [menuOpen, setMenuOpen] = useState(false);
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

  const sections = GOVERNMENT_ROLE_SECTIONS.filter(
    (section) => filter === 'all' || section.level === filter
  );

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <section className="mx-auto max-w-[760px] px-[6vw] pb-9 pt-6 text-center">
        <h1 className="font-display text-[clamp(2.2rem,5.5vw,3.2rem)] font-bold leading-[1.15] tracking-tight">
          Who does <span className="text-terracotta">what?</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-lg text-muted">
          Government has a lot of different roles, and it&apos;s not always
          obvious who&apos;s responsible for what. Tap any role below for a
          plain-language explanation of what it does, how long they serve,
          and how they get elected.
        </p>
      </section>

      <div className="mx-auto max-w-[760px] px-[6vw] pb-16">
        <div className="mb-7 flex flex-wrap justify-center gap-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-3xl border-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? 'border-navy bg-navy text-cream'
                  : 'border-line bg-card text-navy hover:border-navy'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {sections.map((section) => (
          <div key={section.level} className="mb-10">
            <h2 className="mb-1.5 font-display text-xl font-bold">{section.heading}</h2>
            <p className="mb-4 text-sm text-muted">{section.description}</p>
            <div className="flex flex-col gap-[14px]">
              {section.roles.map((role) => {
                const isOpen = expanded.has(role.id);
                return (
                  <div
                    key={role.id}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => toggle(role.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(role.id);
                      }
                    }}
                    className="cursor-pointer rounded-2xl border border-line bg-card px-[26px] py-6 transition-shadow hover:border-transparent hover:shadow-[0_12px_30px_-20px_rgba(26,43,61,0.25)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-[14px]">
                        <div
                          className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl text-xl ${ICON_BG[role.level]}`}
                        >
                          {role.icon}
                        </div>
                        <div>
                          <h3 className="font-display text-[1.15rem] font-bold leading-tight">
                            {role.title}
                          </h3>
                          <div className="text-sm text-muted">{role.tag}</div>
                        </div>
                      </div>
                      <div
                        className={`flex-shrink-0 text-2xl text-muted/50 transition-transform ${
                          isOpen ? 'rotate-90 text-terracotta' : ''
                        }`}
                      >
                        ›
                      </div>
                    </div>
                    {role.currentHolder && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green/15 px-3 py-1 text-sm font-semibold text-green">
                        Currently: {role.currentHolder}
                      </div>
                    )}
                    {isOpen && (
                      <div className="mt-4 border-t border-line pt-4 text-base text-muted">
                        <div className="mb-2 font-semibold text-navy">{role.summary}</div>
                        {role.full}
                        {role.lookupUrl && (
                          <div className="mt-3">
                            <a
                              href={role.lookupUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-terracotta underline"
                            >
                              {role.currentHolder
                                ? `More about ${role.currentHolder} →`
                                : `Find out who currently holds this role on ${role.lookupLabel} →`}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-sm text-muted">
          To find out who currently holds these roles, check{' '}
          <a
            href="https://www.house.gov/representatives/find-your-representative"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta underline"
          >
            house.gov
          </a>
          ,{' '}
          <a
            href="https://www.senate.gov/senators/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracotta underline"
          >
            senate.gov
          </a>
          , or your state and local government websites.
        </p>
      </div>

      <Footer />
    </main>
  );
}
