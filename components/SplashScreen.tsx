'use client';

import { useEffect, useState } from 'react';
import LogoMark from '@/components/LogoMark';

export default function SplashScreen() {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'done'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 1400);
    const t3 = setTimeout(() => setPhase('done'), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === 'done') return null;

  const opacity = phase === 'in' ? 0 : phase === 'out' ? 0 : 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#F7F4ED',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        opacity,
        transition: phase === 'in' ? 'opacity 0.4s ease' : phase === 'out' ? 'opacity 0.5s ease' : 'none',
        pointerEvents: 'none',
      }}
    >
      <div style={{ transform: 'scale(2.5)', marginBottom: '0.5rem' }}>
        <LogoMark />
      </div>
      <div style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize: '1.8rem',
        fontWeight: 700,
        color: '#1A2B3D',
        letterSpacing: '0.01em',
      }}>
        Plainly
      </div>
      <div style={{
        fontFamily: 'var(--font-inter), sans-serif',
        fontSize: '0.85rem',
        fontWeight: 400,
        color: '#5B8C7B',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Politics explained, plainly.
      </div>
    </div>
  );
}
