-- Backfill/install fixes for existing projects and fresh migrations.

-- Legacy battle, vote, and ledger tables must not accept browser writes.
revoke all on public.battles, public.battle_entries, public.votes,
  public.wallet_transactions from public, anon, authenticated;
grant select on public.battles, public.battle_entries to anon, authenticated;
grant select on public.votes, public.wallet_transactions to authenticated;

-- The follow view must count both directions from the public_id itself.
create or replace view public.public_player_profiles with (security_barrier = true) as
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
    where follow.follower_id = profile.user_id) as following_count,
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

revoke all on public.public_player_profiles from public, anon, authenticated;
grant select on public.public_player_profiles to anon, authenticated;

-- Validate target identity before inserting, avoiding an ambiguous FK failure.
create or replace function public.set_player_follow(target_public_id uuid, should_follow boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  target_user_id uuid;
begin
  if viewer_id is null then
    raise exception 'Sign in to follow players.' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.player_profiles profile
    where profile.public_id = target_public_id
  ) then
    raise exception 'Player not found.' using errcode = '22023';
  end if;
  select profile.user_id into target_user_id
  from public.player_profiles profile where profile.public_id = target_public_id;
  if target_user_id = viewer_id then
    raise exception 'You cannot follow yourself.' using errcode = '22023';
  end if;
  if should_follow then
    insert into public.player_follows (follower_id, following_id)
    values (viewer_id, target_public_id)
    on conflict (follower_id, following_id) do nothing;
  else
    delete from public.player_follows
    where follower_id = viewer_id and following_id = target_public_id;
  end if;
end;
$$;
revoke all on function public.set_player_follow(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_player_follow(uuid, boolean) to authenticated;
