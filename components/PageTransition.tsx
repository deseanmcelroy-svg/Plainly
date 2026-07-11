'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<'in' | 'out'>('in');

  const FADE_MS = 400;

  useEffect(() => {
    setStage('out');
    const t = setTimeout(() => {
      setDisplayChildren(children);
      setStage('in');
    }, FADE_MS); // matches the CSS transition duration below exactly, so the
    // swap only happens once the old content has FULLY faded to 0 — this is
    // what was causing the flash: the swap was firing before the fade-out
    // finished, so new content appeared while the old one was still
    // mid-transition instead of fully invisible.
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Keep content in sync if it changes without a route change (e.g. same-page state updates)
  useEffect(() => {
    if (stage === 'in') setDisplayChildren(children);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div
      style={{
        opacity: stage === 'in' ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      {displayChildren}
    </div>
  );
}
