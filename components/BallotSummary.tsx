import Link from 'next/link';
import { LocationBallot } from '@/lib/types';

interface BallotSummaryProps {
  ballot: LocationBallot;
}

export default function BallotSummary({ ballot }: BallotSummaryProps) {
  const localCount = ballot.ballotItems.length;
  const eventsCount = ballot.calendarEvents.length;
  const levels = new Set(ballot.ballotItems.map((item) => item.level)).size;

  const daysToElection = Math.max(
    0,
    Math.ceil(
      (new Date(ballot.nextElectionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="reveal-enter flex justify-center px-[6vw] pb-12">
      <div className="w-full max-w-[680px] rounded-[20px] bg-card p-9 text-center shadow-[0_20px_50px_-30px_rgba(26,43,61,0.25)]">
        <div className="mb-2.5 font-mono text-sm uppercase tracking-widest text-green">
          Showing your ballot for
        </div>
        <h2 className="font-display text-3xl font-bold">{ballot.locationLabel}</h2>
        <p className="mt-2 text-base text-muted">
          Here&apos;s everything you&apos;ll be asked to vote on. Tap anything below to see what it
          actually means.
        </p>
        {ballot.source === 'sample' && (
          <p className="mt-3 inline-block rounded-full bg-cream px-4 py-1.5 text-sm text-muted">
            Showing sample data — live election data isn&apos;t available for this address right now.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-8">
          <Stat num={localCount} label="Races & measures" />
          <Stat num={daysToElection} label="Days to vote" />
          <Stat num={levels} label="Levels of government" />
          <Stat num={eventsCount} label="Key dates" />
        </div>
        <Link
          href="/leadership"
          className="mt-6 inline-block text-sm text-terracotta underline"
        >
          Not sure who does what? See what each role means →
        </Link>
      </div>
    </div>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-[2.2rem] font-bold text-terracotta">{num}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
