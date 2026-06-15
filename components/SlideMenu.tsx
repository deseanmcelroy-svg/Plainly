'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import SignInForm from '@/components/auth/SignInForm';
import LogoMark from '@/components/LogoMark';

interface SlideMenuProps {
  open: boolean;
  onClose: () => void;
}

interface ProfileData {
  saved_location: string | null;
  election_reminders_enabled: boolean;
  notify_email: string | null;
}

export default function SlideMenu({ open, onClose }: SlideMenuProps) {
  const { user, loading, supabaseEnabled, signOut } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  // Load saved profile data once signed in
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, [user]);

  async function toggleReminders(enabled: boolean) {
    if (!profile) return;
    setProfile({ ...profile, election_reminders_enabled: enabled });
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ election_reminders_enabled: enabled }),
    });
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? 'G';

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/45 transition-opacity duration-300 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <nav
        aria-label="Main menu"
        className={`fixed right-0 top-0 z-[100] h-full w-[min(360px,88vw)] overflow-y-auto bg-cream shadow-[-20px_0_60px_-20px_rgba(26,43,61,0.4)] transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-[6vw] py-6">
          <div className="flex items-center gap-2.5 font-sans text-xl font-light tracking-wide">
            <LogoMark />
            Plainly
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl transition-colors hover:bg-navy/5"
          >
            ×
          </button>
        </div>

        {/* Profile */}
        <div className="border-b border-line px-[6vw] py-6">
          <div className="flex items-center gap-[14px]">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green font-display text-xl font-bold text-white">
              {initial}
            </div>
            {user ? (
              <div className="min-w-0">
                <div className="truncate text-base font-bold">{user.email}</div>
                <button
                  onClick={signOut}
                  className="text-sm text-muted underline-offset-2 hover:underline"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div>
                <div className="text-base font-bold">Guest</div>
                <div className="text-sm text-muted">Sign in to save your location & checklist</div>
              </div>
            )}
          </div>

          {!user && !loading && (
            <div className="mt-4">
              {showSignIn ? (
                <SignInForm />
              ) : (
                <button
                  onClick={() => setShowSignIn(true)}
                  disabled={!supabaseEnabled}
                  className="w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-cream transition-colors hover:bg-navy/90 disabled:opacity-50"
                >
                  Sign in
                </button>
              )}
              {!supabaseEnabled && (
                <p className="mt-2 text-xs text-muted">
                  Accounts aren&apos;t set up yet — see the README to enable Supabase auth.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Get around */}
        <MenuSection label="Get around">
          <MenuLink href="/#races" icon="🗳️" label="My ballot" onClick={onClose} />
          <MenuLink href="/leadership" icon="🏛️" label="Who does what?" onClick={onClose} chevron />
          <MenuLink href="/profile" icon="🏠" label="About your household" onClick={onClose} chevron />
          <MenuLink href="/#calendar" icon="📅" label="Election calendar" onClick={onClose} />
          <MenuLink href="/#how" icon="💬" label="How it works" onClick={onClose} />
          <MenuLink href="/#vote" icon="✅" label="Voter checklist" onClick={onClose} />
        </MenuSection>

        {/* Account */}
        {user && (
          <MenuSection label="Account">
            <div className="-mx-3 px-3 py-[14px]">
              <div className="flex items-center gap-[14px] text-base font-semibold">
                <span className="w-6 flex-shrink-0 text-center text-lg">📍</span>
                Saved location
              </div>
              <div className="mt-1 pl-9 text-sm text-muted">
                {profile?.saved_location || 'No location saved yet — search for your ballot to save it here.'}
              </div>
            </div>
            <ToggleRow
              icon="🔔"
              label="Election reminders"
              checked={profile?.election_reminders_enabled ?? true}
              onChange={toggleReminders}
            />
          </MenuSection>
        )}

        {/* Settings */}
        <MenuSection label="Settings">
          <ToggleRow icon="🌙" label="Dark mode" checked={darkMode} onChange={setDarkMode} />
          <MenuButton icon="🌐" label="Language" />
          <MenuLink href="/privacy" icon="🔒" label="Privacy" onClick={onClose} chevron />
        </MenuSection>

        {/* Support */}
        <MenuSection label="Support" last>
          <MenuLink href="/faq" icon="❓" label="Help & FAQ" onClick={onClose} chevron />
          <MenuButton icon="📣" label="Send feedback" />
          <MenuLink href="/about" icon="ℹ️" label="About Plainly" onClick={onClose} chevron />
        </MenuSection>

        <div className="px-[6vw] py-5 pb-8 text-center text-sm text-muted">
          Plainly is non-partisan. We don&apos;t tell you how to vote — just what&apos;s on it.
        </div>
      </nav>
    </>
  );
}

function MenuSection({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`px-[6vw] py-[18px] ${last ? '' : 'border-b border-line'}`}>
      <div className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">{label}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
  chevron,
}: {
  href: string;
  icon: string;
  label: string;
  onClick?: () => void;
  chevron?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="-mx-3 flex items-center gap-[14px] rounded-lg px-3 py-[14px] text-base font-semibold text-navy transition-colors hover:bg-navy/5"
    >
      <span className="w-6 flex-shrink-0 text-center text-lg">{icon}</span>
      {label}
      {chevron && <span className="ml-auto text-lg text-muted/50">›</span>}
    </a>
  );
}

function MenuButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="-mx-3 flex w-[calc(100%+24px)] items-center gap-[14px] rounded-lg px-3 py-[14px] text-left text-base font-semibold text-navy transition-colors hover:bg-navy/5">
      <span className="w-6 flex-shrink-0 text-center text-lg">{icon}</span>
      {label}
      <span className="ml-auto text-lg text-muted/50">›</span>
    </button>
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
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-[14px]">
      <div className="flex items-center gap-[14px]">
        <span className="w-6 flex-shrink-0 text-center text-lg">{icon}</span>
        <span className="text-base font-semibold">{label}</span>
      </div>
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
