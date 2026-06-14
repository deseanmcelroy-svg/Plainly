import type { Metadata } from 'next';
import SimplePage from '@/components/SimplePage';

export const metadata: Metadata = {
  title: 'About — Plainly',
  description: 'Why Plainly exists and how it helps you understand your ballot.',
};

export default function AboutPage() {
  return (
    <SimplePage
      title="Politics, explained plainly."
      subtitle="Plainly exists for one reason: most people don't know what's on their ballot until they're standing in the voting booth."
    >
      <p>
        Local elections decide things that affect daily life more than almost
        anything else — who funds your schools, how your roads get fixed, and
        what gets built in your neighborhood. But local races rarely get the
        attention national elections do, and ballot language is often written
        by lawyers, for lawyers.
      </p>

      <p>
        Plainly takes your address, looks up what's actually on your ballot,
        and explains every race and measure in plain language — what it is,
        what it does, and why it might matter to you. No spin, no party
        labels, no recommendations on how to vote. Just the facts, explained
        like a friend would explain them.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">What Plainly does</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Shows you every race and ballot measure for your specific address</li>
        <li>Explains each one in a sentence or two, without jargon</li>
        <li>Tracks key dates — registration deadlines, early voting, Election Day</li>
        <li>Sends optional reminders so you don't miss anything</li>
      </ul>

      <h2 className="font-display text-2xl font-bold text-navy">What Plainly doesn't do</h2>
      <p>
        Plainly doesn't tell you who or what to vote for. It doesn't favor
        any party, candidate, or position. The goal is simple: help you walk
        into the voting booth knowing what you're being asked to decide,
        so you can decide for yourself.
      </p>

      <h2 className="font-display text-2xl font-bold text-navy">Where the data comes from</h2>
      <p>
        Ballot and election information comes from the Google Civic
        Information API, which draws from official state and local election
        offices through the Voting Information Project. When live data isn't
        yet available for an election, Plainly shows general information
        about what to expect so you're never left with nothing.
      </p>
    </SimplePage>
  );
}
