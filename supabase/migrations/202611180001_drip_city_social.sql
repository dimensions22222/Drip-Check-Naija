-- Public identity is deliberately separate from auth.users IDs.
alter table public.player_profiles
  add column public_id uuid not null default gen_random_uuid();
create unique index player_profiles_public_id_key on public.player_profiles(public_id);
alter table public.avatars
  add column public_display boolean not null default false;

create table public.player_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references public.player_profiles(public_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);
create index player_follows_following_idx on public.player_follows(following_id, created_at desc);

create table public.outfit_showcases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid not null unique references public.outfits(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  published_at timestamptz not null default now()
);
create index outfit_showcases_published_idx on public.outfit_showcases(published_at desc);

create table public.outfit_likes (
  showcase_id uuid not null references public.outfit_showcases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (showcase_id, user_id)
);
create index outfit_likes_user_idx on public.outfit_likes(user_id, created_at desc);

alter table public.player_follows enable row level security;
alter table public.player_follows force row level security;
alter table public.outfit_showcases enable row level security;
alter table public.outfit_showcases force row level security;
alter table public.outfit_likes enable row level security;
alter table public.outfit_likes force row level security;

-- These views intentionally expose only curated public profile/showcase fields.
create view public.public_player_profiles with (security_barrier = true) as
select
  profile.public_id,
  profile.username,
  profile.bio,
  profile.level,
  profile.xp,
  avatar.character_type as avatar_character_type,
  avatar.appearance_config -> 'looks' -> avatar.character_type as avatar_appearance_config,
  (select count(*)::integer from public.player_follows follow
    where follow.following_id = profile.public_id) as follower_count,
  (select count(*)::integer from public.player_follows follow
    join public.player_profiles followed on followed.user_id = follow.follower_id
    where followed.public_id = profile.public_id) as following_count,
  exists (select 1 from public.player_follows follow
    where follow.follower_id = auth.uid() and follow.following_id = profile.public_id) as viewer_follows
from public.player_profiles profile
left join public.avatars avatar
  on avatar.user_id = profile.user_id and avatar.public_display
  and not exists (
    select 1
    from jsonb_each_text(avatar.appearance_config -> 'looks' -> avatar.character_type) worn
    where worn.key in ('hair', 'top', 'bottom', 'shoes', 'chain', 'earrings', 'glasses', 'watch', 'bag')
      and not exists (
        select 1 from public.fashion_items item
        where item.slug = worn.value and item.category = worn.key and item.active
          and (item.metadata -> 'characters') ? avatar.character_type
          and (item.price = 0 or exists (
            select 1 from public.player_inventory inventory
            where inventory.user_id = avatar.user_id and inventory.fashion_item_id = item.id
          ))
      )
  );

create view public.public_outfit_showcases with (security_barrier = true) as
select
  showcase.id,
  profile.public_id as player_public_id,
  profile.username,
  showcase.title,
  outfit.character_type,
  outfit.equipped_items,
  outfit.appearance_config,
  showcase.published_at,
  (select count(*)::integer from public.outfit_likes likes
    where likes.showcase_id = showcase.id) as like_count,
  exists (select 1 from public.outfit_likes likes
    where likes.showcase_id = showcase.id and likes.user_id = auth.uid()) as viewer_liked
from public.outfit_showcases showcase
join public.player_profiles profile on profile.user_id = showcase.owner_id
join public.outfits outfit on outfit.id = showcase.outfit_id
where outfit.user_id = showcase.owner_id
  and not exists (
    select 1
    from jsonb_each_text(outfit.equipped_items) worn
    where not exists (
      select 1 from public.fashion_items item
      where item.slug = worn.value and item.category = worn.key and item.active
        and (item.metadata -> 'characters') ? outfit.character_type
        and (item.price = 0 or exists (
          select 1 from public.player_inventory inventory
          where inventory.user_id = showcase.owner_id and inventory.fashion_item_id = item.id
        ))
    )
  );

