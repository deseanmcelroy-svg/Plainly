-- ===========================================================================
-- Plainly — Supabase schema
--
-- Run this in your Supabase project's SQL Editor (Database -> SQL Editor)
-- after creating the project. It creates a `profiles` table for saved
-- locations and notification preferences, keeps it in sync with
-- auth.users, and locks it down with Row Level Security so each user can
-- only read/write their own row.
-- ===========================================================================

-- One row per user, mirroring auth.users
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  saved_location text,
  election_reminders_enabled boolean not null default true,
  notify_email text,
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
