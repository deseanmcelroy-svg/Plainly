'use client';

import { useState } from 'react';

const WAITLIST_KEY = 'plainly-waitlist-done';

export function isWaitlistDone(): boolean {
  try { return !!localStorage.getItem(WAITLIST_KEY); } catch { return false; }
}

interface WaitlistFormProps {
  location?: string;
  prefillEmail?: string;
  compact?: boolean;
  onDone?: () => void;
}

export default function WaitlistForm({
  location = '',
  prefillEmail = '',
  compact = false,
  onDone,
}: WaitlistFormProps) {
  const [email, setEmail] = useState(prefillEmail);
  const [zip, setZip] = useState(location);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !zip.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, location: zip }),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
      try { localStorage.setItem(WAITLIST_KEY, '1'); } catch {}
      onDone?.();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className={`rounded-xl border border-green/30 bg-green/10 p-4 text-center ${compact ? 'text-sm' : ''}`}>
        <div className="text-lg">✅</div>
        <div className="mt-1 font-semibold text-green">You&apos;re on the list!</div>
        <div className="mt-0.5 text-xs text-muted">
          We&apos;ll email you as soon as your real ballot is available.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {!compact && (
        <div className="text-sm font-semibold text-navy">
          Notify me when my real ballot is ready
        </div>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        required
        className="rounded-xl border-2 border-line bg-card px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
      />
      {!location && (
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Your ZIP code"
          required
          className="rounded-xl border-2 border-line bg-card px-4 py-2.5 text-sm text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
        />
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-cream disabled:opacity-50"
      >
        {status === 'loading' ? 'Saving…' : 'Notify me →'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-terracotta">Something went wrong — try again.</p>
      )}
    </form>
  );
}
