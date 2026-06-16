'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState<'drawing' | 'text' | 'fading' | 'done'>('drawing');
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('plainly-splash-shown')) return;
      sessionStorage.setItem('plainly-splash-shown', '1');
    } catch {}

    // Hide the app content behind the splash on first load
    document.documentElement.style.setProperty('--app-opacity', '0');
    setShow(true);

    const t1 = setTimeout(() => setPhase('text'), 900);
    const t2 = setTimeout(() => {
      setPhase('fading');
      // Fade the app in as the splash fades out
      document.documentElement.style.setProperty('--app-opacity', '1');
    }, 1800);
    const t3 = setTimeout(() => {
      setPhase('done');
      setShow(false);
      document.documentElement.style.removeProperty('--app-opacity');
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!show || phase === 'done') return null;

  return (
    <>
      <style>{`
        body > *:not([aria-hidden]) {
          opacity: var(--app-opacity, 1);
          transition: opacity 0.6s ease;
        }
        @keyframes drawStroke {
          to { stroke-dashoffset: 0; }
        }
        .splash-loop {
          stroke-dasharray: 700;
          stroke-dashoffset: 700;
          animation: drawStroke 0.55s ease forwards 0.05s;
        }
        .splash-ellipse {
          stroke-dasharray: 340;
          stroke-dashoffset: 340;
          animation: drawStroke 0.3s ease forwards 0.5s;
        }
        .splash-stem {
          stroke-dasharray: 280;
          stroke-dashoffset: 280;
          animation: drawStroke 0.25s ease forwards 0.72s;
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#D9663E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          opacity: phase === 'fading' ? 0 : 1,
          transition: phase === 'fading' ? 'opacity 0.6s ease' : 'none',
          pointerEvents: 'none',
        }}
      >
        <svg width="140" height="140" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <rect width="512" height="512" rx="96" fill="rgba(0,0,0,0.12)" />
          <path
            className="splash-loop"
            d="M 170 165 C 170 120, 210 90, 262 92 C 330 95, 378 145, 378 205 C 378 268, 328 312, 262 308 C 222 306, 192 290, 175 268"
            fill="none"
            stroke="#F7F4ED"
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <ellipse
            className="splash-ellipse"
            cx="250"
            cy="222"
            rx="52"
            ry="24"
            fill="none"
            stroke="#F7F4ED"
            strokeWidth="24"
          />
          <path
            className="splash-stem"
            d="M 198 222 L 198 380 C 198 408, 180 423, 155 425 C 144 426, 134 424, 128 421"
            fill="none"
            stroke="#F7F4ED"
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize: '2.4rem',
            fontWeight: 300,
            letterSpacing: '0.12em',
            color: '#F7F4ED',
            opacity: phase === 'text' || phase === 'fading' ? 1 : 0,
            transform: phase === 'text' || phase === 'fading' ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          Plainly
        </div>

        <div
          style={{
            fontSize: '0.85rem',
            color: 'rgba(247,244,237,0.7)',
            letterSpacing: '0.06em',
            opacity: phase === 'text' || phase === 'fading' ? 1 : 0,
            transition: 'opacity 0.5s ease 0.15s',
          }}
        >
          Politics, explained plainly.
        </div>
      </div>
    </>
  );
}
