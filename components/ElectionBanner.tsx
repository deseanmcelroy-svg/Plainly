'use client';

import { useEffect, useState } from 'react';

// November 3, 2026 — U.S. midterm Election Day
const ELECTION_DATE = new Date('2026-11-03T00:00:00');

function getCountdown() {
  const now = new Date();
  const diff = ELECTION_DATE.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
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

    const interval = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem('plainly-banner-dismissed', '1'); } catch {}
  }

  if (dismissed || !countdown) return null;

  const isUrgent = countdown.days <= 7;
  const isVeryUrgent = countdown.days <= 1;

  return (
    <div
      style={{
        backgroundColor: isVeryUrgent ? '#1A2B3D' : isUrgent ? '#D9663E' : '#1A2B3D',
        color: '#F7F4ED',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontSize: '0.8rem',
        fontWeight: 600,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background-color 0.5s ease',
      }}
    >
      <span style={{ fontSize: '1rem' }}>
        {isVeryUrgent ? '🚨' : '🗺️'}
      </span>

      <span style={{ opacity: 0.75, fontWeight: 400 }}>
        {isVeryUrgent ? 'Election Day is TOMORROW' : 'Election Day — Nov 3, 2026'}
      </span>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <TimeUnit value={countdown.days} label="days" />
        <Colon />
        <TimeUnit value={countdown.hours} label="hrs" />
        <Colon />
        <TimeUnit value={countdown.minutes} label="min" />
        <Colon />
        <TimeUnit value={countdown.seconds} label="sec" />
      </div>

      <a
        href="/#vote"
        style={{
          backgroundColor: 'rgba(247,244,237,0.15)',
          color: '#F7F4ED',
          borderRadius: '999px',
          padding: '0.2rem 0.75rem',
          fontSize: '0.75rem',
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
          background: 'none',
          border: 'none',
          color: 'rgba(247,244,237,0.5)',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          padding: '0 0.25rem',
          marginLeft: '0.25rem',
        }}
      >
        &times;
      </button>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '2.5rem' }}>
      <div style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: 400, letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

function Colon() {
  return (
    <span style={{ fontSize: '1rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.5rem' }}>
      :
    </span>
  );
}
