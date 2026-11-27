# DRIP CHECK NAIJA — LIVE SUPABASE SECURITY VERIFICATION & MULTIPLAYER ACCEPTANCE

Act as the senior Supabase security engineer and QA lead for DRIP CHECK NAIJA.

## CURRENT STATUS

The project has:
- React, TypeScript, Vite and Phaser frontend.
- Supabase authentication and database.
- Drip City multiplayer foundation.
- Realtime Presence and Broadcast.
- Persisted location-based chat.
- Player blocking, muting and reporting.
- Avatar Studio, Fashion Mall, Inventory and progression systems.

Latest security work:
- Private Realtime configuration added to DripCity.tsx.
- Room-topic and payload validation added in realtimeSecurity.ts.
- Realtime security unit tests added.
- Migration created: 202611250001_drip_city_realtime_authorization.sql.

Previous verification:
- 5 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.
- Local server returned HTTP 200.

IMPORTANT:
The migration was previously rejected because the available database role did not own realtime.messages.

The user must apply the migration through Supabase SQL Editor using appropriate owner-level permissions. Do not assume it has been applied.

## OBJECTIVE

Verify the actual staging database after the user applies the migration. Resolve remaining authorization issues and perform real multiplayer acceptance testing.

## 1. VERIFY THE MIGRATION

Inspect 202611250001_drip_city_realtime_authorization.sql.

Verify:
- The migration exists.
- The intended SQL was applied.
- Required policies exist.
- Required grants are correct.
- Private Realtime authorization is enforced.
- Existing policies were not accidentally weakened.
- The migration is recorded as applied where supported.

Use read-only SQL checks where possible.

Do not reapply the migration blindly.

If the migration was not applied, explain why and provide a safe recovery procedure.

## 2. PRIVATE REALTIME AUTHORIZATION

Test:
- Authenticated users can join permitted rooms.
- Unauthenticated users cannot join protected rooms.
- Unauthorized users cannot subscribe to another restricted room.
- Room topics are validated.
- Presence payloads cannot impersonate other players.
- Movement broadcasts are validated.
- Disconnecting users leave no stale presence.

Inspect both frontend configuration and actual server-side authorization.

## 3. TWO-ACCOUNT MULTIPLAYER TEST

Use two genuinely separate authenticated accounts and independent browser sessions.

Test:
1. Sign in as Account A.
2. Sign in as Account B in a separate browser profile.
3. Enter the same Drip City location.
4. Confirm both players see each other.
5. Move Account A and verify movement on Account B.
6. Move Account B and verify movement on Account A.
7. Exchange chat messages.
8. Switch one account to another location.
9. Verify location isolation.
10. Disconnect and reconnect.
11. Test blocking and muting.

Do not use fabricated accounts or mocked presence as proof of live multiplayer.

If browser access is unavailable, provide precise manual instructions and mark the tests NOT TESTED.

## 4. DATABASE SECURITY TESTING

Test with both accounts:
- Private profile access.
- Outfit ownership.
- Inventory ownership.
- Social interactions.
- Progression updates.
- Chat permissions.
- Report privacy.
- Unauthorized RPC calls.

Verify that one account cannot modify another account's private data.

## 5. FIX CONFIRMED ISSUES

Fix confirmed vulnerabilities without weakening RLS or Realtime authorization.

Do not introduce unnecessary migrations.

Document any required dashboard configuration.

## 6. AUTOMATED VALIDATION

Run:
- npm test
- npm run typecheck
- npm run build
- git diff --check

Keep existing tests and add useful regression tests.

Do not substitute mocks for live security testing.

## 7. DOCUMENTATION

Update:
- docs/STAGING_ACCEPTANCE_TESTS.md
- docs/STAGING_SECURITY_RESULTS.md
- docs/PRIVATE_BETA_READINESS.md

Record actual evidence and distinguish:
- PASS
- FAIL
- NOT TESTED

## 8. FINAL REPORT

Report:
1. Whether the migration was successfully applied.
2. Whether private Realtime authorization works.
3. Two-account multiplayer results.
4. Chat and room isolation results.
5. RLS and RPC security results.
6. Bugs fixed.
7. Automated test results.
8. Remaining manual configuration.
9. Private beta readiness.

Use only these statuses:
- NOT READY
- SECURITY FIXES IMPLEMENTED — TESTING REQUIRED
- STAGING VALIDATED
- READY FOR PRIVATE BETA

CRITICAL:
Never invent test results. Never weaken security to bypass permission errors. Never expose credentials. Preserve all existing game features.


eeeeeeeeee