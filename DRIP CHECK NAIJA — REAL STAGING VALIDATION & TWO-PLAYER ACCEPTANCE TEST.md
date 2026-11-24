# DRIP CHECK NAIJA — REAL STAGING VALIDATION & TWO-PLAYER ACCEPTANCE TEST

Act as the lead QA engineer, Supabase security engineer and multiplayer integration specialist for DRIP CHECK NAIJA.

Your task is to validate the actual connected Supabase staging environment and prepare the application for private beta.

## CURRENT PROJECT STATUS

Supabase staging has been activated.

Project:
- Project name: projectx
- Project reference: fmfhadxoqhixcaqpkgos
- Status: ACTIVE_HEALTHY

Completed:
- Repository migrations applied.
- Fashion seed applied.
- Staging environment configured in ignored .env.local.
- Realtime publication includes city_chat_messages.

Previous verification:
- npm test passed.
- npm run typecheck passed.
- npm run build passed.
- Staging HTTP smoke test returned 200.
- git diff --check passed.

Remaining:
- Configure Auth redirect and email confirmation URLs.
- Test real sign-up and sign-in.
- Test RLS and RPC permissions.
- Test chat and moderation.
- Test multiplayer with two authenticated accounts.
- Verify private Realtime channel authorization.

IMPORTANT:
The staging project is real, but do not assume that HTTP 200 means authentication, database security or multiplayer works correctly.

Inspect the actual repository and connected staging configuration before testing.

# 1. STAGING CONNECTION VERIFICATION

Verify that:
- The application reads the correct staging Supabase URL.
- The frontend uses only the publishable/anon key.
- No service-role key is bundled into the frontend.
- The environment configuration is correct.
- The Supabase client connects successfully.
- Database queries return expected results.
- Realtime subscriptions can connect.

Do not print secrets or expose credentials in logs or reports.

# 2. AUTHENTICATION TESTING

Inspect the existing authentication implementation.

Prepare and execute tests for:
- Sign-up.
- Sign-in.
- Sign-out.
- Session restoration after refresh.
- Email confirmation.
- Expired sessions.
- Redirect handling.
- Profile creation.

Configure the application for the actual staging URL.

If dashboard configuration is required, provide the exact settings the user must enter.

Do not invent successful authentication results.

# 3. TWO-ACCOUNT TESTING

Prepare a repeatable test using two genuinely separate accounts.

Account A and Account B must use separate authenticated sessions, preferably separate browser profiles.

Verify:

- Both accounts can sign in.
- Both can enter Drip City.
- Both can see each other's online presence.
- Both can see each other's avatars.
- Account A can move and Account B sees the movement.
- Account B can move and Account A sees the movement.
- Both can enter different locations.
- Players in different locations cannot see each other's room chat.
- Reconnection restores presence correctly.

If browser automation is available, use it. Otherwise, prepare precise manual test instructions.

Do not simulate a second authenticated account with fabricated local data.

# 4. REALTIME AUTHORIZATION SECURITY

Inspect and test:
- Presence channels.
- Movement Broadcast channels.
- Private room access.
- Location-based channel isolation.
- Chat subscriptions.
- Authentication requirements.

Attempt unauthorized access using an account that should not have permission.

Verify that:
- Unauthenticated users cannot access protected rooms.
- Users cannot impersonate other players.
- Users cannot subscribe to unauthorized private rooms.
- Private channel authorization is enforced server-side.
- Disconnecting a user removes stale presence.

Fix confirmed vulnerabilities.

# 5. CHAT AND MODERATION TESTING

Using two accounts, test:

- Sending a message.
- Receiving messages.
- Persisted message history.
- Room isolation.
- Message length restrictions.
- Rate limiting.
- Blocking.
- Muting.
- Reporting a player.
- Reporting a message.

Verify that a blocked player cannot continue interacting in ways prohibited by the implementation.

Check that users cannot modify another user's messages or moderation reports.

Do not claim moderation works unless tested.

# 6. DATABASE RLS AND RPC SECURITY

Audit the actual staging database.

Test:
- Public profile visibility.
- Private profile protection.
- Outfit ownership.
- Inventory ownership.
- Social follows.
- Outfit likes.
- Progression events.
- XP awards.
- Mission claims.
- Achievement unlocking.
- Chat access.
- Player reports.

Attempt unauthorized reads and writes with Account A and Account B.

Verify that users cannot:
- Read another user's private data.
- Grant themselves inventory.
- Change their own XP or level.
- Claim another user's rewards.
- Change vote totals.
- Modify another user's outfits.
- Impersonate another player.
- Access private reports.

Do not assume a policy is secure merely because it exists in SQL. Test actual behavior.

# 7. END-TO-END GAME JOURNEYS

Test the following:

A. Create account and complete onboarding.

B. Customize avatar and save an outfit.

C. Open Fashion Mall and preview an item.

D. Open Inventory and equip an owned item.

E. Enter Drip City.

F. Join a multiplayer location with Account B.

G. Move around and exchange chat messages.

H. Follow another player and view their public profile.

I. Publish a public outfit showcase.

J. Complete an eligible progression activity and verify server-side XP.

K. Refresh and verify persisted state.

Only test features that are actually implemented. Record unsupported or incomplete features.

# 8. FIX AND DOCUMENT ISSUES

Fix confirmed staging integration bugs without replacing working systems.

Create:

docs/STAGING_ACCEPTANCE_TESTS.md

docs/STAGING_SECURITY_RESULTS.md

Include:
- Test name.
- Expected result.
- Actual result.
- PASS, FAIL or NOT TESTED.
- Evidence or explanation.
- Fix applied where relevant.

Do not expose account passwords, tokens or personal information in documentation.

# 9. AUTOMATED TESTING

Where practical, add automated integration tests for:
- Authentication state.
- Repository queries.
- Ownership checks.
- RLS permissions.
- Realtime connection handling.
- Room isolation.
- Chat authorization.
- Duplicate event protection.

Use real staging integration tests only when safely configured.

Never silently replace real backend tests with mocks and report them as live staging tests.

Run:

npm test
npm run typecheck
npm run build
git diff --check

# 10. FINAL REPORT

Provide:

1. Staging connection status.
2. Authentication results.
3. Two-account multiplayer results.
4. Realtime authorization results.
5. Chat and moderation results.
6. RLS and RPC security results.
7. End-to-end journey results.
8. Bugs discovered and fixed.
9. Files created and modified.
10. Build and test results.
11. Remaining manual configuration.
12. Private beta readiness assessment.

Use one of these statuses:
- NOT READY
- STAGING VALIDATED
- READY FOR PRIVATE BETA

CRITICAL:
Do not fabricate test accounts, successful logins, multiplayer connections or security results.

If you cannot access a browser or perform a test, mark it NOT TESTED and give the user exact instructions to perform it manually.

Never expose secrets. Do not deploy publicly during this milestone. Preserve all existing features.


jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj