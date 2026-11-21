# DRIP CHECK NAIJA — REAL-TIME MULTIPLAYER DRIP CITY

You are the lead multiplayer game developer for DRIP CHECK NAIJA, a browser-based Nigerian social fashion game built with React, TypeScript, Vite, Phaser and Supabase.

## CURRENT PROJECT STATUS

The project already includes:

- Avatar Studio with 12 customization categories.
- Outfit saving and wardrobe management.
- Fashion Mall and Player Inventory.
- Fashion Battles foundation.
- Drip City with Phaser-based exploration.
- Public player profiles and discovery.
- Follow/unfollow functionality.
- Public outfit showcases and likes.
- Player progression, XP, missions, achievements and streaks.
- Supabase authentication and database foundation.
- Database security hardening migration.
- Vitest testing infrastructure.

Recent validation:
- npm test passed.
- npm run typecheck passed.
- npm run build passed.
- git diff --check passed.

However, no production Supabase project is connected. Remote migrations, authentication and RLS have not been verified.

IMPORTANT: Inspect the existing implementation before making changes. Reuse the existing Phaser world, avatar renderer, Supabase client, repositories and navigation. Do not rebuild the application from scratch.

# CORE OBJECTIVE

Transform Drip City from a single-player environment into a real-time multiplayer social space.

Players should be able to:

1. Enter Drip City.
2. See other authenticated players online.
3. See their avatars moving around the city.
4. Move their own avatars using keyboard or mobile controls.
5. Communicate through location-based chat.
6. See player presence updates.
7. Visit public player profiles.
8. Interact with other players safely.

The experience should feel like a lively Nigerian virtual fashion community.

# 1. REAL-TIME PLAYER PRESENCE

Use Supabase Realtime Presence if compatible with the existing project.

Implement:
- Online player presence.
- Current city location.
- Player avatar appearance.
- Public display name.
- Current movement state.
- Join and leave notifications.
- Reconnection handling.
- Presence cleanup when players disconnect.

Requirements:
- Only authenticated users can join multiplayer sessions.
- Never expose email addresses or private account identifiers.
- Do not trust client-submitted profile information.
- Load public player appearance from verified public profile data.
- Prevent duplicate player representations.
- Handle stale presence gracefully.

Do not display fake online counts or sample players as real players.

# 2. SYNCHRONIZED AVATAR MOVEMENT

Integrate real-time movement with the existing PhaserWorld.tsx and AvatarRenderer.tsx.

Implement:
- Multiplayer player sprites.
- Local player movement.
- Remote player movement interpolation.
- Camera follow for the local player.
- Collision with existing buildings and blocked areas.
- Player name labels.
- Basic idle and movement states.
- Proper cleanup when players leave.

Controls:
- WASD and arrow keys on desktop.
- Existing mobile directional controls on mobile.

Technical requirements:
- Broadcast movement at a reasonable frequency.
- Avoid sending updates every animation frame.
- Throttle movement broadcasts.
- Interpolate remote movement to avoid jitter.
- Validate coordinates against the city map.
- Prevent players from moving outside permitted walkable areas.
- Avoid excessive database writes.

Use Realtime Broadcast for transient movement where appropriate. Do not persist every movement update to PostgreSQL.

# 3. CITY LOCATIONS AND ROOMS

Implement multiplayer city locations or rooms.

Suggested locations:
- Lagos Fashion District.
- Mainland Hangout.
- Island Style Avenue.
- Campus Plaza.
- Naija Market.
- Rooftop Lounge.

Requirements:
- Players can enter available locations.
- Players only see other players in the same location.
- Switching locations updates presence correctly.
- Room channels must be isolated.
- Leaving a room must clean up subscriptions and presence.
- Demo locations must remain clearly labelled when not connected to a real backend.

Do not claim separate server-authoritative rooms if the implementation only uses client-side labels.

# 4. REAL-TIME LOCATION CHAT

Build a location-based chat panel.

Features:
- Send messages.
- Receive messages in real time.
- Display sender's public display name.
- Display message timestamps.
- Scroll through recent messages.
- Show connection status.
- Show empty and loading states.

Security and moderation:
- Authenticated users only.
- Enforce server-side message length limits.
- Sanitize displayed content.
- Prevent spam and message flooding.
- Add rate limiting.
- Prevent unauthorized message deletion or editing.
- Prevent users from impersonating another player.
- Restrict message access to the relevant location.
- Never expose private messages through public queries.

Use a secure persistence strategy with RLS or trusted server-side functions.

Do not rely on client-side validation alone.

# 5. MODERATION AND PLAYER SAFETY

Implement basic community safety tools.

