import type { Metadata } from 'next';
import SimplePage from '@/components/SimplePage';

export const metadata: Metadata = {
  title: 'Am I registered to vote? \u2014 Plainly',
  description: 'Why voter registration matters and how to check your status.',
};

export default function RegistrationPage() {
  return (
    <SimplePage
      title="Am I registered to vote?"
      subtitle="It only takes a minute to check — and it's the single most common reason eligible people don't end up voting."
    >
      <p>
        Voter registration is how election officials know you&apos;re
        eligible to vote and where to send your ballot or assign your
        polling place. Without it, you can&apos;t vote — even if
        you&apos;ve voted before.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">
        Why check, even if you&apos;ve voted before?
      </h2>
      <p>
        Registration isn&apos;t always permanent. A few common things can
        affect your status without you realizing it:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>You moved.</strong> Your registration is tied to your
          address — if you&apos;ve moved since you last voted, even
          within the same city, you may need to re-register or update your
          address.
        </li>
        <li>
          <strong>You haven&apos;t voted in a while.</strong> Some states
          mark registrations &quot;inactive&quot; after missing a couple of
          federal elections, which can require extra steps before you can
          vote.
        </li>
        <li>
          <strong>Your name changed.</strong> Marriage, divorce, or other
          legal name changes may need to be reflected on your registration.
        </li>
        <li>
          <strong>It&apos;s your first time.</strong> If you&apos;ve never
          registered — including if you just turned 18 or recently
          became a citizen — you&apos;ll need to register before any
          deadline for the upcoming election.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-bold text-navy">Deadlines matter</h2>
      <p>
        Registration deadlines vary by state and are often several weeks
        before Election Day — sometimes as early as 30 days out.
        Checking early gives you time to fix any issues before the deadline
        passes. A few states offer same-day registration, but most
        don&apos;t, so don&apos;t wait until the last minute.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Check your status</h2>
      <p>
        The fastest way to check is through your state&apos;s official
        election website. Vote.gov, run by the U.S. government, will direct
        you to the right place for your state.
      </p>
      <a
        href="https://vote.gov/register"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-2xl bg-terracotta px-6 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b04f30]"
      >
        Check my registration status →
      </a>
      <p className="text-sm text-muted">
        This opens vote.gov in a new tab, where you can select your state to
        check your status on your state&apos;s official election website.
      </p>
    </SimplePage>
  );
}
