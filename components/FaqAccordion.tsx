'use client';

import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-[14px]">
      {items.map((item, i) => {
        const isOpen = expanded.has(i);
        return (
          <div
            key={i}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            onClick={() => toggle(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle(i);
              }
            }}
            className="cursor-pointer rounded-2xl border border-line bg-card px-[26px] py-5 transition-shadow hover:border-transparent hover:shadow-[0_12px_30px_-20px_rgba(26,43,61,0.25)]"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-[1.05rem] font-bold leading-snug text-navy">
                {item.question}
              </h3>
              <div
                className={`flex-shrink-0 text-2xl text-[#c5cdd2] transition-transform ${
                  isOpen ? 'rotate-90 text-terracotta' : ''
                }`}
              >
                ›
              </div>
            </div>
            {isOpen && (
              <div className="mt-3 border-t border-line pt-3 text-base leading-relaxed text-muted">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
