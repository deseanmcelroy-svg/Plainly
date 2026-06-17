'use client';

import { useState } from 'react';

const RATE_KEY = 'plainly-rate-done';
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61590464626733';

interface RatePromptProps {
  onDismiss: () => void;
}

export default function RatePrompt({ onDismiss }: RatePromptProps) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  function dismiss() {
    try { localStorage.setItem(RATE_KEY, '1'); } catch {}
    onDismiss();
  }

  function handleStars(n: number) {
    setStars(n);
    setSubmitted(true);
    try { localStorage.setItem(RATE_KEY, '1'); } catch {}
  }

  const isPositive = stars >= 4;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(26,43,61,0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div style={{
        width: '100%', maxWidth: '400px',
        backgroundColor: '#F7F4ED',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ backgroundColor: '#1A2B3D', padding: '2rem 2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            {submitted ? (isPositive ? '🎉' : '💬') : '⭐'}
          </div>
          <div style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#F7F4ED' }}>
            {submitted
              ? isPositive ? 'Thank you!' : 'Thanks for the feedback'
              : 'Enjoying Plainly?'}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem 2rem 2rem', textAlign: 'center' }}>
          {!submitted ? (
            <>
              <p style={{ fontSize: '0.9rem', color: '#5D6B78', marginBottom: '1.5rem' }}>
                You just finished your practice ballot. How are we doing?
              </p>

              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => handleStars(n)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '2.25rem', lineHeight: 1,
                      opacity: n <= (hovered || stars) ? 1 : 0.25,
                      transform: n <= (hovered || stars) ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      color: '#D9663E',
                    }}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <button
                onClick={dismiss}
                style={{ background: 'none', border: 'none', color: '#9AA9B6', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Maybe later
              </button>
            </>
          ) : isPositive ? (
            <>
              <p style={{ fontSize: '0.9rem', color: '#5D6B78', marginBottom: '1.5rem' }}>
                We&apos;re glad you&apos;re finding it useful. Would you mind sharing your experience on our Facebook page? It really helps us reach more voters.
              </p>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                style={{
                  display: 'block', width: '100%',
                  padding: '0.8rem',
                  backgroundColor: '#1877F2',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  borderRadius: '12px', textDecoration: 'none',
                  marginBottom: '0.75rem',
                }}
              >
                Leave a comment on Facebook →
              </a>
              <button
                onClick={dismiss}
                style={{ background: 'none', border: 'none', color: '#9AA9B6', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                No thanks
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.9rem', color: '#5D6B78', marginBottom: '1.5rem' }}>
                We&apos;d love to know what we can do better. Send us a note and we&apos;ll read every one.
              </p>
              <a
                href="mailto:feedback@plainlyapp.app?subject=Plainly feedback"
                onClick={dismiss}
                style={{
                  display: 'block', width: '100%',
                  padding: '0.8rem',
                  backgroundColor: '#1A2B3D',
                  color: '#F7F4ED', fontWeight: 700, fontSize: '0.95rem',
                  borderRadius: '12px', textDecoration: 'none',
                  marginBottom: '0.75rem',
                }}
              >
                Send feedback →
              </a>
              <button
                onClick={dismiss}
                style={{ background: 'none', border: 'none', color: '#9AA9B6', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                No thanks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Call this to check if the prompt should be shown */
export function shouldShowRatePrompt(): boolean {
  try {
    return !localStorage.getItem(RATE_KEY);
  } catch {
    return false;
  }
}
