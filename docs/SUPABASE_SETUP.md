# Supabase setup

The browser integration is optional. The app remains usable in local/demo mode when project settings are absent or invalid. This workspace has not been linked to a Supabase project; no migration has been applied remotely.

## 1. Create or select a project

Use an existing Supabase project or create one in the Supabase dashboard. The project must have Auth and the default `public` schema available.

## 2. Configure public browser values

In the project dashboard, open **Project Settings → API** and copy the project URL and either the legacy anon JWT or the newer publishable key. Put them in a local `.env.local` file:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

`.env.local` is ignored by Git. `.env.example` contains no credentials. Only an anon/publishable key belongs in this browser app. The client rejects `sb_secret_` keys and JWTs whose role is not `anon`; never put a service-role key, database password, or other server secret in a `VITE_*` variable.

Restart Vite after changing environment values:

```powershell
npm install
npm run dev
```

The header/account page reports demo or configured state. A URL and safe key are only configuration, not proof that the project is reachable.

## 3. Apply the database changes

Review the ordered migrations before applying them. `202611160001_supabase_backend_foundation.sql` adds the account tables/policies while converting the existing text fashion-item key to a UUID plus unique slug and preserving the old slug values and inventory references. `202611180001_drip_city_social.sql` adds Drip City public profile/showcase views, opt-in public avatar display, and owner-validated social RPCs. These are forward-only migrations; they do not replace the existing initial migration.
`202611190001_player_progression.sql` adds the progression foundation: mission definitions, mission/claim state, login streaks, achievements, progression event audit rows, bounded live leaderboard data, and trusted RPCs. Daily periods use Africa/Lagos dates; weekly periods reset on Monday in that timezone. Level XP is cumulative at 100 XP for level 1, 200 for level 2, 300 for level 3, and so on.
`202611200001_backend_hardening.sql` adds explicit legacy-table privilege boundaries and fixes public profile following counts. Daily periods use Africa/Lagos dates; weekly periods reset on Monday in that timezone. Level XP is cumulative at 100 XP for level 1, 200 for level 2, 300 for level 3, and so on.

With the Supabase CLI installed and authenticated, link the intended project and review pending migrations before pushing:

```powershell
supabase login
supabase link --project-ref your-project-ref
supabase migration list
supabase db push --dry-run
supabase db push
```

Alternatively, run the SQL files in the exact order above in the project SQL editor, then run `supabase/seed.sql`. Apply the seed only after the migrations. The seed contains public zero-price catalogue examples; it creates no user inventory or currency. Verify the migration history and table definitions in the dashboard. Do not run these commands against a production project without reviewing the target and current schema first.

## 4. Configure email authentication

In **Authentication → URL Configuration**:

- Set the Site URL to the local development origin, commonly `http://localhost:5173`.
- Add the exact local origin and deployed app origin to Redirect URLs. The app sends the current origin as the email-confirmation redirect.
- Set up the project's email provider and confirmation policy. With confirmations enabled, sign-up displays a pending-confirmation message; confirm the email before signing in. With confirmations disabled, the session may be created immediately.

Use the Account button to create an account, confirm email if requested, sign in, refresh to verify session restoration, and sign out. The app creates a username profile on signup via a database trigger; the profile form lets the owner change username, bio, and country.

## 5. Exercise the connected features

- The Account page reads active catalogue rows and the signed-in user's inventory.
- Profile and avatar table rows are owner-scoped. Applying a fetched cloud avatar is an explicit action and replaces both local character looks only after confirmation by clicking the button. Public profile views exclude email, auth IDs, and country; bio, username, level/XP, and a synthetic public ID are shown. Avatar visibility is off by default and can be changed on the Drip City profile.
- Saving a new outfit writes the local copy first, then syncs it for an authenticated user. A failed request leaves the local copy intact and surfaces a retryable cloud error.
- Cloud outfits can be loaded, renamed, updated from the current Studio look for that character, and deleted. These actions update the cloud row; failed writes leave the previous saved version intact.
- Existing local outfits are not uploaded on sign-in. In Wardrobe, use **Sync to cloud** on each local outfit to import it. IDs are stable UUIDs and the upsert key avoids duplicate imports of the same local outfit.
- Signed-out users continue using the same local Studio and wardrobe.
- Drip City discovery uses bounded public profile/showcase reads. Follows, unfollows, likes, and connection lists require authentication. Showcase publishing/removal is owner-checked by database RPC; local drafts are excluded and item availability is checked server-side.

## 6. Check row-level security

The repository has no configured project or local Supabase stack, so RLS has not been exercised against a live database here. Do not use the SQL editor as an RLS test: dashboard SQL commonly runs with elevated privileges.

For a manual check, create two test users through the app and use separate browser profiles:

1. As User A, save an outfit and avatar, edit the profile, and explicitly opt in to public avatar display.
2. Sign in as User B. Confirm A's saved outfits and inventory remain private; the public profile view exposes only its documented fields, and only the selected opt-in avatar look.
3. Use User A and User B sessions through the public client to attempt a write to `fashion_items` and `player_inventory`; both must be denied. Confirm anonymous and authenticated reads return active catalogue items only.
4. As each user, create, load, rename, update from Studio, and delete an outfit; verify the changes are visible only to that owner.
5. Confirm the trusted profile fields `level` and `xp` cannot be changed through the browser client. Check that direct reads/writes to `player_follows`, `outfit_showcases`, and `outfit_likes` are denied.
6. Exercise follow/unfollow, duplicate follow, self-follow, like/unlike, duplicate like, self-like, publish/remove, publish another user's outfit, and publish a paid item without inventory. Confirm public counts reflect only database rows and local drafts never appear in the public view.

Keep the test accounts and project separate from production data. The current public catalogue is free/demo content; there is no inventory grant, economy, battle submission, or voting path.
