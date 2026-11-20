# DRIP CHECK NAIJA — Backend Integration, Security Audit & End-to-End Testing

You are the lead full-stack engineer responsible for preparing DRIP CHECK NAIJA for its first real connected release.

The project is a browser-based Nigerian social fashion game built with React, TypeScript, Vite, Phaser and Supabase.

## CURRENT IMPLEMENTED MODULES

The application includes:

1. Avatar Studio — 12 customization categories, outfit management and avatar rendering.
2. Fashion Mall — catalogue, filters, item previews and ownership states.
3. Player Inventory — verified ownership reads and equip/unequip.
4. Fashion Battles — competition foundation.
5. Drip City — Phaser exploration, player discovery, profiles, follows and outfit showcases.
6. Player Progression — XP, levels, daily and weekly missions, achievements, streaks, leaderboards and reward status.
7. Authentication and Supabase backend foundation.

Recent migrations include:
- 202611180001_drip_city_social.sql
- 202611190001_player_progression.sql

Previous milestones also introduced database migrations for profiles, avatars, fashion items, inventory and outfits.

IMPORTANT: Inspect the actual workspace and every existing migration. Do not assume the database is connected or that previous security implementations are correct.

# OBJECTIVE

Perform a complete backend integration and security audit.

Make the application reliable with real authenticated Supabase accounts, preserve demo mode and verify that all connected modules work together.

Do not introduce a new major gameplay feature during this milestone.

# 1. FULL PROJECT AUDIT

Inspect:
- package.json
- Environment configuration.
- Supabase client initialization.
- Authentication/session handling.
- All SQL migrations.
- Database types.
- Repositories and services.
- RLS policies.
- RPC functions.
- Edge Functions, if present.
- Existing frontend integration.
- Existing demo-mode behavior.

Identify:
- Missing migrations.
- Duplicate schema definitions.
- Inconsistent table names.
- Incorrect database types.
- Missing foreign keys.
- Missing indexes.
- Unsafe permissions.
- Broken relationships.
- Frontend/backend contract mismatches.

Produce a concise audit report before major changes.

# 2. MIGRATION READINESS

Inspect all migrations in chronological order.

Ensure:
- Migrations can be applied in the correct order.
- Dependencies exist before dependent tables or functions.
- Migrations are safe to apply to a fresh project.
- Existing migrations are not duplicated.
- SQL functions use correct permissions and search paths.
- RLS is enabled on protected tables.
- No unintended public write permissions exist.

Where Supabase CLI is available:
- Start or connect to a local Supabase development environment.
- Apply migrations to a clean local database.
- Generate or refresh database types.
- Fix migration errors.

If the CLI is unavailable, do not pretend migrations were applied. Prepare clear manual SQL Editor instructions.

Do not modify production data or apply destructive migrations without explicit authorization.

# 3. AUTHENTICATION VERIFICATION

Verify:
- Sign-up.
- Sign-in.
- Sign-out.
- Session restoration after refresh.
- Email confirmation handling.
- Expired session handling.
- Authenticated route protection.
- Profile creation.
- Account ownership.

Test with multiple separate accounts where possible.

Ensure users cannot access or modify another user's private records.

# 4. SECURITY AUDIT

Audit every database table, view, RPC and Edge Function.

Verify:
- RLS policies.
- Table grants.
- Function execution permissions.
- Search paths.
- Authenticated ownership checks.
- Public view exposure.
- Service-role key handling.
- Input validation.
- Duplicate request protection.

Specifically protect:
- Player inventory.
- Saved outfits.
- Wallet or currency data, if present.
- Fashion item ownership.
- Battle entries and votes.
- Social follows and likes.
- Player progression.
- XP and reward claims.
- Achievement unlocks.
- Public profile data.

Critical rules:
- Never trust client-side ownership.
- Never trust client-side XP.
- Never trust client-side vote counts.
- Never trust client-side wallet balances.
- Never allow the browser to determine battle winners.
- Never expose private emails or auth IDs through public queries.
- Never expose Supabase service-role credentials in frontend code.

