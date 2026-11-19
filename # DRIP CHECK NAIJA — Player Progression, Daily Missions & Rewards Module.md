# DRIP CHECK NAIJA — Player Progression, Daily Missions & Rewards Module

You are the lead full-stack game developer for DRIP CHECK NAIJA, a browser-based Nigerian social fashion game built with React, TypeScript, Vite and Phaser.

## CURRENT PROJECT STATUS

The project has implemented:
- Avatar Studio with 12 customization categories.
- Outfit saving and wardrobe management.
- Fashion Mall and Player Inventory.
- Supabase backend foundation.
- Fashion Battles foundation.
- Drip City with a Phaser city map.
- Public player discovery and profiles.
- Follow/unfollow functionality.
- Public outfit showcases and likes.
- Demo mode when Supabase is unavailable.

Inspect the actual workspace and database migrations before changing anything. Some features may still be unconnected to a live Supabase project.

Do not assume that every previously implemented feature is production-ready.

# CORE OBJECTIVE

Build a complete player progression system that encourages players to return to DRIP CHECK NAIJA.

Players should be able to:
1. Earn XP through eligible game activities.
2. Level up.
3. Complete daily and weekly missions.
4. Maintain daily login streaks.
5. Unlock achievements.
6. Claim eligible rewards.
7. View their progression history.
8. Compare their progress on leaderboards.

All progression and reward decisions must be server-authoritative.

# 1. PLAYER LEVEL AND XP SYSTEM

Create a progression interface showing:
- Current level.
- Current XP.
- XP required for the next level.
- Progress bar.
- Recent XP activity.
- Unlocked achievements.
- Next level reward, if configured.

Create a configurable level progression formula.

Requirements:
- XP must be awarded by trusted backend logic.
- Never accept arbitrary XP amounts from the browser.
- Prevent duplicate XP awards for the same qualifying event.
- Prevent negative XP manipulation.
- Store progression consistently in Supabase.
- Do not reset existing player progression when the application refreshes.

Do not invent a wallet balance or currency reward.

# 2. DAILY MISSIONS

Create a Daily Missions page.

Include example mission types:
- Visit Avatar Studio.
- Save an outfit.
- Preview a Fashion Mall item.
- Equip an owned fashion item.
- Visit Drip City.
- Publish an eligible outfit showcase.
- Like another player's public outfit.
- Enter an eligible Fashion Battle, if supported.
- Complete an eligible competition action, if supported.

Each mission should display:
- Mission title.
- Description.
- Progress.
- Completion status.
- XP reward.
- Claim status.

Requirements:
- Missions refresh according to a consistent server-defined daily reset.
- Use Africa/Lagos as the initial game-day timezone unless the existing project already defines another standard.
- Prevent repeated completion and reward claims.
- Do not count actions that have not been verified.
- Do not allow the browser to directly set mission progress or award XP.
- Show loading, error and empty states.

# 3. WEEKLY MISSIONS

Create weekly challenges with:
- Longer objectives.
- Larger XP rewards.
- Progress tracking.
- Completion status.
- Claim status.
- Clear reset information.

Examples:
- Publish three outfits.
- Complete five daily missions.
- Participate in two eligible fashion battles.
- Receive likes on a public outfit showcase.
- Equip items from multiple fashion categories.

Only use activities that the backend can reliably verify.

# 4. LOGIN STREAKS

Implement a daily login streak system.

Include:
- Current streak.
- Longest streak.
- Last qualifying login.
- Next streak milestone.
- Streak rewards, if configured.

Security:
- Determine login eligibility using trusted server time.
- Prevent multiple streak increments on the same game day.
- Do not allow browser clock manipulation.
- Define how missed days affect streaks.
- Handle timezone boundaries consistently.

Do not claim a login streak was updated until the backend confirms it.

# 5. ACHIEVEMENTS AND BADGES

Create an achievement system with categories such as:

STYLE:
- First Outfit.
- Wardrobe Collector.
- Signature Look.

SOCIAL:
- First Follow.
- Community Favourite.
- Style Influencer.

COMPETITION:
- First Battle Entry.
- Battle Winner.
- Podium Finisher.

CITY:
- First City Visit.
- City Explorer.

PROGRESSION:
- First Level Up.
- Dedicated Player.
- Streak Milestone.

Achievements should have:
- Name.
- Description.
- Icon or badge artwork.
- Unlock conditions.
- Unlock timestamp.
- Rarity only where configured.

Unlocking must be validated server-side.

Do not award achievements based on unverified browser events.

# 6. REWARD CLAIMS

Build a reward interface showing available, claimed and locked rewards.

Possible rewards:
- XP.
- Achievement badges.
- Cosmetic unlocks.
- Titles.
- Other configured non-monetary rewards.