create function public.set_player_follow(target_public_id uuid, should_follow boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  viewer_public_id uuid;
begin
  if viewer_id is null then
    raise exception 'Sign in to follow players.' using errcode = '28000';
  end if;
  select profile.public_id into viewer_public_id
  from public.player_profiles profile where profile.user_id = viewer_id;
  if viewer_public_id is null or viewer_public_id = target_public_id then
    raise exception 'You cannot follow yourself.' using errcode = '22023';
  end if;
  if should_follow then
    insert into public.player_follows (follower_id, following_id)
    values (viewer_id, target_public_id)
    on conflict (follower_id, following_id) do nothing;
    if not found and not exists (
      select 1 from public.player_profiles profile where profile.public_id = target_public_id
    ) then
      raise exception 'Player not found.' using errcode = '22023';
    end if;
  else
    delete from public.player_follows
    where follower_id = viewer_id and following_id = target_public_id;
  end if;
end;
$$;

create function public.set_outfit_showcase_like(target_showcase_id uuid, should_like boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
begin
  if viewer_id is null then
    raise exception 'Sign in to like outfits.' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.outfit_showcases showcase
    where showcase.id = target_showcase_id
      and showcase.owner_id <> viewer_id
  ) then
    if exists (select 1 from public.outfit_showcases where id = target_showcase_id and owner_id = viewer_id) then
      raise exception 'You cannot like your own outfit.' using errcode = '22023';
    end if;
    raise exception 'Showcase outfit not found.' using errcode = '22023';
  end if;
  if should_like then
    insert into public.outfit_likes (showcase_id, user_id)
    values (target_showcase_id, viewer_id)
    on conflict (showcase_id, user_id) do nothing;
  else
    delete from public.outfit_likes
    where showcase_id = target_showcase_id and user_id = viewer_id;
  end if;
end;
$$;

create function public.get_player_connections(target_public_id uuid, connection_type text)
returns table(public_id uuid, username text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to view player connections.' using errcode = '28000';
  end if;
  if connection_type = 'followers' then
    return query
      select profile.public_id, profile.username
      from public.player_follows follow
      join public.player_profiles profile on profile.user_id = follow.follower_id
      where follow.following_id = target_public_id
      order by follow.created_at desc
      limit 100;
  elsif connection_type = 'following' then
    return query
      select profile.public_id, profile.username
      from public.player_follows follow
      join public.player_profiles profile on profile.public_id = follow.following_id
      join public.player_profiles viewer on viewer.user_id = follow.follower_id
      where viewer.public_id = target_public_id
      order by follow.created_at desc
      limit 100;
  else
    raise exception 'Unsupported connection type.' using errcode = '22023';
  end if;
end;
$$;

create function public.publish_outfit_showcase(target_outfit_id uuid, showcase_title text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  outfit_row public.outfits%rowtype;
  item_slot text;
  item_slug text;
  item_row public.fashion_items%rowtype;
  showcase_id uuid;
  clean_title text := btrim(showcase_title);
begin
  if viewer_id is null then
    raise exception 'Sign in to publish an outfit.' using errcode = '28000';
  end if;
  if clean_title is null or char_length(clean_title) not between 1 and 40 then
    raise exception 'Showcase titles must be 1 to 40 characters.' using errcode = '22023';
  end if;
  select outfit.* into outfit_row from public.outfits outfit
  where outfit.id = target_outfit_id and outfit.user_id = viewer_id;
  if not found then
    raise exception 'Saved outfit not found.' using errcode = '22023';
  end if;
  for item_slot, item_slug in
    select key, value from jsonb_each_text(outfit_row.equipped_items)
  loop
    select item.* into item_row from public.fashion_items item
    where item.slug = item_slug and item.category = item_slot and item.active
      and (item.metadata -> 'characters') ? outfit_row.character_type;
    if not found or (item_row.price > 0 and not exists (
      select 1 from public.player_inventory inventory
      where inventory.user_id = viewer_id and inventory.fashion_item_id = item_row.id
    )) then
      raise exception 'Outfit contains a fashion item that is not available to this player.'
        using errcode = '23514';
    end if;
  end loop;

  insert into public.outfit_showcases (owner_id, outfit_id, title)
  values (viewer_id, target_outfit_id, clean_title)
  on conflict (outfit_id) do update
    set title = excluded.title, published_at = now()
  returning id into showcase_id;
  return showcase_id;
end;
$$;

create function public.remove_outfit_showcase(target_showcase_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to remove a showcase outfit.' using errcode = '28000';
  end if;
  delete from public.outfit_showcases
  where id = target_showcase_id and owner_id = auth.uid();
end;
$$;

create function public.set_avatar_public_display(should_be_public boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to change avatar visibility.' using errcode = '28000';
  end if;
  update public.avatars set public_display = should_be_public where user_id = auth.uid();
  if not found then
    raise exception 'Save your avatar before changing its visibility.' using errcode = '22023';
  end if;
end;
$$;

create function public.validate_public_avatar_items()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  selected_look jsonb;
  item_slot text;
  item_slug text;
  item_row public.fashion_items%rowtype;
begin
  if not new.public_display then
    return new;
  end if;
  selected_look := new.appearance_config -> 'looks' -> new.character_type;
  if jsonb_typeof(selected_look) is distinct from 'object' then
    raise exception 'A valid saved look is required before sharing an avatar.'
      using errcode = '23514';
  end if;
  foreach item_slot in array array['hair', 'top', 'bottom', 'shoes', 'chain', 'earrings', 'glasses', 'watch', 'bag']
  loop
    item_slug := selected_look ->> item_slot;
    if item_slug is null then
      raise exception 'The public avatar is missing the % item.', item_slot
        using errcode = '23514';
    end if;
    select item.* into item_row from public.fashion_items item
    where item.slug = item_slug and item.category = item_slot and item.active
      and (item.metadata -> 'characters') ? new.character_type;
    if not found or (item_row.price > 0 and not exists (
      select 1 from public.player_inventory inventory
      where inventory.user_id = new.user_id and inventory.fashion_item_id = item_row.id
    )) then
      raise exception 'The public avatar contains a fashion item that is not available to this player.'
        using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;

create trigger avatars_validate_public_items
before insert or update of appearance_config, character_type, public_display
on public.avatars
for each row execute function public.validate_public_avatar_items();

revoke all on public.player_follows, public.outfit_showcases, public.outfit_likes from public, anon, authenticated;
revoke all on public.public_player_profiles, public.public_outfit_showcases from public, anon, authenticated;
grant select on public.public_player_profiles, public.public_outfit_showcases to anon, authenticated;
revoke insert, update on public.avatars from authenticated;
grant insert (user_id, character_type, appearance_config) on public.avatars to authenticated;
grant update (user_id, character_type, appearance_config) on public.avatars to authenticated;
revoke all on function public.set_player_follow(uuid, boolean) from public, anon, authenticated;
revoke all on function public.set_outfit_showcase_like(uuid, boolean) from public, anon, authenticated;
revoke all on function public.get_player_connections(uuid, text) from public, anon, authenticated;
revoke all on function public.publish_outfit_showcase(uuid, text) from public, anon, authenticated;
revoke all on function public.remove_outfit_showcase(uuid) from public, anon, authenticated;
revoke all on function public.set_avatar_public_display(boolean) from public, anon, authenticated;
revoke all on function public.validate_public_avatar_items() from public, anon, authenticated;
grant execute on function public.set_player_follow(uuid, boolean) to authenticated;
grant execute on function public.set_outfit_showcase_like(uuid, boolean) to authenticated;
grant execute on function public.get_player_connections(uuid, text) to authenticated;
grant execute on function public.publish_outfit_showcase(uuid, text) to authenticated;
grant execute on function public.remove_outfit_showcase(uuid) to authenticated;
grant execute on function public.set_avatar_public_display(boolean) to authenticated;
