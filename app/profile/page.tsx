'use client';

import { useState } from 'react';
import Footer from '@/components/Footer';
import { useHouseholdProfile } from '@/lib/householdProfile';
import { HouseholdProfile } from '@/lib/types';

const AGE_OPTIONS: { value: NonNullable<HouseholdProfile['age_range']>; label: string }[] = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55-64', label: '55–64' },
  { value: '65+', label: '65+' },
];

const HOME_VALUE_OPTIONS: { value: NonNullable<HouseholdProfile['home_value_range']>; label: string }[] = [
  { value: 'under_150k', label: 'Under $150,000' },
  { value: '150k_300k', label: '$150,000–$300,000' },
  { value: '300k_500k', label: '$300,000–$500,000' },
  { value: '500k_plus', label: '$500,000+' },
];

const INCOME_OPTIONS: { value: NonNullable<HouseholdProfile['household_income_range']>; label: string }[] = [
  { value: 'under_40k', label: 'Under $40,000' },
  { value: '40k_80k', label: '$40,000–$80,000' },
  { value: '80k_120k', label: '$80,000–$120,000' },
  { value: '120k_plus', label: '$120,000+' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ProfilePage() {
  const { profile, setProfile, loaded } = useHouseholdProfile();
  const [status, setStatus] = useState<SaveStatus>('idle');

  async function save(updates: Partial<HouseholdProfile>) {
    const next = { ...profile, ...updates };
    setProfile(next);

    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1500);
  }

  function clearAll() {
    save({
      zip_code: null,
      age_range: null,
      housing_status: null,
      home_value_range: null,
      household_income_range: null,
      has_school_age_kids: null,
    });
  }

  return (
    <main>
      <div className="mx-auto max-w-[640px] px-[6vw] pb-16 pt-6">
        <div className="text-center">
          <h1 className="font-display text-[clamp(2rem,5vw,2.6rem)] font-bold tracking-tight">
            Your profile
          </h1>
          <p className="mx-auto mt-3 max-w-[480px] text-base text-muted">
            Fill this out once, and Plainly uses it everywhere — your ballot, your representatives, and estimated impacts of local measures are all centered around it. Completely optional, and never shared.
          </p>
        </div>



        {loaded && (
          <div className="mt-8 flex flex-col gap-7">
        <Field label="ZIP code">
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={profile.zip_code ?? ''}
            onChange={(e) => save({ zip_code: e.target.value.replace(/[^0-9]/g, '') })}
            placeholder="Enter your ZIP code"
            className="w-full max-w-[200px] rounded-xl border-2 border-line bg-card px-4 py-2.5 text-sm text-navy focus:border-navy focus:outline-none"
          />
          <p className="mt-2 text-xs text-muted">Determines your ballot, representatives, and local content throughout the app.</p>
        </Field>

            <Field label="Age range">
              <OptionGrid
                options={AGE_OPTIONS}
                value={profile.age_range}
                onChange={(value) => save({ age_range: value })}
              />
            </Field>

            <Field label="Housing">
              <OptionGrid
                options={[
                  { value: 'rent' as const, label: 'I rent' },
                  { value: 'own' as const, label: 'I own' },
                ]}
                value={profile.housing_status}
                onChange={(value) => save({ housing_status: value })}
              />
            </Field>

            {profile.housing_status === 'own' && (
              <Field label="Approximate home value">
                <OptionGrid
                  options={HOME_VALUE_OPTIONS}
                  value={profile.home_value_range}
                  onChange={(value) => save({ home_value_range: value })}
                />
              </Field>
            )}

            <Field label="Household income">
              <OptionGrid
                options={INCOME_OPTIONS}
                value={profile.household_income_range}
                onChange={(value) => save({ household_income_range: value })}
              />
            </Field>

            <Field label="Do you have school-age kids?">
              <OptionGrid
                options={[
                  { value: true as const, label: 'Yes' },
                  { value: false as const, label: 'No' },
                ]}
                value={profile.has_school_age_kids}
                onChange={(value) => save({ has_school_age_kids: value })}
              />
            </Field>

            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={clearAll}
                className="text-sm text-muted underline hover:text-navy"
              >
                Clear all answers
              </button>
              {status === 'saving' && <span className="text-sm text-muted">Saving…</span>}
              {status === 'saved' && <span className="text-sm text-green">Saved</span>}
              {status === 'error' && (
                <span className="text-sm text-terracotta">Couldn&apos;t save — try again</span>
              )}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-sm text-muted">
          These ranges help estimate the financial impact of measures like
          school levies and bond issues. They&apos;re never used to suggest
          how to vote, and you can clear them anytime.
        </p>

        
      </div>

      <Footer />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 font-display text-base font-bold">{label}</div>
      {children}
    </div>
  );
}

function OptionGrid<T extends string | boolean>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              isSelected
                ? 'border-navy bg-navy text-cream'
                : 'border-line bg-card text-navy hover:border-navy'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      // Clear local storage and redirect
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      window.location.href = '/';
    } catch {
      setError('Something went wrong. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="mt-12 border-t border-line pt-8">
      <h2 className="font-display text-lg font-bold text-navy">Account</h2>
      <p className="mt-1 text-sm text-muted">
        Deleting your account permanently removes your profile, saved location,
        and all household data from Plainly. This cannot be undone.
      </p>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-xl border-2 border-terracotta/40 px-4 py-2.5 text-sm font-semibold text-terracotta hover:border-terracotta"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-5">
          <p className="text-sm font-semibold text-navy">
            Are you sure? This will permanently delete your account and all your data.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-terracotta px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Yes, delete my account'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-xl border-2 border-line px-4 py-2.5 text-sm font-semibold text-navy"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}
        </div>
      )}
    </div>
  );
}