CRITICAL SECURITY:
- The browser must never grant inventory directly.
- The browser must never modify wallet balances.
- The browser must never determine reward eligibility.
- Every claim must be validated by trusted server-side logic.
- Prevent duplicate claims with database constraints and transactional operations.
- Keep an audit trail of reward grants.

If no secure reward infrastructure exists, implement the UI and secure backend foundation, but do not simulate successful real reward claims.

# 7. PLAYER PROGRESSION PROFILE

Integrate progression into public and private player profiles.

Show only appropriate public information:
- Level.
- Public achievement badges.
- Public titles.
- Selected progression milestones.

Keep private mission history and account information private.

Allow players to choose which eligible achievements are featured on their public profile.

# 8. LEADERBOARDS

Create progression leaderboards.

Potential categories:
- Highest level.
- Most XP this week.
- Longest active streak.
- Achievement count.

Requirements:
- Use backend-calculated values.
- Add pagination or bounded result limits.
- Avoid exposing private account data.
- Do not use fabricated player rankings.
- Clearly label demo leaderboards when Supabase is unavailable.

# 9. SUPABASE DATABASE AND SECURITY

Inspect all existing migrations, tables, RPCs and RLS policies first.

Reuse existing progression-related structures if they exist.

Create new migrations only when necessary.

Potential database structures:
- player_progress
- mission_definitions
- player_missions
- achievement_definitions
- player_achievements
- reward_claims
- progression_events
- login_streaks

Implement:
- Foreign keys.
- Unique constraints.
- Indexes.
- Appropriate timestamps.
- Strict RLS.
- Server-side validation.
- Idempotent progression events.

Use secure RPCs or Edge Functions for:
- Recording eligible activities.
- Updating mission progress.
- Awarding XP.
- Level calculations.
- Login streak updates.
- Achievement unlocking.
- Reward claims.

Never expose service-role credentials to the browser.

Do not give users direct permission to update XP, levels, streaks, reward claims or achievement unlocks.

# 10. ACTIVITY INTEGRATION

Where possible, connect progression to existing game modules:
- Avatar Studio.
- Fashion Mall.
- Player Inventory.
- Fashion Battles.
- Drip City.
- Social follows.
- Outfit showcases.

Do not award XP simply because a frontend button was clicked.

Every qualifying activity must be verified by a trusted backend operation.

If a module is not yet connected to Supabase, document the integration limitation rather than inventing activity records.

# 11. USER EXPERIENCE

Create a polished progression dashboard.

Use the DRIP CHECK NAIJA palette:
- Deep Aubergine #24172F
- Electric Lavender #A78BFA
- Tangerine #FF8A5B
- Mint Green #72E0C1
- Warm Cream #FFF4E6
- Ink Black #252334
- Soft Lilac #DCD0FF

Include:
- XP progress animation.
- Level-up feedback.
- Mission completion feedback.
- Achievement unlock presentation.
- Reward claim confirmation.
- Mobile-friendly mission cards.
- Clear progress indicators.

Animations must not imply that rewards have been granted before backend confirmation.

# 12. DEMO MODE

When Supabase is unavailable:
- Clearly label progression as demo-only.
- Do not imply demo XP or rewards are permanent.
- Do not display fabricated live leaderboards.
- Preserve existing application functionality.
- Do not mix demo progression with authenticated cloud progression.

# 13. TESTING

Run:
- npm run build
- TypeScript checks.
- Existing automated tests.
- git diff --check.

Test:
- XP calculation.
- Level progression.
- Duplicate activity prevention.
- Daily mission progress.
- Weekly mission progress.
- Daily reset boundaries.
- Login streak behavior.
- Achievement unlocking.
- Duplicate reward claim prevention.
- Leaderboard privacy.
- RLS and RPC authorization.
- Demo mode.
- Responsive layouts, including 320px screens.

Where possible, test using separate authenticated accounts.

Do not claim Supabase security has been verified unless the migrations have been applied and the actual policies and RPCs have been tested.

# 14. DOCUMENTATION

Update README.md and relevant backend documentation.

Document:
- XP formula.
- Level progression.
- Daily and weekly reset rules.
- Mission definitions.
- Achievement rules.
- Reward claim lifecycle.
- Database migrations.
- RLS policies.
- Server-side functions.
- Manual Supabase setup.
- Features still requiring live backend configuration.

# 15. FINAL REPORT

At completion, report:
1. Features implemented.
2. Files created and modified.
3. Database migrations created.
4. XP and level formula.
5. Mission and streak rules.
6. Rewards implemented and any safely disabled features.
7. Security measures.
8. Whether Supabase connectivity was actually tested.
9. Build and test results.
10. Remaining manual configuration.

IMPORTANT:
Inspect before implementing. Preserve existing functionality. Do not invent live activity, XP, rankings or rewards. Never trust the browser to determine progression or grant items or currency. All persistent rewards must be server-authoritative.