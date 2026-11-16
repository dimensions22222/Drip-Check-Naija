-- DRIP CHECK NAIJA initial trusted-data model. Apply with Supabase CLI.
create extension if not exists "pgcrypto";
create table public.player_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check (char_length(handle) between 3 and 20),
 bio text not null default '' check (char_length(bio) <= 280), level integer not null default 1 check (level > 0),
 xp integer not null default 0 check (xp >= 0), created_at timestamptz not null default now()
);
create table public.fashion_items (
 id text primary key, name text not null, category text not null,
 rarity text not null check (rarity in ('Common','Rare','Epic')), price integer not null default 0 check (price >= 0),
 metadata jsonb not null default '{}'::jsonb
);
create table public.player_inventory (
 user_id uuid references auth.users(id) on delete cascade, item_id text references public.fashion_items(id),
 acquired_at timestamptz not null default now(), primary key (user_id,item_id)
);
create table public.outfits (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 28), character_type text not null check (character_type in ('femme','masc')),
 equipped_items jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.battles (
 id uuid primary key default gen_random_uuid(), theme text not null, brief text not null, starts_at timestamptz not null,
 ends_at timestamptz not null, status text not null check (status in ('upcoming','active','closed')),
 rules jsonb not null default '{"community":70,"relevance":20,"creativity":10}'::jsonb, check (ends_at > starts_at)
);
create table public.battle_entries (
 id uuid primary key default gen_random_uuid(), battle_id uuid not null references public.battles(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, outfit_id uuid not null references public.outfits(id),
 submitted_at timestamptz not null default now(), unique (battle_id,user_id)
);
create table public.votes (
 id uuid primary key default gen_random_uuid(), battle_id uuid not null references public.battles(id) on delete cascade,
 voter_id uuid not null references auth.users(id) on delete cascade, entry_id uuid not null references public.battle_entries(id) on delete cascade,
 created_at timestamptz not null default now(), unique (battle_id,voter_id)
);
create table public.wallet_transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 currency text not null check (currency in ('coins','gems')), amount integer not null check (amount <> 0),
 type text not null, reference text, created_at timestamptz not null default now()
);
create index outfits_owner on public.outfits(user_id); create index entries_battle on public.battle_entries(battle_id);
create index votes_entry on public.votes(entry_id); create index wallet_owner_time on public.wallet_transactions(user_id,created_at desc);
alter table public.player_profiles enable row level security; alter table public.fashion_items enable row level security;
alter table public.player_inventory enable row level security; alter table public.outfits enable row level security;
alter table public.battles enable row level security; alter table public.battle_entries enable row level security;
alter table public.votes enable row level security; alter table public.wallet_transactions enable row level security;
create policy "profiles readable" on public.player_profiles for select using (true);
create policy "profiles self update" on public.player_profiles for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "items readable" on public.fashion_items for select using (true);
create policy "inventory own" on public.player_inventory for select using (auth.uid()=user_id);
create policy "outfits own" on public.outfits for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "battles readable" on public.battles for select using (true);
create policy "entries readable" on public.battle_entries for select using (true);
create policy "votes own readable" on public.votes for select using (auth.uid()=voter_id);
create policy "ledger own readable" on public.wallet_transactions for select using (auth.uid()=user_id);
-- Browser inserts for inventory, entries, votes and currency remain disabled.
