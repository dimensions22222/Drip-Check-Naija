# Drip City

Drip City adds a single-player Phaser neighbourhood and opt-in social discovery to the existing React app. It reuses `AvatarRenderer`, saved cloud outfits, the existing Supabase Auth client, and the typed repository. The Phaser world is loaded only when a player opens Explore.

## What is connected

- The city hub shows the local Studio avatar and static, clearly marked demo locations.
- Explore is a single-player map with camera follow, walkable streets/buildings, arrow-key or WASD movement, and on-screen touch controls. There are no remote player sprites, online indicators, or location persistence.
- Player discovery reads a bounded page of public profiles and supports display-name search. Profile views expose the public display name, bio, real stored level/XP, aggregate follow counts, and only an avatar explicitly shared by its owner. Email addresses and `auth.users` IDs are not selected by public views. The random `player_profiles.public_id` is a public-facing identifier, not an auth account ID. Country is intentionally omitted from the public view.
- Follows, unfollows, showcase likes, publishing/removal, and connection lists require authentication and use database functions. Counts and liked/following state are read back from database views, not trusted from browser counters.
- A public outfit showcase is separate from the private `outfits` table. Players can publish only their own saved cloud outfits. The server verifies ownership and checks active catalogue availability and inventory ownership for paid items. Local-only outfit drafts are never uploaded by publishing.
- Chat is a coming-soon screen. No chat, private messages, activity feed, or live battle data is fabricated.

## Migration and database security

Apply migrations in filename order:

1. `202611150001_initial_schema.sql`
2. `202611160001_supabase_backend_foundation.sql`
3. `202611180001_drip_city_social.sql`

Then apply `supabase/seed.sql` if the sample public catalogue is wanted. The new migration adds a public profile UUID, opt-in avatar visibility, `player_follows`, `outfit_showcases`, and `outfit_likes`.

The social tables have RLS enabled and forced, with no browser table grants. Fixed-search-path `SECURITY DEFINER` functions validate the authenticated owner and perform mutations. Unique primary keys prevent duplicate follows and likes; self-follows and self-likes are rejected. Curated views expose only public profile/showcase fields. The avatar view includes only the selected look and only after the owner opts in. A database trigger validates public avatar items; showcase publishing checks the saved outfit, active catalogue, character compatibility, and ownership of non-zero-price items. The views also hide looks that later become unavailable.

The browser never receives a Supabase service-role key. Review the migration and test RLS with separate authenticated accounts before applying it to production. Live Supabase connectivity and RLS have not been tested in this repository because it is not linked to a Supabase project.

## Demo mode and current limits

Without valid Supabase configuration, players can explore the map, locations, and sample profiles/outfits. Every sample is marked demo; follows, likes, messages, live activity, player counts, and online states are disabled or absent. A configured but unreachable Supabase project shows an error rather than substituting demo social data.

Battles remain a separate demo UI. There are no verified battle placements or active battle records connected to Drip City. Level and XP are displayed only when read from the existing profile table; no new progression is awarded.

## Future multiplayer requirements

Do not treat the Phaser scene or browser memory as authoritative multiplayer state. A future real-time milestone should add:

- Authenticated, private location channels with server-side membership checks and explicit location access policy.
- Server-validated movement bounds, rate limits, payload schemas, and presence cleanup on disconnect.
- A clear separation between ephemeral location/presence events and persistent profile, outfit, follow, or battle records.
- Moderation, reporting, mute/block controls, retention limits, and abuse/spam protections before any public chat.
- Load, reconnect, cross-device, and RLS tests using multiple real accounts; avoid database polling for presence.

Until that infrastructure is implemented and tested, the city remains single-player.
