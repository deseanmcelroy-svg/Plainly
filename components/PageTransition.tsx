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
    }, FADE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
