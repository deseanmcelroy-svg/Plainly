# Plainly

A civic-education web app that helps people understand what's on their ballot —
races, measures, and key election dates — explained in plain language, by location.

This is a Next.js (App Router) + TypeScript + Tailwind CSS project, converted from
the original single-page prototype. It currently runs end-to-end on **placeholder
data** so you can develop and deploy it immediately, then swap in real data sources.

## Project structure

```
app/
  layout.tsx          Root layout, fonts, AuthProvider wrapper
  page.tsx            Main page — wires all sections together
  globals.css         Tailwind + small custom styles
  api/
    ballot/route.ts   GET /api/ballot?location=... (live data + sample fallback)
    profile/route.ts  GET/PATCH saved location & reminder preference
    cron/reminders/route.ts  Daily job: emails users about upcoming election dates
  auth/
    callback/route.ts Handles Supabase magic-link redirect

components/
  Header.tsx          Top bar with logo + menu button
  SlideMenu.tsx       Slide-out menu (sign in, saved location, settings, help)
  Hero.tsx            Location search form
  BallotSummary.tsx   "Showing your ballot for X" summary card
  ElectionCalendar.tsx Month calendar + upcoming dates list
  Countdown.tsx       Live countdown to next election
  RaceList.tsx        Filterable, expandable list of races & measures
  HowItWorks.tsx      3-step explainer
  VoterChecklist.tsx  Voter readiness checklist
  Footer.tsx
  auth/
    SignInForm.tsx    Magic-link sign-in form

lib/
  types.ts            Shared TypeScript types (BallotItem, CalendarEvent, etc.)
  data.ts             getBallotForLocation() — live API with sample fallback
  civicApi.ts         Google Civic Information API integration
  auth.tsx            Client-side auth context/provider
  email/
    reminders.ts      Resend integration for election reminder emails
  supabase/
    client.ts         Supabase client for client components
    server.ts          Supabase client for server components/route handlers
    admin.ts           Service-role client for the reminders cron job

middleware.ts         Refreshes Supabase auth session cookies
supabase/schema.sql   Database schema (profiles table, RLS policies)
vercel.json           Cron schedule for /api/cron/reminders
```

## Running locally

Requires Node.js 18.18+ (Node 20 LTS recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How the data flows right now

1. User submits a location in the `Hero` search form.
2. The page calls `GET /api/ballot?location=...`.
3. The API route calls `getBallotForLocation()` in `lib/data.ts`, which:
   - Calls `fetchCivicBallot()` in `lib/civicApi.ts` — a real integration with
     the **Google Civic Information API**.
   - If that returns data (an active election exists for the address and
     `CIVIC_DATA_API_KEY` is set), it's used directly, marked `source: 'live'`.
   - Otherwise, falls back to `SAMPLE_BALLOT`, marked `source: 'sample'`. The
     UI shows a small note when sample data is being displayed.
4. The response (shape defined in `lib/types.ts`) is rendered by `BallotSummary`,
   `ElectionCalendar`, `Countdown`, and `RaceList`.

## Real data: Google Civic Information API (already wired up)

`lib/civicApi.ts` calls the Civic Information API's `voterInfoQuery` endpoint
and maps its response into the app's `LocationBallot` shape — candidates,
referenda, polling/early-voting dates, and election day are all mapped
automatically.

**To enable it:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create (or select) a project.
2. Enable the **Civic Information API** (APIs & Services → Library → search
   "Civic Information API" → Enable).
3. Create an API key (APIs & Services → Credentials → Create credentials →
   API key). Optionally restrict it to the Civic Information API.
4. Copy `.env.example` to `.env.local` and set:
   ```
   CIVIC_DATA_API_KEY=your_key_here
   ```
5. Restart `npm run dev`.

**Important limitation:** this API mainly returns ballot/contest data during
active election windows supported by the Voting Information Project. For most
addresses, most of the time, it will return no contests — the app then falls
back to sample data automatically. This is normal, not a bug. As real
elections approach, addresses in those areas will start returning live data.

### Filling remaining gaps

The Civic API doesn't cover everything (plain-language ballot measure
explanations, candidate bios, year-round registration deadlines for every
state, etc.). For a fuller picture, layer in:

- **Ballotpedia** — data services/partnerships for candidate and measure info,
  including plain-language summaries of ballot measures.
- **Vote411 (League of Women Voters)** — licensable civic data, strong on
  candidate guides.
