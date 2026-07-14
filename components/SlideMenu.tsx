'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useHouseholdProfile } from '@/lib/householdProfile';
import LogoMark from '@/components/LogoMark';
import type { HouseholdProfile } from '@/lib/types';

interface SlideMenuProps {
  open: boolean;
  onClose: () => void;
}

interface ProfileData {
  election_reminders_enabled: boolean;
}

function getProfileSummary(profile: HouseholdProfile): string | null {
  const bits: string[] = [];
  if (profile.age_range) bits.push(`${profile.age_range} year old`);
  if (profile.housing_status === 'own') bits.push('homeowner');
  if (profile.housing_status === 'rent') bits.push('renter');
  const incomeLabels: Record<string, string> = {
    under_40k: 'under $40K income',
    '40k_80k': '$40K\u2013$80K income',
    '80k_120k': '$80K\u2013$120K income',
    '120k_plus': '$120K+ income',
  };
  if (profile.household_income_range) bits.push(incomeLabels[profile.household_income_range]);
  if (profile.has_school_age_kids) bits.push('school-age kids');
  if (bits.length === 0) return null;
  return `Viewing voting measures for a ${bits.join(', ')}.`;
}

export default function SlideMenu({ open, onClose }: SlideMenuProps) {
  const { user, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { profile } = useHouseholdProfile();
  const profileSummary = getProfileSummary(profile);
  const [reminders, setReminders] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ProfileData | null) => {
        if (d) setReminders(d.election_reminders_enabled ?? false);
      })
      .catch(() => {});
  }, [open, user]);

  async function handleReminders(val: boolean) {
    setReminders(val);
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ election_reminders_enabled: val }),
    }).catch(() => {});
  }

  if (!open) return null;

  return (
    <>
      <style>{`.plainly-menu * { color: inherit !important; border-color: rgba(128,128,128,0.2) !important; }`}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col shadow-2xl plainly-menu"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          backgroundColor: darkMode ? '#1A2B3D' : '#F7F4ED',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-5 py-6">
          <div className="flex items-center gap-3 flex-1 mr-3">
            <LogoMark size={40} />
            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <p className="text-sm font-bold text-navy truncate">{user.email}</p>
                {profileSummary && <p className="text-xs text-muted mt-0.5">{profileSummary}</p>}
                  <button
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="text-xs text-muted hover:text-navy"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-navy">Welcome to Plainly</p>
                  <p className="text-xs text-muted">{profileSummary ?? 'Your preferences save automatically on this device'}</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border-2 border-line text-navy"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <MenuLink href="/" icon="🧭" label="Home" onClick={onClose} />

          <MenuSection label="Your ballot">
            <MenuLink href="/#races" icon="🗳️" label="My ballot" onClick={onClose} />
            <MenuLink href="/practice-ballot" icon="📝" label="Practice ballot" onClick={onClose} chevron />
            <MenuLink href="/word-around-town" icon="🏘️" label="Word around town" onClick={onClose} chevron />
          </MenuSection>

          <MenuSection label="Learn">
            <MenuLink href="/government" icon="🧑‍💼" label="Your representatives" onClick={onClose} chevron />
            <MenuLink href="/leadership" icon="🏛️" label="Who does what?" onClick={onClose} chevron />
            <MenuLink href="/glossary" icon="📚" label="Civic glossary" onClick={onClose} chevron />
          </MenuSection>

          <MenuSection label="Get ready to vote">
            <MenuLink href="/#calendar" icon="📅" label="Election calendar" onClick={onClose} />
            <MenuLink href="/#vote" icon="✅" label="Voter checklist" onClick={onClose} />
          </MenuSection>

          <MenuSection label="Settings">
            <MenuLink href="/profile" icon="🏠" label="My Profile" onClick={onClose} chevron />
            <ToggleRow icon="🌙" label="Dark mode" checked={darkMode} onChange={() => toggleDarkMode()} />
            {user && (
              <ToggleRow
                icon="🔔"
                label="Election reminders"
                checked={reminders}
                onChange={handleReminders}
              />
            )}
          </MenuSection>

          <MenuSection label="About">
            <MenuLink href="/faq" icon="❓" label="Help & FAQ" onClick={onClose} chevron />
            <MenuLink href="/privacy" icon="🔒" label="Privacy" onClick={onClose} chevron />
            <MenuLink href="/about" icon="ℹ️" label="About Plainly" onClick={onClose} chevron />
            <MenuLink
              href="mailto:feedback@plainlyapp.app"
              icon="💬"
              label="Send feedback"
              onClick={onClose}
              chevron
              external
            />
          </MenuSection>
        </div>
      </div>
    </>
  );
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line/40">
      <p className="px-[6vw] pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
      {children}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
  chevron,
  external,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
  chevron?: boolean;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="w-6 flex-shrink-0 text-center text-lg">{icon}</span>
      <span className="flex-1 text-base font-semibold">{label}</span>
      {chevron && <span className="text-muted">›</span>}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className="flex items-center gap-3 px-[6vw] py-3 text-navy hover:bg-line/20">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-[6vw] py-3 text-navy hover:bg-line/20">
      {content}
    </Link>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-[6vw] py-3">
      <span className="w-6 flex-shrink-0 text-center text-lg">{icon}</span>
      <span className="flex-1 text-base font-semibold text-navy">{label}</span>
      <label className="relative inline-block h-[26px] w-11 flex-shrink-0">
        <input
          type="checkbox"
          className="switch-input h-0 w-0 opacity-0"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch-slider absolute inset-0 cursor-pointer rounded-full bg-navy/15 transition-colors" />
      </label>
    </div>
  );
}
