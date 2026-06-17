'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const ONBOARDING_KEY = 'plainly-onboarding-done';

const STEPS = [
  {
    emoji: '🗳️',
    title: 'Politics, explained plainly.',
    description:
      "Plainly turns confusing ballot language into plain English so you always know what you're voting for. Here's a quick tour of everything the app can do.",
    cta: "Let's go",
    color: '#D9663E',
  },
  {
    emoji: '📍',
    title: 'See your real ballot',
    description:
      'Enter your address or ZIP code on the home page and Plainly pulls up every race and measure on your actual ballot, with plain-language explanations for each one.',
    cta: 'Got it',
    color: '#1A2B3D',
  },
  {
    emoji: '🏠',
    title: 'Make it personal',
    description:
      'Fill out your optional household profile. Plainly uses your age range, housing status, income bracket, and whether you have school-age kids to estimate how ballot measures could affect your household in dollars and cents.',
    cta: 'Got it',
    color: '#5B8C7B',
  },
  {
    emoji: '📝',
    title: 'Practice before you vote',
    description:
      "The practice ballot lets you go through every item on your real ballot before Election Day. Read plain-language explainers, see household impact estimates, and make your practice selections. Nothing is submitted anywhere.",
    cta: 'Got it',
    color: '#D9663E',
  },
  {
    emoji: '🏘️',
    title: 'Word around town',
    description:
      "After completing your practice ballot, share your selections anonymously and see how other Plainly users in your area are leaning on the same issues, with charts showing the community breakdown per ballot item.",
    cta: 'Got it',
    color: '#1A2B3D',
  },
  {
    emoji: '🏛️',
    title: 'Civic tools',
    description:
      "The leadership explainer covers 13 government roles. The civic glossary defines 39 terms like levy, canvass, and plurality with real-world examples. Every ballot race links to a how-does-this-get-decided page covering voting mechanics and certification.",
    cta: 'Got it',
    color: '#5B8C7B',
  },
  {
    emoji: '✅',
    title: 'Voter checklist',
    description:
      "Four things to confirm before Election Day: registration status, polling place, ID requirements, and how you'll vote. Each one links to a plain-language guide with official sources.",
    cta: 'Got it',
    color: '#D9663E',
  },
  {
    emoji: '🎉',
    title: "You're all set",
    description:
      "Start by entering your address to see your ballot. Everything else is in the menu whenever you need it.",
    cta: 'See my ballot',
    ctaHref: '/',
    color: '#1A2B3D',
  },
];

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(ONBOARDING_KEY)) return;
    } catch {}
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);

  function finish() {
    setExiting(true);
    setTimeout(() => {
      setShow(false);
      try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
    }, 350);
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Welcome to Plainly"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(26,43,61,0.75)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '460px',
          borderRadius: '24px', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          transform: exiting ? 'scale(0.97) translateY(8px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.35s ease',
        }}
      >
        {/* Header */}
        <div style={{ backgroundColor: current.color, padding: '2.5rem 2rem 2rem', textAlign: 'center', transition: 'background-color 0.3s ease' }}>
          <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '1rem' }}>{current.emoji}</div>
          <div style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '1.55rem', fontWeight: 700, color: '#F7F4ED', lineHeight: 1.25 }}>
            {current.title}
          </div>
        </div>

        {/* Body */}
        <div style={{ backgroundColor: '#F7F4ED', padding: '1.75rem 2rem 2rem' }}>
          <p style={{ fontSize: '0.975rem', lineHeight: 1.7, color: '#1A2B3D', margin: 0 }}>
            {current.description}
          </p>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', margin: '1.5rem 0 1rem' }}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
                style={{
                  width: i === step ? '20px' : '8px', height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === step ? current.color : '#D0CCC4',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height: '3px', backgroundColor: '#E5E2DA', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: current.color, borderRadius: '2px', transition: 'width 0.3s ease, background-color 0.3s ease' }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{ flexShrink: 0, padding: '0.7rem 1.1rem', borderRadius: '12px', border: '2px solid #D0CCC4', backgroundColor: 'transparent', color: '#5D6B78', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Back
              </button>
            )}
            {isLast && current.ctaHref ? (
              <Link
                href={current.ctaHref}
                onClick={finish}
                style={{ flex: 1, display: 'block', textAlign: 'center', padding: '0.75rem', borderRadius: '12px', backgroundColor: current.color, color: '#F7F4ED', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}
              >
                {current.cta}
              </Link>
            ) : (
              <button
                onClick={next}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', backgroundColor: current.color, color: '#F7F4ED', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background-color 0.3s ease' }}
              >
                {current.cta} {!isLast && '\u2192'}
              </button>
            )}
          </div>

          <button
            onClick={finish}
            style={{ display: 'block', width: '100%', marginTop: '0.75rem', padding: '0.4rem', background: 'none', border: 'none', color: '#9AA9B6', fontSize: '0.78rem', cursor: 'pointer' }}
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
