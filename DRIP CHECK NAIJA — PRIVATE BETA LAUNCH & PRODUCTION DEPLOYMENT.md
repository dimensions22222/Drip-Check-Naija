# DRIP CHECK NAIJA — PRIVATE BETA LAUNCH & PRODUCTION DEPLOYMENT

You are the lead release engineer for DRIP CHECK NAIJA, a browser-based Nigerian social fashion game built with React, TypeScript, Vite, Phaser and Supabase.

Your task is to prepare the existing project for its first private beta release.

IMPORTANT: This is a release and integration milestone, not a redesign. Inspect the actual repository and preserve all existing features.

## 1. CURRENT PROJECT

The application includes:

- Avatar Studio with 12 customization categories.
- Outfit saving and wardrobe management.
- Fashion Mall.
- Player Inventory.
- Fashion Battles foundation.
- Drip City with Phaser exploration.
- Public player profiles and discovery.
- Follows and outfit showcases.
- Player progression, XP, missions, achievements and streaks.
- Supabase authentication and database foundation.
- Realtime multiplayer Presence and movement Broadcast.
- Persisted location-based chat.
- Player blocking, muting and reporting.

Recent multiplayer implementation added:
- Location-based rooms.
- Supabase Presence.
- Movement synchronization.
- Chat persistence.
- Moderation features.
- Remote avatar interpolation.
- Offline and connection status.

Recent verification:
- npm test passed.
- npm run typecheck passed.
- npm run build passed.
- git diff --check passed.

However, the new realtime migration has not yet been applied to a real Supabase project, and two-account multiplayer testing has not been completed.

## 2. RELEASE AUDIT

Inspect the complete project before making changes.

Review:
- package.json
- All source files.
- All SQL migrations.
- Supabase configuration.
- Authentication.
- RLS policies.
- Realtime subscriptions.
- Database types.
- Environment variables.
- Build configuration.
- Deployment configuration.
- Documentation.

Identify blockers preventing a safe private beta.

Create docs/PRIVATE_BETA_READINESS.md with:
- Release checklist.
- Critical blockers.
- Security concerns.
- Required manual configuration.
- Features that are not production-ready.

## 3. SUPABASE DEPLOYMENT READINESS

Inspect every migration in chronological order, including:

- Existing profile and avatar migrations.
- Fashion catalogue and inventory migrations.
- Drip City social migration.
- Progression migration.
- Backend hardening migration.
- Realtime multiplayer migration.

Verify:
- Correct migration order.
- SQL syntax.
- Foreign keys.
- Indexes.
- RLS policies.
- Grants and permissions.
- RPC security.
- Realtime publication configuration.
- Realtime channel authorization.

Check that private data cannot be accessed by unauthorized users.

Do not apply destructive changes or modify production data without explicit authorization.

If Supabase CLI is available:
- Validate migrations.
- Use a local development database if possible.
- Generate database types.
- Test critical database functions.

If it is unavailable, document the exact manual Supabase SQL Editor steps.

Never claim that migrations have been applied unless verified.

## 4. ENVIRONMENT CONFIGURATION

Verify that the application uses environment variables correctly.

Requirements:
- .env.example contains placeholders only.
- .env.local is ignored by Git.
- No service-role key appears in browser code.
- No secrets are committed.
- Production and development environments are clearly separated.

Document the required variables, including:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY or the supported publishable key.

Do not invent credentials.

## 5. REAL ACCOUNT TESTING

Prepare an end-to-end testing checklist using two separate authenticated accounts.

Test:

ACCOUNT:
- Sign-up.
- Sign-in.
- Sign-out.
- Session persistence.
- Email confirmation where configured.

AVATAR:
- Customize avatar.
- Save outfit.
- Refresh.
- Confirm persistence.

MALL AND INVENTORY:
- Catalogue loading.
- Ownership verification.
- Equip and unequip.
- Preview cancellation.
- Prevent unauthorized item grants.

SOCIAL:
- Public profiles.
- Follow and unfollow.
- Outfit publishing.
- Likes.
- Blocking and reporting.

PROGRESSION:
- XP awards.
- Duplicate event prevention.
- Mission completion.
- Achievement unlocking.
- Streak boundaries.
- Reward claim security.

MULTIPLAYER:
- Both accounts enter the same city room.
- Each sees the other player's avatar.
- Movement synchronizes.
- Location switching works.
- Chat messages are delivered and persisted.
- Blocking and muting behave correctly.
- Disconnect and reconnect work.
- Different rooms remain isolated.

Record what was actually tested. Do not fabricate successful results.

## 6. DEPLOYMENT

Inspect the project and recommend a suitable deployment platform compatible with React, Vite, Phaser and Supabase.

Consider Vercel, Netlify or another suitable platform.

Do not assume the user has already connected GitHub or configured a hosting account.

Prepare:
- Production build configuration.
- SPA fallback/rewrites for client-side routing.
- Environment variable instructions.
- Deployment documentation.
- Production URL configuration guidance.
- Supabase Auth redirect URL instructions.

Do not publish the project publicly without explicit authorization.

If deployment credentials or access are unavailable, prepare the deployment configuration and precise instructions rather than pretending deployment succeeded.

## 7. PERFORMANCE AND MOBILE TESTING

Inspect:
- Phaser bundle size.
- Lazy loading.
- Asset loading.
- Initial page performance.
- Realtime message frequency.
- Memory leaks.
- Subscription cleanup.
- Mobile controls.
- Responsive navigation.

Verify layouts at:
- 320px.
- 375px.
- 390px.
- Desktop widths.

Fix meaningful issues without removing existing functionality.

## 8. PLAYER ONBOARDING

Prepare a polished first-time player experience.

Include:
- Welcome screen.
- Account creation and sign-in.
- Display-name setup.
- Avatar creation.
- Introductory navigation.
- Guidance for entering Drip City.
- Explanation of Fashion Mall and Inventory.
- Explanation of Fashion Battles and progression.

Do not force players through unnecessary onboarding if they already have an account and saved avatar.

## 9. BETA SAFETY

Clearly distinguish implemented features from unfinished ones.

Check:
- Purchase functionality remains disabled unless securely implemented.
- No fake wallet balances.
- No fabricated rewards.
- No fake online player counts.
- No demo data presented as live data.
- No unsupported battle results.
- No exposed private player information.

Add a way to report technical issues during beta.

Do not add payment processing during this milestone.

## 10. TESTING AND VALIDATION

Run:
- npm test
- npm run typecheck
- npm run build
- git diff --check

Add tests for important release blockers where practical.

Do not overwrite unrelated workspace changes.

## 11. FINAL REPORT

Provide:

1. Release readiness assessment.
2. Critical issues discovered.
3. Issues fixed.
4. Files created and modified.
5. Migration validation status.
6. Supabase connectivity status.
7. Two-account multiplayer test status.
8. Deployment platform recommendation.
9. Build and test results.
10. Exact manual setup still required.
11. Whether the project is ready for private beta.

Use one of these statuses:
- NOT READY
- READY FOR STAGING
- READY FOR PRIVATE BETA

Never claim production readiness without evidence.

CRITICAL:
Do not invent credentials, successful deployments, database migrations or test results. Preserve the existing game. Prioritize security, stability and a working player experience over adding new features.




iiiiiiiiiiiiiiiiiiiiiiiiiii