'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import SlideMenu from '@/components/SlideMenu';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth';
import { PollingInfo, VoteSite } from '@/lib/types';

export default function PollingLocationPage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [data, setData] = useState<PollingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function lookup(location: string) {
    if (!location) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/polling-locations?location=${encodeURIComponent(location)}`);
      if (!res.ok) throw new Error('Lookup failed');
      const result: PollingInfo = await res.json();
      setData(result);
    } catch {
      setError("We couldn't look up polling locations for that address. Try a city, ZIP code, or full street address.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile?.saved_location) {
          setInputValue(profile.saved_location);
          lookup(profile.saved_location);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    lookup(inputValue.trim());
  }

  return (
    <main>
      <Header onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="mx-auto max-w-[680px] px-[6vw] pb-16 pt-6">
        <h1 className="font-display text-[clamp(2rem,5vw,2.6rem)] font-bold leading-tight">
          Where do I vote?
        </h1>
        <p className="mt-3 text-lg text-muted">
          Your polling place is assigned based on your home address &mdash;
          here's how that works, and how to find yours.
        </p>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-navy/90">
          <h2 className="font-display text-xl font-bold text-navy">
            How polling locations are determined
          </h2>
          <p>
            Election offices divide cities and counties into voting
            precincts, often based on neighborhoods or voting districts.
            Each precinct is assigned a specific polling place &mdash;
            usually somewhere central and accessible, like a school,
            library, community center, or fire station.
          </p>
          <p>
            Your precinct (and therefore your polling place) is tied to your
            home address. Two people on the same street might vote at
            different locations if they fall into different precincts, and
            your polling place can change between elections if boundaries
            are redrawn or a location becomes unavailable &mdash; which is
            why it's worth checking before every election rather than
            assuming it's the same as last time.
          </p>
          <p>
            Many areas also offer <strong>early voting sites</strong> (which
            may differ from your Election Day polling place and are often
            open to anyone in the county, not just your precinct) and{' '}
            <strong>ballot drop-off locations</strong> for mail ballots.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-card p-6">
          <h2 className="font-display text-lg font-bold">Find your voting locations</h2>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your address or ZIP code"
              aria-label="Enter your address or ZIP code"
              className="flex-1 rounded-xl border-2 border-navy bg-card px-4 py-3 text-base text-navy placeholder:text-muted focus:border-terracotta focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-terracotta px-5 py-3 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b04f30]"
            >
              Search
            </button>
          </form>

          {loading && (
            <div className="mt-4 text-center text-sm text-muted">Looking up voting locations&hellip;</div>
          )}
          {error && <div className="mt-4 text-center text-sm text-terracotta">{error}</div>}

          {!loading && !error && searched && data && <Results data={data} />}
        </div>
      </div>

      <Footer />
    </main>
  );
}

function Results({ data }: { data: PollingInfo }) {
  if (data.source === 'none') {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
        <p>
          We don't have published voting locations for{' '}
          <strong>{data.locationLabel}</strong> right now &mdash; election
          offices typically publish this information a few weeks before an
          election.
        </p>
        {data.finderUrl ? (
          <a
            href={data.finderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-terracotta underline"
          >
            Find your polling place on your local election office's website &rarr;
          </a>
        ) : (
          <a
            href="https://www.vote.org/polling-place-locator/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-terracotta underline"
          >
            Find your polling place with Vote.org's locator &rarr;
          </a>
        )}
      </div>
    );
  }

  const hasAny = data.pollingLocations.length || data.earlyVoteSites.length || data.dropOffLocations.length;

  return (
    <div className="mt-5">
      <div className="mb-1 font-display text-base font-bold">{data.locationLabel}</div>
      {data.electionName && (
        <div className="mb-4 text-sm text-muted">
          {data.electionName}
          {data.electionDay && ` — ${data.electionDay}`}
        </div>
      )}

      {!hasAny && (
        <p className="text-sm text-muted">
          An election was found for this address, but no specific voting
          locations have been published yet. Check back closer to Election
          Day.
        </p>
      )}

      <SiteGroup title="Polling places" icon="📍" sites={data.pollingLocations} />
      <SiteGroup title="Early voting sites" icon="🗳" sites={data.earlyVoteSites} />
      <SiteGroup title="Ballot drop-off locations" icon="📥" sites={data.dropOffLocations} />

      {data.finderUrl && (
        <a
          href={data.finderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-terracotta underline"
        >
          See more on your local election office's website &rarr;
        </a>
      )}
    </div>
  );
}

function SiteGroup({ title, icon, sites }: { title: string; icon: string; sites: VoteSite[] }) {
  if (sites.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="mb-2 text-sm font-bold uppercase tracking-wide text-navy">
        {icon} {title}
      </div>
      <div className="flex flex-col gap-2.5">
        {sites.map((site, i) => (
          <div key={i} className="rounded-xl bg-cream p-4">
            <div className="text-base font-semibold text-navy">{site.name}</div>
            <div className="text-sm text-muted">{site.address}</div>
            {site.hours && <div className="mt-1 text-sm text-muted">Hours: {site.hours}</div>}
            {(site.startDate || site.endDate) && (
              <div className="mt-1 text-sm text-muted">
                {site.startDate && `Opens ${site.startDate}`}
                {site.startDate && site.endDate && ' — '}
                {site.endDate && `Closes ${site.endDate}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
