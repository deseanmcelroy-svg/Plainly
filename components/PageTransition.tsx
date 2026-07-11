'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<'in' | 'out'>('in');

  useEffect(() => {
    setStage('out');
    const t = setTimeout(() => {
      setDisplayChildren(children);
      setStage('in');
    }, 140);
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
        transition: 'opacity 0.25s ease',
      }}
    >
      {displayChildren}
    </div>
  );
}
