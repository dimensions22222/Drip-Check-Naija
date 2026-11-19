create table public.mission_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  scope text not null check (scope in ('daily','weekly')),
  title text not null,
  description text not null,
  target integer not null check (target > 0),
  xp_reward integer not null check (xp_reward >= 0),
  activity_type text not null,
  active boolean not null default true
);

create table public.player_mission_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.mission_definitions(id) on delete cascade,
  period_key text not null,
  progress integer not null default 0 check (progress >= 0),
  completed_at timestamptz,
  claimed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, mission_id, period_key)
);

create table public.progression_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  reference_id text not null default '',
  xp_awarded integer not null check (xp_awarded >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, event_type, reference_id)
);
create index progression_events_user_time_idx on public.progression_events(user_id, created_at desc);

create table public.login_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_login_date date,
  updated_at timestamptz not null default now()
);

create table public.achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category text not null,
  name text not null,
  description text not null,
  icon text not null,
  rarity text,
  active boolean not null default true
);

create table public.player_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievement_definitions(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  featured boolean not null default false,
  primary key (user_id, achievement_id)
);

create table public.reward_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  reward_type text not null check (reward_type in ('xp','badge','cosmetic','title')),
  active boolean not null default true
);

create table public.reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.reward_definitions(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (user_id, reward_id)
);

insert into public.mission_definitions (code, scope, title, description, target, xp_reward, activity_type) values
  ('daily-save-outfit','daily','Save an outfit','Save an eligible outfit to your cloud wardrobe.',1,25,'outfit_saved'),
  ('daily-publish-showcase','daily','Publish a showcase','Publish an eligible saved outfit to the public showcase.',1,30,'showcase_published'),
  ('daily-like-outfit','daily','Like a look','Like another player''s public outfit once.',1,10,'outfit_liked'),
  ('daily-follow-player','daily','Follow a player','Follow another DRIP CHECK player.',1,15,'player_followed'),
  ('weekly-publish-three','weekly','Publish three looks','Publish three eligible outfit showcases.',3,100,'showcase_published'),
  ('weekly-follow-five','weekly','Meet five players','Follow five eligible DRIP CHECK players.',5,75,'player_followed');

insert into public.achievement_definitions (code, category, name, description, icon, rarity) values
  ('first-outfit','STYLE','First Outfit','Saved your first eligible outfit.','F','Common'),
  ('showcase-star','STYLE','Signature Look','Published your first public outfit showcase.','S','Rare'),
  ('community-favourite','SOCIAL','Community Favourite','Liked or followed a member of the community.','C','Common'),
  ('dedicated-player','PROGRESSION','Dedicated Player','Built a login streak of at least seven days.','D','Epic');

alter table public.player_mission_progress enable row level security;
alter table public.progression_events enable row level security;
alter table public.login_streaks enable row level security;
alter table public.player_achievements enable row level security;
alter table public.reward_claims enable row level security;

create policy "mission progress owner read" on public.player_mission_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "progression events owner read" on public.progression_events
  for select to authenticated using (auth.uid() = user_id);
create policy "streak owner read" on public.login_streaks
  for select to authenticated using (auth.uid() = user_id);
create policy "achievements owner read" on public.player_achievements
  for select to authenticated using (auth.uid() = user_id);
create policy "reward claims owner read" on public.reward_claims
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.mission_definitions, public.player_mission_progress,
  public.progression_events, public.login_streaks, public.achievement_definitions,
  public.player_achievements, public.reward_definitions, public.reward_claims
  from public, anon, authenticated;
grant select on public.mission_definitions, public.achievement_definitions, public.reward_definitions to authenticated;
grant select on public.player_mission_progress, public.progression_events,
  public.login_streaks, public.player_achievements, public.reward_claims to authenticated;

create or replace function public.progression_level(p_total_xp integer)
returns table(level integer, level_xp integer, next_level_xp integer)
language sql
immutable
as $$
  with recursive state(level_no, remaining) as (
    select 1, greatest(p_total_xp, 0)
    union all
    select level_no + 1, remaining - (100 * level_no)
    from state
    where remaining >= 100 * level_no
  )
  select level_no,
         greatest(p_total_xp - (select coalesce(sum(100 * n), 0)
            from generate_series(1, level_no - 1) n), 0),
         100 * level_no
  from state
  order by level_no desc
  limit 1;
$$;

