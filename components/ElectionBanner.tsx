'use client';

import { useEffect, useState } from 'react';

const ELECTION_DATE = new Date('2026-11-03T00:00:00');

function getCountdown() {
  const now = new Date();
  const diff = ELECTION_DATE.getTime() - now.getTime();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export default function ElectionBanner() {
  const [countdown, setCountdown] = useState(getCountdown());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('plainly-banner-dismissed')) {
        setDismissed(true);
        return;
      }
    } catch {}
    const interval = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(interval);
  }, []);

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem('plainly-banner-dismissed', '1'); } catch {}
  }

  if (dismissed || !countdown) return null;

  const isUrgent = countdown.days <= 7;
  const isVeryUrgent = countdown.days <= 1;
  const bg = isVeryUrgent ? '#1A2B3D' : isUrgent ? '#D9663E' : '#1A2B3D';

  return (
    <>
      <style>{`
        .eb-label { display: inline; }
        .eb-units { display: flex; }
        .eb-cta { display: inline-block; }
        .eb-unit-hrs, .eb-unit-min, .eb-unit-sec,
        .eb-colon-h, .eb-colon-m, .eb-colon-s { display: flex; }
        @media (max-width: 480px) {
          .eb-label { display: none; }
          .eb-cta { display: none; }
          .eb-unit-hrs, .eb-unit-min, .eb-unit-sec,
          .eb-colon-h, .eb-colon-m, .eb-colon-s { display: none; }
        }
      `}</style>
      <div style={{
        backgroundColor: bg,
        color: '#F7F4ED',
        padding: '0.4rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background-color 0.5s ease',
      }}>
        <span style={{ fontSize: '0.95rem' }}>
          {isVeryUrgent ? '🚨' : '🗺️'}
        </span>

        <span className="eb-label" style={{ opacity: 0.75, fontWeight: 400, whiteSpace: 'nowrap' }}>
          {isVeryUrgent ? 'Election Day is TOMORROW' : 'Election Day — Nov 3, 2026'}
        </span>

        <div className="eb-units" style={{ gap: '0.4rem', alignItems: 'center' }}>
          <TimeUnit value={countdown.days} label="days" />
          <span className="eb-colon-h" style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.4rem' }}>:</span>
          <span className="eb-unit-hrs"><TimeUnit value={countdown.hours} label="hrs" /></span>
          <span className="eb-colon-m" style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.4rem' }}>:</span>
          <span className="eb-unit-min"><TimeUnit value={countdown.minutes} label="min" /></span>
          <span className="eb-colon-s" style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.4rem' }}>:</span>
          <span className="eb-unit-sec"><TimeUnit value={countdown.seconds} label="sec" /></span>
        </div>

        <a
          href="/#vote"
          className="eb-cta"
          style={{
            backgroundColor: 'rgba(247,244,237,0.15)',
            color: '#F7F4ED',
            borderRadius: '999px',
            padding: '0.18rem 0.65rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Get ready
        </a>

        <button
          onClick={dismiss}
          aria-label="Dismiss banner"
          style={{
            background: 'none', border: 'none',
            color: 'rgba(247,244,237,0.5)',
            cursor: 'pointer', fontSize: '1rem',
            lineHeight: 1, padding: '0 0.2rem',
          }}
        >
          &times;
        </button>
      </div>
    </>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '2rem' }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: 400, letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}
