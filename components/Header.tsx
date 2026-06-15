'use client';

import Link from 'next/link';
import LogoMark from '@/components/LogoMark';

interface HeaderProps {
  onMenuOpen: () => void;
  menuOpen: boolean;
}

export default function Header({ onMenuOpen, menuOpen }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-[6vw] py-6">
      <Link href="/" className="flex items-center gap-2.5 font-sans text-xl font-light tracking-wide">
        <LogoMark />
        Plainly
      </Link>
      <button
        onClick={onMenuOpen}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        className="flex h-[46px] w-[46px] flex-col items-center justify-center gap-[5px] rounded-xl border-2 border-navy bg-card transition-colors hover:bg-navy [&:hover_span]:bg-cream"
      >
        <span className="block h-[2px] w-5 rounded-full bg-navy transition-colors" />
        <span className="block h-[2px] w-5 rounded-full bg-navy transition-colors" />
        <span className="block h-[2px] w-5 rounded-full bg-navy transition-colors" />
      </button>
    </header>
  );
}