- **Your state's Secretary of State** — open data for registration deadlines,
  polling places, and candidate filings, often available year-round (unlike
  the Civic API's election-window limitation).

These can be added as additional calls inside `getBallotForLocation()`,
merging their results into the same `LocationBallot` shape.

Copy `.env.example` to `.env.local` and fill in API keys as you add them:

```bash
cp .env.example .env.local
```

`.env.local` is gitignored, so your keys won't be committed.

## Accounts & saved locations (already wired up)

Sign-in, saved locations, and the election-reminders toggle are built using
**Supabase** (free tier — includes Postgres + auth with magic-link email).

**To enable it:**

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to the **SQL Editor** and run the contents of
   `supabase/schema.sql` — this creates a `profiles` table (saved location,
   reminder preference) with Row Level Security so users can only see their
   own data.
3. Go to **Project Settings → API** and copy the Project URL and `anon` public
   key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. By default, Supabase email auth requires a valid SMTP setup for magic
   links in production — for local development, Supabase's built-in email
   service works out of the box. Restart `npm run dev`.

**How it works once enabled:**

- The slide-out menu shows a "Sign in" form (magic link — no password).
- Once signed in, searching for a ballot saves that location to the user's
  profile (`app/page.tsx` calls `PATCH /api/profile`).
- On future visits, a signed-in user's saved location is looked up
  automatically.
- The "Election reminders" toggle in the menu updates
  `election_reminders_enabled` on the user's profile.

**Without Supabase configured**, the app works exactly as before — fully
functional as a guest experience, with the sign-in UI showing a short message
that accounts aren't set up yet.

### Election reminder emails (already wired up)

A daily cron job checks every user with reminders enabled and emails them if
their saved location has election dates coming up in the next 7 days.

**To enable it:**

1. Create a free account at [resend.com](https://resend.com) and get an API
   key.
2. Add to `.env.local`:
   ```
   RESEND_API_KEY=your_key_here
   EMAIL_FROM_ADDRESS="Plainly <onboarding@resend.dev>"
   ```
   (The `onboarding@resend.dev` address works for testing without verifying
   your own domain, but only delivers to the email on your Resend account.
   Verify a domain in Resend for production use.)
3. Get your Supabase **service role key** (Project Settings → API →
   `service_role` — keep this secret) and add it:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Set a random string as `CRON_SECRET` — this protects the cron endpoint
   from being triggered by anyone else:
   ```
   CRON_SECRET=some-long-random-string
   ```
5. `vercel.json` already defines a daily schedule (1pm UTC) for
   `/api/cron/reminders`. Once deployed to Vercel with the env vars above
   set in your project settings, Vercel Cron runs it automatically — no
   extra setup.

**How it works:** `/api/cron/reminders` (in `app/api/cron/reminders/route.ts`)
uses the Supabase service role key to read all profiles with
`election_reminders_enabled = true`, looks up each saved location via
`getBallotForLocation()`, and emails anyone with calendar events in the next
7 days via `lib/email/reminders.ts`.

**Without RESEND_API_KEY set**, the job runs but logs what it would have sent
instead of sending real email — safe for local development.

**To test locally** without waiting for the cron schedule, run the dev server
and visit `http://localhost:3000/api/cron/reminders` directly (if `CRON_SECRET`
is unset, no auth header is required locally).

## Deployment

The easiest path for a Next.js app:

1. Push this project to a GitHub repository.
2. Create a free account at [vercel.com](https://vercel.com) and import the repo.
3. Vercel auto-detects Next.js — no config needed for the first deploy.
4. In the Vercel project's **Settings → Environment Variables**, add every
   variable you've set in `.env.local`. At minimum for a fully-featured
   deployment:

   | Variable | From |
   |---|---|
   | `CIVIC_DATA_API_KEY` | Google Cloud Console |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
   | `RESEND_API_KEY` | Resend dashboard |
   | `EMAIL_FROM_ADDRESS` | Your verified Resend sender |
   | `CRON_SECRET` | Any random string you generate |

   The app works with none of these set (guest mode, sample data, no
   reminders) — add them incrementally as you enable each feature.
5. In Supabase, go to **Authentication → URL Configuration** and add your
   Vercel deployment URL (e.g. `https://your-app.vercel.app`) to both the
   Site URL and Redirect URLs, so magic-link emails redirect correctly.
6. Every push to your main branch redeploys automatically. `vercel.json`'s
   cron schedule activates automatically once deployed.

For a custom domain, buy one from any registrar (Namecheap, Cloudflare, etc.) and
point it at Vercel via the instructions in your Vercel project's Domains tab.
Remember to also add the custom domain to Supabase's Redirect URLs.

## Accessibility & nonpartisanship

Since this is a civic tool:

- Keep all candidate/measure descriptions factual and balanced — avoid editorial
  language. The footer already states this commitment; keep it true in the data.
- Run an accessibility check (Lighthouse, axe DevTools) before launch — civic
  tools should meet WCAG 2.1 AA at minimum.
- Add a privacy policy before storing any user location or account data.

## Notes on the current placeholder data

`lib/data.ts` contains one sample ballot (`SAMPLE_BALLOT`) for "North Canton, OH"
with sample races, measures, and dates for November 2026. Every candidate name is
a placeholder (`Candidate A` / `Candidate B`) — replace with real data before
sharing publicly.

## Going-live checklist

Everything below is already built — this is the order to turn each piece on:

- [ ] `npm install && npm run dev` — confirm the app runs with sample data
- [ ] Get a **Civic Information API** key → set `CIVIC_DATA_API_KEY` →
      confirm an address near an active election returns `source: 'live'`
- [ ] Create a **Supabase** project → run `supabase/schema.sql` → set
      `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` →
      confirm sign-in (magic link) works
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` and a **Resend** `RESEND_API_KEY` →
      visit `/api/cron/reminders` locally → confirm it logs/sends correctly
- [ ] Set `CRON_SECRET` to a random string
- [ ] Push to GitHub → import into **Vercel** → add all env vars from the
      table above
- [ ] In Supabase, add your Vercel URL to Authentication → Redirect URLs
- [ ] Replace `SAMPLE_BALLOT` candidate names and verify all copy is factual
      and nonpartisan before sharing publicly
- [ ] Run an accessibility pass (Lighthouse / axe) and add a privacy policy
      before storing real user data
- [ ] (Optional) Add a custom domain in Vercel, and add it to Supabase's
      Redirect URLs too

At that point the app is a real, deployed, civic-education tool: live ballot
data where available, accounts with saved locations, and automated election
reminders.
