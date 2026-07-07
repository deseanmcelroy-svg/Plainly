'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/');
        router.refresh();
      }
    });

    // Handle hash fragment tokens
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
        router.refresh();
      }
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <div className="text-center">
        <div className="mb-4 text-4xl">✉️</div>
        <p className="font-display text-xl font-bold text-navy">Signing you in...</p>
        <p className="mt-2 text-sm text-muted">You'll be redirected in a moment.</p>
      </div>
    </div>
  );
}
