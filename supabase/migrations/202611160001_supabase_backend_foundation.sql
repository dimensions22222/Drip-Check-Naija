-- Add account-scoped Studio data without replacing the existing demo/game schema.
alter table public.player_profiles rename column handle to username;
alter table public.player_profiles add column country text;
alter table public.player_profiles add column updated_at timestamptz not null default now();
alter table public.player_profiles alter column bio drop not null;
alter table public.player_profiles drop constraint if exists player_profiles_username_check;
alter table public.player_profiles add constraint player_profiles_username_check
  check (char_length(username) between 3 and 20 and username ~ '^[A-Za-z0-9_]+$') not valid;
alter table public.player_profiles add constraint player_profiles_country_length_check
  check (country is null or char_length(country) <= 80) not valid;

create table public.avatars (
  user_id uuid primary key references auth.users(id) on delete cascade,
  character_type text not null check (character_type in ('femme', 'masc')),
  appearance_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_inventory drop constraint if exists player_inventory_item_id_fkey;
alter table public.player_inventory drop constraint if exists player_inventory_pkey;

alter table public.fashion_items rename column id to slug;
alter table public.fashion_items drop constraint fashion_items_pkey;
alter table public.fashion_items add column id uuid not null default gen_random_uuid();
alter table public.fashion_items add constraint fashion_items_pkey primary key (id);
alter table public.fashion_items add constraint fashion_items_slug_key unique (slug);
alter table public.fashion_items add column asset_path text;
alter table public.fashion_items add column thumbnail_path text;
alter table public.fashion_items add column active boolean not null default true;
alter table public.fashion_items add column created_at timestamptz not null default now();
alter table public.fashion_items add column updated_at timestamptz not null default now();
alter table public.fashion_items alter column metadata set default '{}'::jsonb;
alter table public.fashion_items alter column metadata set not null;
update public.fashion_items set active = false where slug = 'acc-chain';

alter table public.player_inventory add column fashion_item_id uuid;
update public.player_inventory inventory
set fashion_item_id = item.id
from public.fashion_items item
where item.slug = inventory.item_id;
alter table public.player_inventory alter column fashion_item_id set not null;
alter table public.player_inventory drop column item_id;
alter table public.player_inventory add constraint player_inventory_fashion_item_id_fkey
  foreign key (fashion_item_id) references public.fashion_items(id) on delete restrict;
alter table public.player_inventory add constraint player_inventory_pkey primary key (user_id, fashion_item_id);
alter table public.player_inventory add column source text not null default 'legacy';
create index player_inventory_owner_idx on public.player_inventory(user_id);

alter table public.outfits add column appearance_config jsonb not null default '{}'::jsonb;
alter table public.outfits add constraint outfits_equipped_items_object
  check (jsonb_typeof(equipped_items) = 'object');
alter table public.outfits add constraint outfits_appearance_config_object
  check (jsonb_typeof(appearance_config) = 'object');
create index outfits_owner_updated_at_idx on public.outfits(user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row execute function public.set_updated_at();

create trigger avatars_set_updated_at
before update on public.avatars
for each row execute function public.set_updated_at();

create trigger fashion_items_set_updated_at
before update on public.fashion_items
for each row execute function public.set_updated_at();

create trigger outfits_set_updated_at
before update on public.outfits
for each row execute function public.set_updated_at();

create or replace function public.validate_outfit_catalog_items()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  item_slot text;
  item_slug text;
begin
  for item_slot, item_slug in
    select key, value from jsonb_each_text(new.equipped_items)
  loop
    if item_slot not in ('hair', 'top', 'bottom', 'shoes', 'chain', 'earrings', 'glasses', 'watch', 'bag') then
      raise exception 'Unsupported outfit item slot: %', item_slot using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.fashion_items item
      where item.slug = item_slug
        and item.category = item_slot
        and item.active
        and (item.metadata -> 'characters') ? new.character_type
    ) then
      raise exception 'Outfit item % is unavailable for % in slot %', item_slug, new.character_type, item_slot
        using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;

create trigger outfits_validate_catalog_items
before insert or update of equipped_items, character_type on public.outfits
for each row execute function public.validate_outfit_catalog_items();

create or replace function public.ensure_player_profile(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  candidate_username text;
  attempt integer := 0;
  target_uuid text := replace(target_user_id::text, '-', '');
begin
  loop
    candidate_username := 'p_' || substr(target_uuid, 1, 14) || lpad(attempt::text, 4, '0');
    begin
      insert into public.player_profiles (user_id, username)
      values (target_user_id, candidate_username)
      on conflict (user_id) do nothing;
      return;
    exception when unique_violation then
      if exists (select 1 from public.player_profiles where user_id = target_user_id) then
        return;
      end if;
      attempt := attempt + 1;
      if attempt > 9999 then
        raise exception 'Could not allocate a unique player username for user %', target_user_id;
      end if;
    end;
  end loop;
end;
$$;

create or replace function public.create_player_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.ensure_player_profile(new.id);
  return new;
end;
$$;

do $$
declare
  existing_user record;
begin
  for existing_user in select id from auth.users
  loop
    perform public.ensure_player_profile(existing_user.id);
  end loop;
end;
$$;

create trigger on_auth_user_created_player_profile
after insert on auth.users
for each row execute function public.create_player_profile_for_new_user();
revoke all on function public.ensure_player_profile(uuid) from public, anon, authenticated;

alter table public.player_profiles enable row level security;
alter table public.avatars enable row level security;
alter table public.fashion_items enable row level security;
alter table public.player_inventory enable row level security;
alter table public.outfits enable row level security;

drop policy if exists "profiles readable" on public.player_profiles;
drop policy if exists "profiles self update" on public.player_profiles;
create policy "profiles owner read" on public.player_profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "profiles owner insert" on public.player_profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "profiles owner update" on public.player_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "avatars owner access" on public.avatars
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "items readable" on public.fashion_items;
create policy "active fashion catalogue readable" on public.fashion_items
  for select to anon, authenticated using (active = true);

drop policy if exists "inventory own" on public.player_inventory;
create policy "inventory owner read" on public.player_inventory
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.player_profiles, public.avatars, public.fashion_items, public.player_inventory, public.outfits from public, anon, authenticated;
grant select on public.player_profiles to authenticated;
grant insert (user_id, username, bio, country) on public.player_profiles to authenticated;
grant update (username, bio, country) on public.player_profiles to authenticated;
grant select, insert, update, delete on public.avatars to authenticated;
grant select on public.fashion_items to anon, authenticated;
grant select on public.player_inventory to authenticated;
grant select, insert, update, delete on public.outfits to authenticated;

-- Existing battle, vote and ledger RLS policies are deliberately unchanged.
