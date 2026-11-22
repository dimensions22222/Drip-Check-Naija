# Private Beta Readiness

Status: **NOT READY**

This assessment is evidence-based. The repository is locally buildable, but live Supabase connectivity, migration application, Auth configuration, RLS, realtime authorization, and two-account multiplayer testing remain unverified.

## Release checklist

### Completed in the repository

- React/TypeScript/Vite app preserves demo mode and cloud mode.
- Supabase public-browser configuration rejects service-role and secret keys.
- `.env.example` contains placeholders only and `.env.local` is ignored.
- Browser SPA rewrites are prepared for Netlify and Vercel.
- Supabase migrations cover profiles, avatars, catalogue, inventory, social features, progression, hardening, and realtime chat/moderation.
- Drip City uses location rooms, Presence, throttled movement broadcasts, remote-avatar interpolation, chat RPC persistence, and reconnect status.
- Purchases and wallet/battle authority remain disabled.
- A GitHub issue link is available for beta technical reports.

### Local verification

- `npm test`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Supabase CLI: unavailable in this environment.

## Critical blockers

1. Migration `202611210001_drip_city_realtime.sql` has not been applied to a live database.
2. The Supabase projects visible to the configured connector are inactive.
3. No Supabase URL, publishable/anon key, or credentials were added to the repository.
4. Two separate authenticated accounts have not been used to test multiplayer.
5. Realtime channel authorization/private topics have not been verified on a live project.
6. RLS and RPC behavior are not proven against live Auth sessions.
7. Email confirmation and production Auth redirect URLs are not configured.
8. Mobile, reconnect, and real-network multiplayer behavior are not verified.

## Security concerns

- The browser receives only the project URL and anon/publishable key.
- Never add a Supabase secret, service-role key, database password, or private token to `VITE_*`.
- Realtime Presence and Broadcast payloads are currently browser-originated. Staging must verify private-channel authorization and payload threat handling before public exposure.
- Chat uses a server-side RPC with an allowlisted room list and a basic 5-message-per-10-second limit.
- Chat, block, mute, and report operations depend on migration RLS and RPC configuration.
- The direct insert policy for chat is intentionally absent; chat writes must use the RPC.
- Legacy battle/vote/wallet browser writes remain revoked or demo-only.
- Purchases, paid inventory grants, wallet balances, battle submissions, vote totals, and authoritative rewards must remain disabled.

## Required manual Supabase configuration

1. Choose or create a dedicated staging project; do not use a production database.
2. Review every migration from `202611150001` through `202611210001`.
3. Apply migrations and `supabase/seed.sql` in filename order through the dashboard or Supabase CLI.
4. Enable Realtime for `public.city_chat_messages`.
5. Configure private Realtime channel authorization if private topics are used.
6. In Auth URL configuration, set the correct staging Site URL and exact redirect URLs.
7. Enable or configure email confirmation according to the staging policy.
8. Verify RLS as User A and User B through the public browser client, not as the SQL-editor service role.
9. Verify migrations appear in migration history and that tables/functions/grants match the repository.

Example environment values:

```dotenv
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Do not copy real credentials into Git or documentation.

## Required two-account end-to-end test

For Accounts A and B in separate browser profiles:

### Authentication

- Sign up
- Confirm email, if enabled
- Sign in
- Refresh and confirm session restoration
- Sign out

### Avatar and wardrobe

- Customize and save avatar data
- Save and reload outfits
- Publish and remove a showcase
- Confirm private inventory/outfits stay private

### Social and moderation

- Public profile lookup
- Follow/unfollow
- Like/unlike
- Block, mute, and report
- Confirm blocked/muted chat and direct table writes behave as intended

### Realtime

- Enter the same room
- Confirm both avatars appear only through real Presence
- Move and confirm smooth synchronized movement
- Send and persist chat
- Switch locations and confirm isolation
- Confirm messages do not cross rooms
- Disconnect/reconnect
- Close or sign out and confirm channels are removed

## Features not production-ready

- Supabase realtime authorization and live RLS verification
- Purchase and inventory-grant endpoints
- Wallet/battle submission/voting authority
- Private messaging
- Spam and abuse operations beyond basic chat throttling
- Production email delivery and moderation administration
- Automated realtime load testing

## Deployment recommendation

Recommended first target: **Vercel** or **Netlify** as a static Vite host. Netlify and Vercel SPA rewrites are prepared in `netlify.toml` and `vercel.json`.

Deployment checklist:

1. Connect or manually upload the repository through a staging account.
2. Set Node.js 22 and run `npm run build`.
3. Set staging `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy preview/staging only.
5. Add the exact staging origin to Supabase Auth redirect URLs.
6. Run the two-account tests on the deployed staging URL.
7. Do not publish a production URL until staging evidence exists.

No public deployment or credential operation has been performed.

## Final assessment

**NOT READY** for private beta.

The app has a credible local implementation and build baseline, but private-beta release requires a live staging database, migration application evidence, Auth configuration, RLS/realtime verification, and two-account testing.
