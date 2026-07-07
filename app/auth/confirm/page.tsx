'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    async function handleAuth() {
      // Give Supabase a moment to process the hash fragment
      await new Promise(r => setTimeout(r, 500));

      const { data: { session }, error } = await supabase.auth.getSession();

      if (session) {
        router.push('/');
        router.refresh();
        return;
      }

      // Try refreshing the session
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData.session) {
        router.push('/');
        router.refresh();
        return;
      }

      setError('Could not sign you in. Please try again.');
    }

    handleAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <div className="text-center px-8">
        {error ? (
          <>
            <div className="mb-4 text-4xl">❌</div>
            <p className="font-display text-xl font-bold text-navy">Something went wrong</p>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <a href="/" className="mt-4 block text-sm font-semibold text-terracotta">
              Back to home →
            </a>
          </>
        ) : (
          <>
            <div className="mb-4 text-4xl">✉️</div>
            <p className="font-display text-xl font-bold text-navy">Signing you in...</p>
            <p className="mt-2 text-sm text-muted">You'll be redirected in a moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
