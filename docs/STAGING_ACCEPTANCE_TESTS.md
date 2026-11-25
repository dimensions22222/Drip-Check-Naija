# Staging Acceptance Tests

## Status

**SECURITY FIXES IMPLEMENTED — TESTING REQUIRED**

No real test accounts or browser sessions were available during this validation pass. Authentication, two-account multiplayer, chat, moderation, and browser RLS behavior remain NOT TESTED. All passwords and tokens are excluded from this document.

## Environment and repository checks

| Test | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|
| Staging URL | `.env.local` points to the `projectx` staging project | URL matched `https://fmfhadxoqhixcaqpkgos.supabase.co` | PASS | Verified against the Supabase project URL |
| Browser key type | Publishable/anon key only | Publishable key is configured | PASS | `.env.local` uses `VITE_SUPABASE_ANON_KEY` and no secret key |
| Key matches dashboard | Exact dashboard key is bundled locally | Initial key mismatch was found and corrected | PASS after fix | Dashboard and local publishable key now match |
| Staging database reachability | Public tables and migrations are available | Project returned `ACTIVE_HEALTHY`; public tables and migration history were readable | PASS | Supabase project and SQL checks |
| Realtime publication | `city_chat_messages` is in `supabase_realtime` | Table is published | PASS | Read-only publication check |
| Private Realtime migration | Repository migration restricts authenticated room topics and payload public IDs | Fix implemented; owner migration and live test still required | NOT TESTED LIVE | `202611250001_drip_city_realtime_authorization.sql` |
| Unit tests | Tests pass | 3 tests passed | PASS | `npm test` |
| Type check | No TypeScript errors | Passed | PASS | `npm run typecheck` |
| Production build | Build completes | Completed; bundle-size warnings remain | PASS | `npm run build` |
| Diff whitespace | No whitespace errors | Passed | PASS | `git diff --check` |

## Auth configuration required

In Supabase **Authentication -> URL Configuration**, set:

- **Site URL:** `http://localhost:5173`
- **Redirect URLs:** add `http://localhost:5173/**`
- For a staged deployed origin, add that exact origin followed by `/**`
- **Email confirmation:** enable if staging sign-up should require verification.
- **Password recovery:** no password-recovery flow is implemented in the app; do not expose or test one until implemented.

The app sends the current browser origin for email confirmation and uses `detectSessionInUrl`, `persistSession`, and `autoRefreshToken`.

## Authentication test cases

| Test | Expected result | Actual result | Status | Evidence or manual procedure |
|---|---|---|---|---|
| Sign-up | Creates a separate account and profile | No live account was created | NOT TESTED | Use the Account page in two separate browser profiles |
| Email confirmation | Confirmation redirect restores sign-in flow | No email confirmation performed | NOT TESTED | Configure redirects, sign up, open the email link, and return to the app |
| Sign-in | Authenticated session is created | Not tested live | NOT TESTED | Sign in using a confirmed account |
| Sign-out | Session is cleared | Not tested live | NOT TESTED | Sign out, refresh, and confirm account state is signed out |
| Session refresh | Session persists after refresh | Not tested live | NOT TESTED | Refresh while signed in and confirm profile/loading state recovers |
| Expired session | User is safely signed out or prompted to refresh | Not tested live | NOT TESTED | Wait for expiry or revoke the session in Auth, then refresh |
| Profile creation | Signup trigger creates a profile and public ID | No account data was created | NOT TESTED | After signup, open Account and confirm profile fields load |

## Two-account multiplayer test cases

Use Account A and Account B in separate browser profiles. Do not copy one browser session or fake local presence.

