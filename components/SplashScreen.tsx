'use client';

import { useEffect, useState } from 'react';
import LogoMark from '@/components/LogoMark';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 800);
    const hideTimer = setTimeout(() => setVisible(false), 1200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

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
        gap: '1rem',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
      }}
    >
      <div style={{ transform: 'scale(1.5)' }}>
        <LogoMark />
      </div>
      <div style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontSize: '1.4rem',
        fontWeight: 700,
        color: '#1A2B3D',
        letterSpacing: '0.01em',
      }}>
        Plainly
      </div>
    </div>
  );
}
