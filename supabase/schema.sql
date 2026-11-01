-- =============================================================================
-- Agrimitra - Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- It creates the farmer profile + chat tables and Row Level Security policies
-- so each authenticated farmer can only read/write their own data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- farmer_profiles: one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.farmer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default '',
  location text,
  crop_type text not null default '',
  soil_type text not null default '',
  land_size real not null default 0,
  land_unit text not null default '',
  irrigation text not null default '',
  website_language text not null default 'en',
  chatbot_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- chat_messages: conversation history per user
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sender text not null,                 -- 'farmer' | 'bot'
  message text not null,
  original_language text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_id_created_at_idx
  on public.chat_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.farmer_profiles enable row level security;
alter table public.chat_messages enable row level security;

-- farmer_profiles policies
drop policy if exists "Users read own profile" on public.farmer_profiles;
create policy "Users read own profile"
  on public.farmer_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own profile" on public.farmer_profiles;
create policy "Users insert own profile"
  on public.farmer_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own profile" on public.farmer_profiles;
create policy "Users update own profile"
  on public.farmer_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own profile" on public.farmer_profiles;
create policy "Users delete own profile"
  on public.farmer_profiles for delete
  using (auth.uid() = user_id);

-- chat_messages policies
drop policy if exists "Users read own messages" on public.chat_messages;
create policy "Users read own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own messages" on public.chat_messages;
create policy "Users insert own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own messages" on public.chat_messages;
create policy "Users delete own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- Note: the backend uses the SERVICE ROLE key which bypasses RLS. These policies
-- protect the data if you ever query Supabase directly from the browser with the
-- anon key.
