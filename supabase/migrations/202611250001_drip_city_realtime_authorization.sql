-- Authorize private Drip City Presence and Broadcast channels.
-- All protected room topics require an authenticated player profile.

alter table realtime.messages enable row level security;

drop policy if exists "drip city authenticated receive realtime" on realtime.messages;
drop policy if exists "drip city authenticated send realtime" on realtime.messages;

create policy "drip city authenticated receive realtime"
on realtime.messages
for select
to authenticated
using (
  realtime.topic() in (
    'drip-city:lagos-fashion-district',
    'drip-city:mainland-hangout',
    'drip-city:island-style-avenue',
    'drip-city:campus-plaza',
    'drip-city:naija-market',
    'drip-city:rooftop-lounge'
  )
  and realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.player_profiles profile
    where profile.user_id = (select auth.uid())
  )
);

create policy "drip city authenticated send realtime"
on realtime.messages
for insert
to authenticated
with check (
  realtime.topic() in (
    'drip-city:lagos-fashion-district',
    'drip-city:mainland-hangout',
    'drip-city:island-style-avenue',
    'drip-city:campus-plaza',
    'drip-city:naija-market',
    'drip-city:rooftop-lounge'
  )
  and realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.player_profiles profile
    where profile.user_id = (select auth.uid())
      and profile.public_id::text = realtime.messages.payload->>'publicId'
  )
);

revoke all on realtime.messages from anon;
grant select, insert on realtime.messages to authenticated;
