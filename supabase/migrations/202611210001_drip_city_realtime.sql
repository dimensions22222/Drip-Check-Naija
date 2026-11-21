create table public.city_chat_messages (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_public_id uuid not null references public.player_profiles(public_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now()
);

create index city_chat_messages_room_created_idx
  on public.city_chat_messages(room, created_at desc);

create table public.player_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.player_mutes (
  muter_id uuid not null references auth.users(id) on delete cascade,
  muted_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  check (muter_id <> muted_id)
);

create table public.player_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  room text,
  created_at timestamptz not null default now()
);

create index player_reports_reported_created_idx
  on public.player_reports(reported_id, created_at desc);

alter table public.city_chat_messages enable row level security;
alter table public.player_blocks enable row level security;
alter table public.player_mutes enable row level security;
alter table public.player_reports enable row level security;

alter table public.city_chat_messages force row level security;
alter table public.player_blocks force row level security;
alter table public.player_mutes force row level security;
alter table public.player_reports force row level security;

create policy "room chat readable" on public.city_chat_messages
  for select to authenticated
  using (
    not exists (
      select 1 from public.player_blocks block
      where (block.blocker_id = auth.uid() and block.blocked_id = city_chat_messages.sender_id)
         or (block.blocker_id = city_chat_messages.sender_id and block.blocked_id = auth.uid())
    )
    and not exists (
      select 1 from public.player_mutes mute
      where mute.muter_id = auth.uid() and mute.muted_id = city_chat_messages.sender_id
    )
  );

create policy "blocks owner access" on public.player_blocks
  for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create policy "mutes owner access" on public.player_mutes
  for all to authenticated
  using (muter_id = auth.uid())
  with check (muter_id = auth.uid());

create policy "reports owner read" on public.player_reports
  for select to authenticated
  using (reporter_id = auth.uid());

create function public.send_city_chat_message(target_room text, target_body text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  sender_public_id uuid;
  clean_body text := btrim(regexp_replace(target_body, '[[:cntrl:]]', ' ', 'g'));
  message_id uuid;
begin
  if viewer_id is null then
    raise exception 'Sign in to chat in Drip City.' using errcode = '28000';
  end if;
  if target_room is null or char_length(target_room) > 80 then
    raise exception 'Invalid Drip City room.' using errcode = '22023';
  end if;
  if char_length(clean_body) not between 1 and 240 then
    raise exception 'Chat messages must be 1 to 240 characters.' using errcode = '22023';
  end if;

  select profile.public_id into sender_public_id
  from public.player_profiles profile
  where profile.user_id = viewer_id;
  if sender_public_id is null then
    raise exception 'Create a player profile before chatting.' using errcode = '22023';
  end if;

  insert into public.city_chat_messages(room, sender_id, sender_public_id, body)
  values (target_room, viewer_id, sender_public_id, clean_body)
  returning id into message_id;
  return message_id;
end;
$$;

create function public.set_player_block(target_public_id uuid, should_block boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  target_user_id uuid;
begin
  if viewer_id is null then raise exception 'Sign in to moderate players.' using errcode = '28000'; end if;
  select profile.user_id into target_user_id
  from public.player_profiles profile
  where profile.public_id = target_public_id;
  if target_user_id is null then raise exception 'Player not found.' using errcode = '22023'; end if;
  if target_user_id = viewer_id then raise exception 'You cannot block yourself.' using errcode = '22023'; end if;

  if should_block then
    insert into public.player_blocks(blocker_id, blocked_id)
    values (viewer_id, target_user_id)
    on conflict do nothing;
  else
    delete from public.player_blocks
    where blocker_id = viewer_id and blocked_id = target_user_id;
  end if;
end;
$$;

create function public.set_player_mute(target_public_id uuid, should_mute boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  target_user_id uuid;
begin
  if viewer_id is null then raise exception 'Sign in to moderate players.' using errcode = '28000'; end if;
  select profile.user_id into target_user_id
  from public.player_profiles profile
  where profile.public_id = target_public_id;
  if target_user_id is null then raise exception 'Player not found.' using errcode = '22023'; end if;
  if target_user_id = viewer_id then raise exception 'You cannot mute yourself.' using errcode = '22023'; end if;

  if should_mute then
    insert into public.player_mutes(muter_id, muted_id)
    values (viewer_id, target_user_id)
    on conflict do nothing;
  else
    delete from public.player_mutes
    where muter_id = viewer_id and muted_id = target_user_id;
  end if;
end;
$$;

create function public.report_player(target_public_id uuid, target_reason text, target_room text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_id uuid := auth.uid();
  target_user_id uuid;
  clean_reason text := btrim(target_reason);
  report_id uuid;
begin
  if viewer_id is null then raise exception 'Sign in to report players.' using errcode = '28000'; end if;
  select profile.user_id into target_user_id
  from public.player_profiles profile
  where profile.public_id = target_public_id;
  if target_user_id is null then raise exception 'Player not found.' using errcode = '22023'; end if;
  if target_user_id = viewer_id then raise exception 'You cannot report yourself.' using errcode = '22023'; end if;
  if char_length(clean_reason) not between 1 and 500 then
    raise exception 'Reports must be 1 to 500 characters.' using errcode = '22023';
  end if;

  insert into public.player_reports(reporter_id, reported_id, reason, room)
  values (viewer_id, target_user_id, clean_reason, target_room)
  returning id into report_id;
  return report_id;
end;
$$;

revoke all on public.city_chat_messages, public.player_blocks, public.player_mutes, public.player_reports
  from public, anon, authenticated;
grant select on public.city_chat_messages to authenticated;
grant select, insert, update, delete on public.player_blocks to authenticated;
grant select, insert, update, delete on public.player_mutes to authenticated;
grant select, insert on public.player_reports to authenticated;

revoke all on function public.send_city_chat_message(text, text),
  public.set_player_block(uuid, boolean),
  public.set_player_mute(uuid, boolean),
  public.report_player(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.send_city_chat_message(text, text),
  public.set_player_block(uuid, boolean),
  public.set_player_mute(uuid, boolean),
  public.report_player(uuid, text, text)
  to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'city_chat_messages'
  ) then
    alter publication supabase_realtime add table public.city_chat_messages;
  end if;
end $$;
