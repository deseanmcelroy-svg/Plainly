'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { EMPTY_PROFILE } from './impactEstimate';
import { HouseholdProfile } from './types';

// ===========================================================================
// Household profile context
//
// Holds the user's optional household profile (broad brackets, see
// types.ts) in memory for the current session, so the ballot page can show
// impact estimates without re-fetching. For signed-in users, this is
// loaded from and saved to Supabase via /api/profile. For guests, it's
// in-memory only -- entered on /profile, used for the session, never sent
// anywhere.
// ===========================================================================

interface HouseholdProfileContextValue {
  profile: HouseholdProfile;
  setProfile: (profile: HouseholdProfile) => void;
  loaded: boolean;
}

const HouseholdProfileContext = createContext<HouseholdProfileContextValue>({
  profile: EMPTY_PROFILE,
  setProfile: () => {},
  loaded: false,
});

export function HouseholdProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<HouseholdProfile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProfileState({
            age_range: data.age_range ?? null,
            housing_status: data.housing_status ?? null,
            home_value_range: data.home_value_range ?? null,
            household_income_range: data.household_income_range ?? null,
            has_school_age_kids: data.has_school_age_kids ?? null,
          });
        }
      })
      .finally(() => setLoaded(true));
  }, [user]);

  const setProfile = useCallback((next: HouseholdProfile) => {
    setProfileState(next);
  }, []);

  return (
    <HouseholdProfileContext.Provider value={{ profile, setProfile, loaded }}>
      {children}
    </HouseholdProfileContext.Provider>
  );
}

export function useHouseholdProfile() {
  return useContext(HouseholdProfileContext);
}
