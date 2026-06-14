import type { Metadata } from 'next';
import SimplePage from '@/components/SimplePage';

export const metadata: Metadata = {
  title: 'Privacy Policy — Plainly',
  description: 'How Plainly handles your information.',
};

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy policy" subtitle="Last updated June 2026">
      <p>
        Plainly is built to help you understand your ballot — not to collect
        more information about you than necessary. This page explains what
        information Plainly uses, why, and how it's handled.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Location searches</h2>
      <p>
        When you enter an address, city, or ZIP code, it's sent to the Google
        Civic Information API to look up ballot information for that
        location. If you're not signed in, this search isn't stored anywhere
        by Plainly — it's used only to generate the results shown to you in
        that moment.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Accounts and saved locations</h2>
      <p>
        If you choose to sign in, Plainly uses email-based sign-in links — no
        passwords are stored. Your account is associated with:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>The email address you sign in with</li>
        <li>A saved location, if you choose to save one, so you don't have to re-enter it</li>
        <li>Whether you've opted in to election reminder emails</li>
      </ul>
      <p>
        This information is stored securely and is never shared with third
        parties, sold, or used for advertising.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Election reminder emails</h2>
      <p>
        If you opt in to reminders, Plainly sends occasional emails about
        upcoming election dates for your saved location. You can turn this
        off at any time from the menu. Reminder emails are sent only to
        users who have explicitly enabled them.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Third-party services</h2>
      <p>Plainly relies on a small number of third-party services to operate:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Google Civic Information API</strong> — provides ballot and
          election data based on the location you search
        </li>
        <li>
          <strong>Supabase</strong> — handles account sign-in and stores
          saved locations and preferences
        </li>
        <li>
          <strong>Resend</strong> — sends reminder emails to users who opt in
        </li>
      </ul>
      <p>
        Each of these services has its own privacy practices governing data
        they process on Plainly's behalf.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Your choices</h2>
      <p>
        You can use Plainly without creating an account. If you do create an
        account, you can update your saved location, turn reminders on or
        off, or sign out at any time from the menu. To request deletion of
        your account and associated data, contact the site owner.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Changes to this policy</h2>
      <p>
        This policy may be updated as Plainly evolves. The "last updated"
        date at the top of this page reflects the most recent revision.
      </p>
    </SimplePage>
  );
}
