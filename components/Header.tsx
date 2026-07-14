'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoMark from '@/components/LogoMark';

interface HeaderProps {
  onMenuOpen: () => void;
  menuOpen: boolean;
}

export default function Header({ onMenuOpen, menuOpen }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header
      className="flex items-center justify-between px-[6vw] py-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        backgroundColor: isHome ? '#1A2B3D' : 'transparent',
      }}
    >
      <Link
        href="/"
        className={`flex items-center gap-2.5 font-sans text-xl font-light tracking-wide ${isHome ? 'text-cream' : ''}`}
      >
        <LogoMark />
        Plainly
      </Link>
      <button
        onClick={onMenuOpen}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        className={
          isHome
            ? 'flex h-[46px] w-[46px] flex-col items-center justify-center gap-[5px] rounded-xl border-2 border-cream/40 bg-transparent transition-colors hover:bg-cream/10 [&:hover_span]:bg-cream'
            : 'flex h-[46px] w-[46px] flex-col items-center justify-center gap-[5px] rounded-xl border-2 border-navy bg-card transition-colors hover:bg-navy [&:hover_span]:bg-cream'
        }
      >
        <span className={`block h-[2px] w-5 rounded-full transition-colors ${isHome ? 'bg-cream' : 'bg-navy'}`} />
        <span className={`block h-[2px] w-5 rounded-full transition-colors ${isHome ? 'bg-cream' : 'bg-navy'}`} />
        <span className={`block h-[2px] w-5 rounded-full transition-colors ${isHome ? 'bg-cream' : 'bg-navy'}`} />
      </button>
    </header>
  );
}
