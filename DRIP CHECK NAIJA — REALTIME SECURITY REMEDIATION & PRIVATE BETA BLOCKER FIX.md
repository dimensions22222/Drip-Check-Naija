# DRIP CHECK NAIJA — REALTIME SECURITY REMEDIATION & PRIVATE BETA BLOCKER FIX

Act as the senior Supabase security engineer and release engineer for DRIP CHECK NAIJA.

Your task is to resolve the outstanding staging security and authentication blockers. Do not add new gameplay features.

## CURRENT STATUS

Project:
- Supabase project: projectx
- Project reference: fmfhadxoqhixcaqpkgos
- Project status: ACTIVE_HEALTHY
- Local application: http://localhost:5173

Existing features:
- Avatar Studio.
- Fashion Mall and Player Inventory.
- Fashion Battles foundation.
- Drip City Phaser world.
- Player profiles, follows and outfit showcases.
- XP, missions and achievements.
- Supabase authentication.
- Realtime multiplayer Presence and Broadcast.
- Persisted location-based chat.
- Player blocking, muting and reporting.

Latest verification:
- npm test: 3 tests passed.
- npm run typecheck: passed.
- npm run build: passed.
- HTTP smoke test: 200.
- git diff --check: passed.

Current release status: NOT READY.

Outstanding blockers:
1. Supabase Auth redirect URLs are not configured or verified.
2. No real two-account browser test has been completed.
3. RLS and moderation behavior remain unverified.
4. Chat authorization remains unverified.
5. Private Realtime channel authorization remains a release blocker.

## OBJECTIVE

Fix the actual causes of these blockers and prepare a repeatable two-account staging acceptance test.

Inspect the existing implementation before making changes.

Do not replace working systems or introduce a new architecture unnecessarily.

## 1. PRIVATE REALTIME CHANNEL SECURITY — TOP PRIORITY

Inspect:
- Realtime channel creation.
- Presence subscriptions.
- Broadcast subscriptions.
- Private channel configuration.
- Channel topic naming.
- Supabase Realtime authorization policies.
- Database grants.
- RLS policies.
- Authentication state handling.

Determine which channels must be private and which can safely be public.

For protected city rooms:
- Require authenticated users.
- Validate room membership.
- Prevent unauthorized location access.
- Prevent channel impersonation.
- Prevent users from joining restricted rooms.
- Ensure movement messages cannot impersonate another player.
- Ensure presence payloads contain only permitted public information.
- Ensure subscriptions are cleaned up when users leave.

Inspect whether the client correctly requests private channels and whether the server-side authorization policies actually enforce access.

Do not assume that enabling private channels in frontend code is sufficient.

Create or update SQL migrations where required.

Do not weaken security to make connections work.

## 2. AUTHENTICATION AND REDIRECT CONFIGURATION

Inspect the current authentication implementation.

Prepare exact Supabase dashboard settings for:
- Site URL.
- Local development redirect.
- Staging redirect.
- Email confirmation.
- Password recovery redirect, if implemented.

Support:
- Sign-up.
- Email confirmation.
- Sign-in.
- Sign-out.
- Session restoration.
- Expired sessions.

If dashboard access is unavailable, provide precise manual instructions.

Do not claim the dashboard settings were changed unless actually changed and verified.

## 3. TWO-ACCOUNT MULTIPLAYER ACCEPTANCE TEST

Prepare a repeatable test using two genuinely separate accounts.

Account A and Account B must have independent authenticated sessions.

Test:
1. Both accounts sign in.
2. Both enter Drip City.
3. Both join the same location.
4. Both see the other player's presence.
5. Account A moves and Account B sees the movement.
6. Account B moves and Account A sees the movement.
7. Both exchange persisted chat messages.
8. Switch one account to a different location.
9. Verify room isolation.
10. Test disconnect and reconnect.
11. Test blocking and muting.
12. Verify that unauthorized channel access is rejected.

Use browser automation if available.

If you cannot control two browser sessions, provide exact manual steps and mark the tests NOT TESTED.

Do not create fake accounts or pretend a second session is authenticated.

## 4. RLS AND RPC SECURITY

Inspect actual policies and test real authorization behavior.

Verify:
- Private profiles remain private.
- Users cannot modify another user's outfits.
- Users cannot grant themselves inventory.
- Users cannot modify their own XP or reward claims.
- Users cannot edit another user's messages.
- Users cannot read another user's private reports.
- Users cannot impersonate other players.
- Unauthorized RPC calls are rejected.

Use separate authenticated accounts for cross-user access tests where possible.

Fix confirmed vulnerabilities.

## 5. CHAT AND MODERATION

Verify:
- Authenticated message submission.
- Message length limits.
- Rate limiting.
- Room membership validation.
- Message persistence.
- Message ownership.
- Blocking behavior.
- Muting behavior.
- Report submission privacy.

Ensure moderation actions cannot be forged from browser requests.

Document any limitations.

## 6. SECURITY TESTS

Add automated tests where practical for:
- Channel authorization logic.
- Room membership.
- Message validation.
- Presence payload validation.
- Reconnection.
- Unauthorized operations.
- RLS and RPC behavior.

Do not replace live integration tests with mocks and describe them as real Supabase security verification.

## 7. DOCUMENTATION

Update:
- docs/STAGING_ACCEPTANCE_TESTS.md
- docs/STAGING_SECURITY_RESULTS.md
- docs/PRIVATE_BETA_READINESS.md
- docs/SUPABASE_SETUP.md

Include exact dashboard settings, SQL changes, test procedures and results.

Never include passwords, tokens, service-role keys or private account data.

## 8. FINAL VALIDATION

Run:
- npm test
- npm run typecheck
- npm run build
- git diff --check

Confirm that the app still works at http://localhost:5173.

Do not deploy publicly.

## 9. FINAL REPORT

Report:
1. Private Realtime authorization findings.
2. Security fixes applied.
3. Migrations created or modified.
4. Authentication configuration status.
5. RLS and RPC test results.
6. Two-account test results.
7. Chat and moderation results.
8. Build and test results.
9. Manual dashboard actions remaining.
10. Updated private beta readiness status.

Use:
- NOT READY
- SECURITY FIXES IMPLEMENTED — TESTING REQUIRED
- STAGING VALIDATED
- READY FOR PRIVATE BETA

CRITICAL:
Never fabricate successful authentication, two-account testing, Realtime authorization or RLS results. Never expose secrets. Do not weaken authorization to bypass errors. Preserve all existing game features.


