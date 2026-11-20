# Backend integration audit

## Audit status

The repository is a browser-first demo with an optional Supabase integration. The 20261115-20261120 migrations implement profiles, avatars, outfits, catalogue, inventory, social RPCs, and progression. No Supabase project is linked in this workspace, Supabase CLI is unavailable, and no remote migration or RLS test has been run.

## Findings and fixes

- The 202611160 migration left the legacy text `player_inventory.item_id` primary-key column in place after adding the UUID fashion-item key. The migration now drops that legacy key and establishes `(user_id, fashion_item_id)` as the inventory primary key.
- The public profile view's `following_count` used the follower side of the relationship instead of the target profile's follows. Migration 202611200 replaces the view with a public-ID-based count.
- Legacy battle, vote, and wallet tables did not receive explicit table grants/revocations. Migration 202611200 revokes anon/authenticated table privileges and grants only public reads or owner-readable views where existing RLS permits them.
- The `set_player_follow` RPC now validates that the target public ID exists before inserting, preventing ambiguous FK behavior.
- Database types now include all progression tables and the featured-achievement RPC.

## Security boundaries

The browser contains only public configuration. Service-role credentials, wallet balances, inventory grants, battle winners, vote totals, XP values, and reward grants are not accepted from the browser.

Owner checks and duplicate prevention remain in RLS and fixed-search-path security-definer RPCs. Mission and XP rewards are awarded only after server-side database actions are verified.

## Verification limits

No live authentication or RLS test was possible in this workspace. The application build and unit tests can be run locally, but private-beta readiness requires a real Supabase project, two test accounts, migration application, dashboard Auth configuration, and manual RLS verification.
