'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';

export default function SignInForm() {
  const { supabaseEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabaseEnabled) return;

    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus(error ? 'error' : 'sent');
  }

  if (!supabaseEnabled) {
    return (
      <div className="rounded-xl bg-cream p-4 text-sm text-muted">
        Sign-in isn&apos;t configured yet. Add Supabase credentials to enable accounts —
        see the README for setup steps.
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl bg-green/10 p-4 text-sm text-navy">
        Check your email for a sign-in link.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <label htmlFor="signin-email" className="text-sm font-semibold text-navy">
        Email address
      </label>
      <input
        id="signin-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="rounded-xl border-2 border-line bg-card px-4 py-3 text-base text-navy focus:border-terracotta focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded-xl bg-navy px-4 py-3 text-base font-semibold text-cream transition-colors hover:bg-navy/90 disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending link…' : 'Email me a sign-in link'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-terracotta">
          Something went wrong sending the link. Please try again.
        </p>
      )}
      <p className="text-xs text-muted">
        No password needed — we&apos;ll email you a one-time link to sign in.
      </p>
    </form>
  );
}
