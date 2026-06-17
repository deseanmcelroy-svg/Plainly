-- ===========================================================================
-- Plainly — Supabase schema
--
-- Run this in your Supabase project's SQL Editor (Database -> SQL Editor)
-- after creating the project. It creates a `profiles` table for saved
-- locations and notification preferences, keeps it in sync with
-- auth.users, and locks it down with Row Level Security so each user can
-- only read/write their own row.
--
-- IF YOU ALREADY RAN AN EARLIER VERSION OF THIS SCHEMA: `create table if
-- not exists` won't add new columns to an existing table. Run this instead
-- to add the household-profile columns introduced for impact estimates:
--
--   alter table public.profiles
--     add column if not exists age_range text
--       check (age_range in ('18-24','25-34','35-44','45-54','55-64','65+')),
--     add column if not exists housing_status text
--       check (housing_status in ('rent','own')),
--     add column if not exists home_value_range text
--       check (home_value_range in ('under_150k','150k_300k','300k_500k','500k_plus')),
--     add column if not exists household_income_range text
--       check (household_income_range in ('under_40k','40k_80k','80k_120k','120k_plus')),
--     add column if not exists has_school_age_kids boolean;
-- ===========================================================================

-- One row per user, mirroring auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  saved_location text,
  election_reminders_enabled boolean not null default true,
  notify_email text,
  -- ---------------------------------------------------------------------
  -- Optional household profile, used only to show estimated impacts of
  -- ballot measures (e.g. "this would cost a household like yours about
  -- $X/year"). Stored as broad brackets, never exact figures, and never
  -- required — all four are nullable and user-editable on /profile.
  -- ---------------------------------------------------------------------
  age_range text check (age_range in ('18-24','25-34','35-44','45-54','55-64','65+')),
  housing_status text check (housing_status in ('rent','own')),
  home_value_range text check (home_value_range in ('under_150k','150k_300k','300k_500k','500k_plus')),
  household_income_range text check (household_income_range in ('under_40k','40k_80k','80k_120k','120k_plus')),
  has_school_age_kids boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Automatically create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, notify_email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Row Level Security: users can only see/edit their own profile
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ===========================================================================
-- Ballot waitlist
--
-- Stores emails of users who want to be notified when real ballot data
-- is available for their area. One entry per email — duplicates rejected.
-- ===========================================================================

create table if not exists public.ballot_waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  zip text not null,
  created_at timestamptz not null default now(),
  constraint ballot_waitlist_email_key unique (email)
);

alter table public.ballot_waitlist enable row level security;

drop policy if exists "Anyone can join waitlist" on public.ballot_waitlist;
create policy "Anyone can join waitlist"
  on public.ballot_waitlist for insert
  with check (true);
--
-- Anonymized practice ballot submissions used to show community stats
-- (e.g. "68% of Plainly users in your area voted YES on the school levy").
--
-- NO personal data is stored here -- no user ID, no name, no email.
-- Only: a normalized ZIP code, ballot item ID and title, the selection
-- (yes/no for measures, candidate name for races), and a timestamp.
--
-- RLS: anyone can insert (anonymous) and select (to read aggregate stats).
-- We never expose individual rows to users -- only aggregates via the API.
--
-- TO ADD THIS TABLE to an existing database, run:
--   (just run the create table statement below -- no migration needed
--    since this is a brand new table)
-- ===========================================================================

create table if not exists public.community_votes (
  id bigint generated always as identity primary key,
  zip text not null,
  item_id text not null,
  item_title text not null,
  item_level text not null check (item_level in ('local', 'state', 'federal')),
  selection text not null,
  created_at timestamptz not null default now()
);

-- Index for fast aggregate queries by zip + item
create index if not exists community_votes_zip_item
  on public.community_votes (zip, item_id);

-- RLS: open insert (anonymous submissions) and select (for aggregate stats)
alter table public.community_votes enable row level security;

drop policy if exists "Anyone can submit community votes" on public.community_votes;
create policy "Anyone can submit community votes"
  on public.community_votes for insert
  with check (true);

drop policy if exists "Anyone can read community votes" on public.community_votes;
create policy "Anyone can read community votes"
  on public.community_votes for select
  using (true);

-- ===========================================================================
-- Ballot waitlist
--
-- Stores email + ZIP for users who want to be notified when real ballot
-- data is available for their area. No user ID needed — works for anyone.
-- TO ADD: run this in Supabase SQL Editor.
-- ===========================================================================

create table if not exists public.ballot_waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  zip text not null,
  created_at timestamptz not null default now()
);

create index if not exists ballot_waitlist_zip on public.ballot_waitlist (zip);
create index if not exists ballot_waitlist_email on public.ballot_waitlist (email);

alter table public.ballot_waitlist enable row level security;

drop policy if exists "Anyone can join waitlist" on public.ballot_waitlist;
create policy "Anyone can join waitlist"
  on public.ballot_waitlist for insert
  with check (true);