create or replace function public.unlock_progression_achievement(p_user_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.player_achievements (user_id, achievement_id)
  select p_user_id, achievement.id
  from public.achievement_definitions achievement
  where achievement.code = p_code and achievement.active
  on conflict do nothing;
end;
$$;
revoke all on function public.unlock_progression_achievement(uuid, text) from public, anon, authenticated;

create or replace function public.record_progression_activity(p_activity_type text, p_reference_id text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  reference_clean text := left(btrim(p_reference_id), 128);
  awarded integer;
  mission record;
  daily_key text := (now() at time zone 'Africa/Lagos')::date::text;
  weekly_key text := to_char(date_trunc('week', (now() at time zone 'Africa/Lagos'))::date, 'IYYY-IW');
  period text;
begin
  if viewer_id is null then raise exception 'Sign in to record progression.' using errcode='28000'; end if;
  if p_activity_type not in ('outfit_saved','showcase_published','outfit_liked','player_followed') then
    raise exception 'Unsupported progression activity.' using errcode='22023';
  end if;
  if p_activity_type = 'outfit_saved' then
    if not exists (select 1 from public.outfits where id = nullif(reference_clean,'')::uuid and user_id=viewer_id) then
      raise exception 'Outfit save could not be verified.' using errcode='22023';
    end if;
    awarded := 25;
  elsif p_activity_type = 'showcase_published' then
    if not exists (select 1 from public.outfit_showcases where id = nullif(reference_clean,'')::uuid and owner_id=viewer_id) then
      raise exception 'Showcase publication could not be verified.' using errcode='22023';
    end if;
    awarded := 30;
  elsif p_activity_type = 'outfit_liked' then
    if not exists (select 1 from public.outfit_likes like_row
      where like_row.showcase_id = nullif(reference_clean,'')::uuid
      and like_row.user_id=viewer_id
      and exists (select 1 from public.outfit_showcases showcase where showcase.id=like_row.showcase_id and showcase.owner_id<>viewer_id)) then
      raise exception 'Outfit like could not be verified.' using errcode='22023';
    end if;
    awarded := 10;
  else
    if not exists (select 1 from public.player_follows follow
      where follow.follower_id=viewer_id and follow.following_id=nullif(reference_clean,'')::uuid) then
      raise exception 'Follow could not be verified.' using errcode='22023';
    end if;
    awarded := 15;
  end if;

  insert into public.progression_events (user_id,event_type,reference_id,xp_awarded)
  values (viewer_id,p_activity_type,reference_clean,awarded)
  on conflict do nothing;
  if not found then return public.get_progression_dashboard(); end if;

  update public.player_profiles set xp=xp+awarded, updated_at=now() where user_id=viewer_id;
  update public.player_profiles profile
  set level=(select level from public.progression_level(profile.xp))
  where profile.user_id=viewer_id;

  for mission in
    select definition.* from public.mission_definitions definition
    where definition.active and definition.activity_type=p_activity_type
  loop
    period := case when mission.scope='daily' then daily_key else weekly_key end;
    insert into public.player_mission_progress (user_id,mission_id,period_key,progress,completed_at)
    values (viewer_id,mission.id,period,1,
      case when 1>=mission.target then now() else null end)
    on conflict (user_id,mission_id,period_key) do update
    set progress=least(public.player_mission_progress.progress+1,mission.target),
        completed_at=case
          when public.player_mission_progress.progress+1>=mission.target
          then coalesce(public.player_mission_progress.completed_at,now())
          else public.player_mission_progress.completed_at end,
        updated_at=now();
  end loop;

  if p_activity_type='outfit_saved' then perform public.unlock_progression_achievement(viewer_id,'first-outfit'); end if;
  if p_activity_type='showcase_published' then perform public.unlock_progression_achievement(viewer_id,'showcase-star'); end if;
  if p_activity_type in ('outfit_liked','player_followed') then perform public.unlock_progression_achievement(viewer_id,'community-favourite'); end if;
  return public.get_progression_dashboard();
end;
$$;
revoke all on function public.record_progression_activity(text, text) from public, anon;
grant execute on function public.record_progression_activity(text, text) to authenticated;

create or replace function public.claim_mission_reward(p_mission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  mission public.mission_definitions%rowtype;
  progress_row public.player_mission_progress%rowtype;
  period text;
begin
  if viewer_id is null then raise exception 'Sign in to claim progression rewards.' using errcode='28000'; end if;
  select * into mission from public.mission_definitions where id=p_mission_id and active;
  if mission.id is null then raise exception 'Mission not found.' using errcode='22023'; end if;
  period := case when mission.scope='daily'
    then (now() at time zone 'Africa/Lagos')::date::text
    else to_char(date_trunc('week',(now() at time zone 'Africa/Lagos'))::date,'IYYY-IW') end;
  select * into progress_row
  from public.player_mission_progress
  where user_id=viewer_id and mission_id=p_mission_id and period_key=period
  for update;
  if progress_row.mission_id is null or progress_row.progress < mission.target or progress_row.completed_at is null then
    raise exception 'Mission is not eligible to claim.' using errcode='22023';
  end if;
  if progress_row.claimed_at is not null then
    return public.get_progression_dashboard();
  end if;
  update public.player_mission_progress set claimed_at=now(),updated_at=now()
  where user_id=viewer_id and mission_id=p_mission_id and period_key=period;
  update public.player_profiles set xp=xp+mission.xp_reward,updated_at=now() where user_id=viewer_id;
  update public.player_profiles profile
  set level=(select level from public.progression_level(profile.xp))
  where profile.user_id=viewer_id;
  insert into public.progression_events (user_id,event_type,reference_id,xp_awarded)
  values (viewer_id,'mission_claim',mission.id::text,mission.xp_reward)
  on conflict do nothing;
  return public.get_progression_dashboard();
end;
$$;
revoke all on function public.claim_mission_reward(uuid) from public, anon;
grant execute on function public.claim_mission_reward(uuid) to authenticated;

create or replace function public.get_progression_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
volatile
as $$
declare
  viewer_id uuid := auth.uid();
  today date := (now() at time zone 'Africa/Lagos')::date;
  yesterday date := today-1;
  weekly text := to_char(date_trunc('week',(now() at time zone 'Africa/Lagos'))::date,'IYYY-IW');
  streak public.login_streaks%rowtype;
  profile_row public.player_profiles%rowtype;
begin
  if viewer_id is null then raise exception 'Sign in to view progression.' using errcode='28000'; end if;
  select * into profile_row from public.player_profiles where user_id=viewer_id;
  insert into public.login_streaks (user_id,current_streak,longest_streak,last_login_date)
  values (viewer_id,1,1,today)
  on conflict (user_id) do update
  set current_streak =
    case
      when public.login_streaks.last_login_date=today then public.login_streaks.current_streak
      when public.login_streaks.last_login_date=yesterday then public.login_streaks.current_streak+1
      else 1
    end,
    longest_streak=greatest(public.login_streaks.longest_streak,
      case
        when public.login_streaks.last_login_date=today then public.login_streaks.current_streak
        when public.login_streaks.last_login_date=yesterday then public.login_streaks.current_streak+1
        else 1
      end),
    last_login_date=today,
    updated_at=now();
  select * into streak from public.login_streaks where user_id=viewer_id;
  if streak.current_streak>=7 then perform public.unlock_progression_achievement(viewer_id,'dedicated-player'); end if;

  return jsonb_build_object(
    'profile', jsonb_build_object('level',profile_row.level,'xp',profile_row.xp,
      'levelXp',(select level_xp from public.progression_level(profile_row.xp)),
      'nextLevelXp',(select next_level_xp from public.progression_level(profile_row.xp))),
    'streak', to_jsonb(streak),
    'missions', coalesce((select jsonb_agg(jsonb_build_object(
      'id',mission.id,'code',mission.code,'scope',mission.scope,'title',mission.title,
      'description',mission.description,'target',mission.target,'xpReward',mission.xp_reward,
      'progress',coalesce(progress.progress,0),'completed',coalesce(progress.progress,0)>=mission.target,
      'completedAt',progress.completed_at,'claimedAt',progress.claimed_at,
      'periodKey',case when mission.scope='daily' then today::text else weekly end)
      order by mission.scope,mission.title)
      from public.mission_definitions mission
      left join public.player_mission_progress progress
        on progress.mission_id=mission.id and progress.user_id=viewer_id
        and progress.period_key=case when mission.scope='daily' then today::text else weekly end
      where mission.active),'[]'::jsonb),
    'achievements', coalesce((select jsonb_agg(jsonb_build_object(
      'code',definition.code,'category',definition.category,'name',definition.name,
      'description',definition.description,'icon',definition.icon,'rarity',definition.rarity,
      'unlockedAt',owned.unlocked_at,'featured',coalesce(owned.featured,false))
      order by owned.unlocked_at desc nulls last)
      from public.achievement_definitions definition
      left join public.player_achievements owned
        on owned.achievement_id=definition.id and owned.user_id=viewer_id
      where definition.active),'[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'eventType',event.event_type,'xp',event.xp_awarded,'createdAt',event.created_at)
      order by event.created_at desc)
      from (select * from public.progression_events where user_id=viewer_id order by created_at desc limit 10) event),'[]'::jsonb),
    'leaderboard', coalesce((select jsonb_agg(jsonb_build_object(
      'username',profile.username,'level',profile.level,'xp',profile.xp,'publicId',profile.public_id)
      order by profile.level desc, profile.xp desc, profile.username asc)
      from (select * from public.player_profiles order by level desc,xp desc,username asc limit 25) profile),'[]'::jsonb),
    'rewards', '[]'::jsonb
  );
end;
$$;
revoke all on function public.get_progression_dashboard() from public, anon;
grant execute on function public.get_progression_dashboard() to authenticated;

create or replace function public.set_featured_achievement(p_code text, p_featured boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  featured_count integer;
begin
  if viewer_id is null then raise exception 'Sign in to feature achievements.' using errcode='28000'; end if;
  if not exists (
    select 1
    from public.player_achievements owned
    join public.achievement_definitions definition on definition.id=owned.achievement_id
    where owned.user_id=viewer_id and definition.code=p_code
  ) then raise exception 'Only unlocked achievements can be featured.' using errcode='22023'; end if;

  if p_featured then
    select count(*) into featured_count
    from public.player_achievements where user_id=viewer_id and featured;
    if featured_count >= 3 then
      raise exception 'A player may feature at most three achievements.' using errcode='22023';
    end if;
  end if;

  update public.player_achievements owned
  set featured=p_featured
  from public.achievement_definitions definition
  where owned.achievement_id=definition.id
    and owned.user_id=viewer_id
    and definition.code=p_code;
end;
$$;
revoke all on function public.set_featured_achievement(text, boolean) from public, anon;
grant execute on function public.set_featured_achievement(text, boolean) to authenticated;
