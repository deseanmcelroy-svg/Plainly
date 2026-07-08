'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
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
  const { user, loading, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reminders, setReminders] = useState(false);

  useEffect(() => {
    if (!open) { return; }
    if (!user) return;
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setProfile(d);
          setReminders(d.election_reminders_enabled ?? false);
        }
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
      <div
        className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col shadow-2xl plainly-menu"
        style={{ paddingTop: 'env(safe-area-inset-top)', backgroundColor: darkMode ? '#1A2B3D' : '#F7F4ED' }}>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-[6vw] py-6">
          <div className="flex items-center gap-3 flex-1 mr-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green">
              <span className="text-base font-bold text-cream">
                {user ? (user.email?.[0]?.toUpperCase() || 'U') : 'G'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <p className="text-sm font-bold text-navy truncate">{user.email}</p>
                  <button
                    onClick={() => { signOut(); onClose(); }}
                    className="text-xs text-muted hover:text-navy"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-navy">Welcome to Plainly</p>
                  <p className="text-xs text-muted">Your preferences save automatically on this device</p>
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

          {/* YOUR BALLOT */}
          <MenuSection label="Your ballot">
            <MenuLink href="/#races" icon="🗳️" label="My ballot" onClick={onClose} />
            <MenuLink href="/practice-ballot" icon="📝" label="Practice ballot" onClick={onClose} chevron />
            <MenuLink href="/word-around-town" icon="🏘️" label="Word around town" onClick={onClose} chevron />
          </MenuSection>

          {/* LEARN */}
          <MenuSection label="Learn">
            <MenuLink href="/government" icon="🏛️" label="Grade your government" onClick={onClose} chevron />
            <MenuLink href="/leadership" icon="🏛️" label="Who does what?" onClick={onClose} chevron />
            <MenuLink href="/glossary" icon="📚" label="Civic glossary" onClick={onClose} chevron />
          </MenuSection>

          {/* GET READY TO VOTE */}
          <MenuSection label="Get ready to vote">
            <MenuLink href="/#calendar" icon="📅" label="Election calendar" onClick={onClose} />
            <MenuLink href="/#vote" icon="✅" label="Voter checklist" onClick={onClose} />
          </MenuSection>

          {/* SETTINGS */}
          <MenuSection label="Settings">
            <MenuLink href="/profile" icon="🏠" label="About your household" onClick={onClose} chevron />
            <ToggleRow
              icon="🌙"
              label="Dark mode"
              checked={darkMode}
              onChange={() => toggleDarkMode()}
            />
            {user && (
              <ToggleRow
                icon="🔔"
                label="Election reminders"
                checked={reminders}
                onChange={handleReminders}
              />
            )}
          </MenuSection>

          {/* ABOUT */}
          <MenuSection label="About">
            <MenuLink href="/faq" icon="❓" label="Help &amp; FAQ" onClick={onClose} chevron />
            <MenuLink href="/privacy" icon="🔒" label="Privacy" onClick={onClose} chevron />
            <MenuLink href="/about" icon="ℹ️" label="About Plainly" onClick={onClose} chevron />
            <MenuLink href="mailto:feedback@plainlyapp.app" icon="💬" label="Send feedback" onClick={onClose} chevron external />
          </MenuSection>

        </div>
      </div>
    </>
  );
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line/40">
      <p className="px-[6vw] pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function MenuLink({
  href, icon, label, onClick, chevron, external,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
  chevron?: boolean;
  external?: boolean;
}) {
  const props = external
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href };

  return (
    <a
      {...props}
      onClick={onClick}
      className="flex items-center gap-3 px-[6vw] py-3 text-navy hover:bg-line/20"
      dangerouslySetInnerHTML={undefined}
    >
      <span className="w-6 flex-shrink-0 text-center text-lg">{icon}</span>
      <span
        className="flex-1 text-base font-semibold"
        dangerouslySetInnerHTML={{ __html: label }}
      />
      {chevron && <span className="text-muted">›</span>}
    </a>
  );
}

function ToggleRow({
  icon, label, checked, onChange,
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
          onChange={e => onChange(e.target.checked)}
        />
        <span className="switch-slider absolute inset-0 cursor-pointer rounded-full bg-navy/15 transition-colors" />
      </label>
    </div>
  );
}

function WaitlistMenuSectionInline({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDone(isWaitlistDone());
  }, []);

  if (done) return null;

  return (
    <div className="border-t border-line/40 px-[6vw] py-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="w-6 flex-shrink-0 text-center text-lg">🔔</span>
        <span className="flex-1 text-base font-semibold text-navy">
          Notify me when my ballot is ready
        </span>
        <span className="text-xs text-muted">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mt-3 pl-9">
          <p className="mb-3 text-sm text-muted">
            Real ballot data typically goes live in September. Enter your email and we&apos;ll let you know the moment it&apos;s available for your area.
          </p>
          <WaitlistForm
            compact
            onDone={() => {
              setDone(true);
              setExpanded(false);
              setTimeout(onClose, 1500);
            }}
          />
        </div>
      )}
    </div>
  );
}
