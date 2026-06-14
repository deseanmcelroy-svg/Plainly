'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// ===========================================================================
// Lightweight auth context.
//
// If Supabase env vars aren't configured, `supabaseEnabled` is false and the
// rest of the app should treat the user as a signed-out guest — no errors,
// no crashes, auth UI just won't do anything until configured.
// ===========================================================================

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabaseEnabled: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: false,
  supabaseEnabled: false,
  signOut: async () => {},
});

const supabaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!supabaseEnabled) return;
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, supabaseEnabled, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
