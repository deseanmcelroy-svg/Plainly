'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { EMPTY_PROFILE } from './impactEstimate';
import { HouseholdProfile } from './types';

const STORAGE_KEY = 'plainly-household-profile';

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
  const [profile, setProfileState] = useState<HouseholdProfile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfileState({
          zip_code: parsed.zip_code ?? null,
            age_range: parsed.age_range ?? null,
          housing_status: parsed.housing_status ?? null,
          home_value_range: parsed.home_value_range ?? null,
          household_income_range: parsed.household_income_range ?? null,
          has_school_age_kids: parsed.has_school_age_kids ?? null,
        });
      }
    } catch {}
    setLoaded(true);
  }, []);

  const setProfile = useCallback((next: HouseholdProfile) => {
    setProfileState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
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
