'use client';

import { useState, FormEvent } from 'react';

interface HeroProps {
  onSearch: (location: string) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <section className="mx-auto max-w-[760px] px-[6vw] pb-12 pt-14 text-center">
      <h1 className="font-display text-[clamp(2.4rem,6vw,3.6rem)] font-bold leading-[1.15] tracking-tight">
        <span className="text-green">Politics,</span> <span className="text-[#D9663E]">explained plainly.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-[520px] text-lg text-muted">
        Tell us where you live. We&apos;ll show you exactly what&apos;s on your ballot — and explain
        it like a friend would, not a textbook.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto mt-9 flex max-w-[460px] flex-col gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your city, address, or ZIP code"
          aria-label="Enter your city, address, or ZIP code"
          className="w-full rounded-2xl border-2 border-navy bg-card px-5 py-[18px] text-center text-lg text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-2xl bg-terracotta px-5 py-[18px] text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b04f30]"
        >
          Show me my ballot
        </button>
      </form>
      <div className="mt-2.5 text-sm text-muted">No sign-up needed. Just your location.</div>
    </section>
  );
}