| Test | Expected result | Actual result | Status | Evidence or manual procedure |
|---|---|---|---|---|
| Both sign in | Both sessions authenticate independently | Not tested live | NOT TESTED | Confirm each profile loads in its own browser profile |
| Enter same room | Both enter the same location | Not tested live | NOT TESTED | Open Drip City and select `lagos-fashion-district` |
| Presence | Each sees the other user | Not tested live | NOT TESTED | Record connection status and presence count |
| A moves | B receives A's position | Not tested live | NOT TESTED | Move A with WASD/arrows; observe B |
| B moves | A receives B's position | Not tested live | NOT TESTED | Move B with WASD/arrows; observe A |
| Different locations | Players are isolated by room topic | Not tested live | NOT TESTED | Put A and B in different rooms and verify neither sees the other's presence |
| Chat isolation | Each room receives only its room history and broadcasts | Not tested live | NOT TESTED | Send a message from A and verify B receives it only in the same room |
| Reconnection | Presence and room chat recover after reconnect | Not tested live | NOT TESTED | Refresh or disconnect/reconnect, then observe presence and history |

## Chat and moderation test cases

| Test | Expected result | Actual result | Status | Evidence or manual procedure |
|---|---|---|---|---|
| Send and receive chat | Authenticated RPC inserts a room-scoped message | Not tested live | NOT TESTED | Send a short message as A and receive it as B |
| Persisted history | Messages reload for the same room | Not tested live | NOT TESTED | Refresh B and reload the room |
| Length restriction | 1-240 characters, control characters cleaned | SQL policy exists; browser behavior not tested | NOT TESTED | Submit empty, 241-character, and control-character messages |
| Rate limit | Five messages in 10 seconds is rejected | SQL function exists; live behavior not tested | NOT TESTED | Send six messages rapidly as A |
| Block | Blocked players cannot exchange chat under the implementation's policy | Not tested live | NOT TESTED | A blocks B, then test send/read behavior in both directions |
| Mute | Muting hides the target player's messages from the muter | Not tested live | NOT TESTED | A mutes B, then confirm B's history and new messages are hidden for A |
| Player report | Authenticated user can report another public ID once or repeatedly per policy | Not tested live | NOT TESTED | Submit 1-character and valid reports |
| Cross-user report protection | One user cannot modify another user's report | RLS policy exists but live behavior is untested | NOT TESTED | Attempt a direct update/delete as B |

## RLS and RPC test cases

| Test | Expected result | Actual result | Status |
|---|---|---|---|
| Public profile visibility | Public fields only | SQL and repository audit only | NOT TESTED |
| Private avatar/outfit protection | Another user cannot read private data | SQL policy audit only | NOT TESTED |
| Inventory ownership | Only the owner can read inventory | SQL policy audit only | NOT TESTED |
| Direct write denial | Non-owner cannot write catalog, inventory, outfits, or XP | SQL policy audit only | NOT TESTED |
| Self progression protection | Browser cannot set own XP or level | SQL policy audit only | NOT TESTED |
| Social RPC authorization | Follow/like/publish operations enforce identity and ownership | SQL function audit only | NOT TESTED |
| Chat RPC authorization | Chat rejects anonymous, invalid rooms, invalid length, and excess rate | SQL function audit only | NOT TESTED |
| Duplicate event protection | Duplicate votes/claims/likes/follows are rejected or idempotent | SQL constraints/functions audit only | NOT TESTED |

## E2E journey

| Journey | Actual result | Status |
|---|---|---|
| Create account and onboard | Not tested live | NOT TESTED |
| Customize and save outfit | Implemented locally/cloud; live cloud write not tested | NOT TESTED |
| Mall preview | Implemented UI; staging ownership data not tested | NOT TESTED |
| Inventory equip | Implemented UI; staging inventory not tested | NOT TESTED |
| Enter Drip City | Implemented UI; staging realtime not tested | NOT TESTED |
| Multiplayer movement and chat | Implemented; two live sessions not tested | NOT TESTED |
| Follow/public profile | Implemented RPC/UI; live RPC not tested | NOT TESTED |
| Publish showcase | Implemented RPC/UI; live ownership not tested | NOT TESTED |
| Progression XP | Implemented server functions; live RPC not tested | NOT TESTED |
| Refresh persisted state | Implemented local/session persistence; live refresh not tested | NOT TESTED |