Use separate test accounts to attempt unauthorized reads and writes.

Fix any confirmed vulnerabilities.

# 5. END-TO-END MODULE INTEGRATION

Verify the following real user journeys:

A. ACCOUNT
- Register.
- Confirm account where configured.
- Sign in.
- Refresh page.
- Sign out.

B. AVATAR STUDIO
- Customize avatar.
- Save outfit.
- Reload page.
- Confirm saved outfit is restored.

C. FASHION MALL AND INVENTORY
- Load catalogue.
- Read owned items.
- Preview an unowned item without permanent changes.
- Equip an owned item.
- Refresh and confirm persistence.
- Ensure users cannot grant themselves inventory.

D. DRIP CITY
- Discover public players.
- Open public profile.
- Follow and unfollow.
- Publish an eligible outfit.
- Like another player's public outfit.
- Verify privacy and duplicate prevention.

E. PROGRESSION
- Save an eligible outfit.
- Verify the corresponding server-validated XP event.
- Check mission progress.
- Verify duplicate events cannot award XP twice.
- Check daily reset boundaries.
- Verify achievement and claim authorization.

F. FASHION BATTLES
- Verify only implemented and connected functionality.
- Confirm that unimplemented competition features are clearly marked.
- Verify that no client-side vote or score manipulation is possible.

Do not fabricate successful results for unavailable modules.

# 6. ERROR HANDLING AND RESILIENCE

Improve:
- Loading states.
- Authentication errors.
- Database errors.
- Network failures.
- Empty states.
- Session expiration.
- Retry behavior where safe.

Ensure a temporary Supabase outage does not crash the entire frontend.

Clearly separate:
- Authenticated cloud mode.
- Demo mode.
- Offline or unavailable backend state.

Never silently save cloud-only actions as if they succeeded.

# 7. TESTING INFRASTRUCTURE

Inspect the current test setup.

If no test runner exists, add a suitable testing framework compatible with the existing stack.

Add meaningful tests for:
- Authentication state.
- Repository functions.
- Outfit persistence.
- Ownership checks.
- Social duplicate prevention.
- XP duplicate-event prevention.
- Mission claim validation.
- Progression calculations.
- Error handling.
- Demo mode.

Add SQL or integration tests for critical RLS and RPC security where feasible.

Add useful npm scripts for:
- Unit tests.
- Type checking.
- Build.
- Linting if configured.

Do not add unnecessary dependencies.

# 8. PERFORMANCE AND PRODUCTION READINESS

Inspect:
- Lazy-loaded Phaser bundle.
- Large JavaScript chunks.
- Unnecessary rerenders.
- Repeated database queries.
- Unbounded queries.
- Missing pagination.
- Image and asset loading.
- Mobile responsiveness.

Fix meaningful issues without breaking existing functionality.

# 9. DOCUMENTATION

Update:
- README.md
- SUPABASE_SETUP.md
- BACKEND_SECURITY.md
- ARCHITECTURE.md

Document:
- Exact migration order.
- Environment variables.
- Supabase Auth configuration.
- Local development setup.
- Production configuration.
- Required manual dashboard settings.
- How to test with two accounts.
- Known limitations.

Ensure .env.example contains placeholders only and secrets are never committed.

# 10. FINAL VERIFICATION

Run:
- npm run build
- TypeScript checks.
- Automated tests.
- SQL migration checks where available.
- git diff --check.

Do not overwrite unrelated existing workspace changes.

Do not claim remote connectivity unless a real Supabase project was configured and tested.

# 11. FINAL REPORT

Provide:
1. Audit findings.
2. Security issues discovered and fixed.
3. Files created and modified.
4. Migrations verified and applied.
5. Authentication test results.
6. RLS and RPC test results.
7. End-to-end journey results.
8. Build and automated test results.
9. Supabase connection status.
10. Remaining manual setup.
11. Whether the game is ready for a private beta.

CRITICAL:
Do not invent test results. Do not apply destructive database changes. Do not expose secrets. Preserve all existing working modules. Prioritize security and reliable integration over adding more features.



xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx