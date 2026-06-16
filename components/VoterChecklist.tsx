'use client';

import { useState } from 'react';
import Link from 'next/link';

const ITEMS = [
  {
    id: 'registered',
    label: 'Am I registered to vote?',
    sub: "Make sure you're signed up at your current address",
    href: '/checklist/registration',
  },
  {
    id: 'polling-place',
    label: 'Where do I vote?',
    sub: 'Polling places can change — confirm yours',
    href: '/checklist/polling-location',
  },
  {
    id: 'id',
    label: 'What ID do I need?',
    sub: 'Requirements vary by state',
    href: '/checklist/voter-id',
  },
  {
    id: 'method',
    label: 'How will I vote?',
    sub: 'By mail, early, or on Election Day — pick what works',
    href: '/checklist/how-to-vote',
  },
];

export default function VoterChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section id="vote" className="mx-auto max-w-[1000px] px-[6vw] py-12">
      <div className="rounded-[20px] bg-[#1A2B3D] px-7 py-11 text-center text-white sm:px-11">
        <h2 className="mb-2.5 font-display text-3xl font-bold">Ready to vote? Check these off.</h2>
        <p className="mx-auto mb-7 max-w-[480px] text-white/70">
          Most people who don&apos;t vote don&apos;t skip it on purpose — they just run out of time
          to handle the logistics. Let&apos;s knock these out now.
        </p>
        <div className="mx-auto mb-7 grid max-w-[560px] gap-[14px] text-left sm:grid-cols-2">
          {ITEMS.map((item) => {
            const content = (
              <>
                <input
                  type="checkbox"
                  id={item.id}
                  checked={checked.has(item.id)}
                  onChange={() => toggle(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 h-5 w-5 flex-shrink-0 accent-green"
                />
                <span>
                  <span className="block text-base font-semibold">{item.label}</span>
                  <span className="mt-1 block text-sm text-white/60">{item.sub}</span>
                </span>
                {item.href && (
                  <span className="ml-auto self-center text-lg text-white/40">›</span>
                )}
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-[14px] rounded-xl bg-white/[0.06] px-5 py-[18px] transition-colors hover:bg-white/[0.12]"
                >
                  {content}
                </Link>
              );
            }

            return (
              <label
                key={item.id}
                htmlFor={item.id}
                className="flex cursor-pointer items-start gap-[14px] rounded-xl bg-white/[0.06] px-5 py-[18px] transition-colors hover:bg-white/[0.12]"
              >
                {content}
              </label>
            );
          })}
        </div>
        <a
          href="https://vote.gov/register"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-[14px] bg-terracotta px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#d96b48]"
        >
          Check my registration
        </a>
      </div>
    </section>
  );
}
