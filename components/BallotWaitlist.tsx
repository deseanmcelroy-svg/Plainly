'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

const WAITLIST_KEY = 'plainly-waitlist-done';

interface BallotWaitlistProps {
  location?: string;       // pre-fill ZIP from current ballot search
  compact?: boolean;       // true = inline row, false = card style
}

export default function BallotWaitlist({ location, compact }: BallotWaitlistProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(WAITLIST_KEY)) setDone(true);
    } catch {}
  }, []);

  // Pre-fill email for signed-in users
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, location: location ?? '' }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      try { localStorage.setItem(WAITLIST_KEY, '1'); } catch {}
    } catch {
      setError("Couldn't save your email — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className={compact ? 'flex items-center gap-2 text-sm text-green' : 'rounded-xl border border-green/20 bg-green/5 px-4 py-3 text-sm text-green'}>
        <span>✅</span>
        <span>You&apos;re on the list — we&apos;ll email you when your ballot is ready.</span>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address for ballot notification"
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-cream disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Saving…' : 'Notify me 🔔'}
        </button>
        {error && <p className="text-xs text-terracotta w-full">{error}</p>}
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-navy/20 bg-navy/5 p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">🔔</span>
        <span className="font-display text-base font-bold text-navy">
          Get notified when your ballot is ready
        </span>
      </div>
      <p className="mb-3 text-sm text-muted">
        Real ballot data for your area typically appears in September 2026.
        Enter your email and we&apos;ll let you know the moment it&apos;s live.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address for ballot notification"
          className="w-full rounded-xl border-2 border-line bg-card px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-cream disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Notify me when my ballot is ready 🔔'}
        </button>
        {error && <p className="text-xs text-terracotta">{error}</p>}
      </form>
      <p className="mt-2 text-center text-xs text-muted">
        One email only. No spam, ever.
      </p>
    </div>
  );
}