Include:
- Report player.
- Report message.
- Block player.
- Mute player locally.
- Basic moderation status.
- Admin-only moderation actions.

Create a reporting flow that records:
- Report category.
- Reported player or message.
- Optional explanation.
- Submission timestamp.
- Review status.

Requirements:
- Players cannot view private reports submitted by others.
- Players cannot modify moderation outcomes.
- Admin actions must require trusted authorization.
- Do not expose service-role credentials.
- Avoid creating a browser-side admin privilege system.

If full moderation infrastructure is too large for this milestone, implement reporting safely and document the remaining administrative workflow.

# 6. PLAYER INTERACTIONS

Where appropriate, support:
- Clicking another avatar to view their public profile.
- Following a player.
- Viewing their public outfit showcase.
- Basic interaction indicators.

Reuse existing social features rather than duplicating them.

Do not implement unrestricted direct messaging unless secure private-message infrastructure is properly designed.

# 7. SUPABASE REALTIME ARCHITECTURE

Inspect the existing Supabase configuration and determine which Realtime features are available.

Use:
- Supabase Realtime Presence for online player state.
- Supabase Realtime Broadcast for transient movement.
- PostgreSQL for persisted chat messages and reports.
- RLS for private data protection.

Add migrations only where required.

Potential additional structures:
- city_chat_messages
- player_reports
- player_blocks
- moderation_actions

Requirements:
- Appropriate indexes.
- Foreign keys.
- Unique constraints where needed.
- Strict RLS.
- Restricted grants.
- Safe function permissions.
- Room/location membership validation.

Never expose the Supabase service-role key in browser code.

Do not assume the Supabase project has Realtime enabled. Document any required dashboard configuration.

# 8. NETWORK RESILIENCE

Handle:
- Lost internet connection.
- Realtime subscription errors.
- Session expiration.
- Reconnection.
- Player disconnects.
- Empty locations.
- Chat delivery failures.
- Duplicate messages.
- Stale player positions.

Display a clear connection indicator:
- Connecting.
- Connected.
- Reconnecting.
- Offline.

Do not present a message as delivered until the appropriate backend confirmation is received.

# 9. PERFORMANCE

Optimize multiplayer for ordinary mobile devices and desktop browsers.

Requirements:
- Lazy-load Phaser where appropriate.
- Throttle movement broadcasts.
- Limit visible remote players.
- Limit chat history queries.
- Avoid excessive React state updates.
- Clean up subscriptions and listeners.
- Avoid memory leaks.
- Preserve existing collision and camera behavior.

Document any tested player-count limitations.

# 10. DEMO AND OFFLINE MODE

When Supabase is unavailable:
- Keep the existing single-player Drip City working.
- Clearly label multiplayer as unavailable or demo-only.
- Do not invent live players.
- Do not simulate real chat messages.
- Do not show fabricated online counts.
- Provide a useful connection/setup message.
- Preserve existing navigation and local features.

# 11. TESTING

Add meaningful tests for:
- Presence initialization and cleanup.
- Player joining and leaving.
- Location switching.
- Movement throttling.
- Coordinate validation.
- Remote player interpolation.
- Chat input validation.
- Duplicate message prevention.
- Report submission.
- Block and mute behavior.
- Reconnection.
- Subscription cleanup.

Where possible, test using two separate authenticated accounts and separate browser sessions.

Run:
- npm test
- npm run typecheck
- npm run build
- git diff --check

Do not claim live multiplayer works unless it has actually been tested with a configured Supabase project and separate accounts.

# 12. DOCUMENTATION

Update:
- README.md
- ARCHITECTURE.md
- BACKEND_SECURITY.md
- SUPABASE_SETUP.md

Add a dedicated DRIP_CITY_MULTIPLAYER.md explaining:
- Realtime architecture.
- Presence payload.
- Movement synchronization.
- Location channels.
- Chat persistence.
- Moderation.
- RLS.
- Dashboard configuration.
- Environment variables.
- Testing with two accounts.
- Known limitations.

# 13. FINAL REPORT

At completion, report:

1. Multiplayer features implemented.
2. Files created and modified.
3. Database migrations created.
4. Realtime architecture used.
5. Chat and moderation security.
6. Whether Supabase Realtime was configured.
7. Whether two-account multiplayer was tested.
8. Build and test results.
9. Known performance limitations.
10. Remaining manual configuration.

CRITICAL:
Preserve all existing modules. Do not invent live users, chat messages or online counts. Never expose secrets. Do not claim multiplayer is live until real connections have been tested. Keep single-player mode functional when Supabase is unavailable.


uyygwilqevbiuwynmutnkbnvwlainf