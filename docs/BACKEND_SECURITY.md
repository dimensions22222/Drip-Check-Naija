# Backend security boundaries

The browser is an untrusted client. TypeScript checks, item filtering, hidden controls, and local storage do not authorize actions or protect game state.

## Public browser credentials

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are bundled for the browser. The anon/publishable key is public by design; row-level security is the authorization boundary. The client refuses known secret/service-role key forms. Never add a service-role key, database password, or server secret to source code, `.env.example`, or any `VITE_*` setting.

## Database authorization

- Player profile, avatar, inventory, and saved-outfit tables are owner-scoped to `auth.uid()`. Drip City exposes curated columns through read-only public views: a generated public profile ID (not the auth UUID), username, bio, level/XP, follow counts, and published outfits. Country and email are not in those views.
- A cloud avatar stays private unless its owner opts in to public display. The public view exposes only the selected character look, not both saved looks. A database trigger validates that the public avatar uses active compatible catalogue items that are free or present in the owner's inventory; the public view also stops exposing items that later become unavailable.
- Profile owners can change username, bio, and country only. Column grants prevent browser edits to level and XP.
- The public catalogue is read-only and exposes active items only.
- Inventory is owner-readable. There are no browser inventory insert/update/delete grants or policies.
- Outfit writes are owner-only. A database trigger validates each equipped slug against an active catalogue row, matching slot, and character compatibility. This validation is enforced by PostgreSQL, not just the client.
- Social follow, showcase, and like tables have RLS enabled and forced and no browser table grants. Fixed-search-path `SECURITY DEFINER` RPCs use `auth.uid()` for the actor, reject self-follows/self-likes, and validate ownership before publishing or removing. Unique keys prevent duplicate follows and likes. Public views expose curated showcase data and database-derived counts; client-supplied counts are not accepted.
- Showcase publication accepts only an owner's existing saved cloud outfit. The RPC checks active catalogue membership, category/character compatibility, and ownership of non-zero-price items. Private saved outfits are not selected by public views unless a showcase row exists.
- Profile creation on signup uses a security-definer trigger with a fixed search path and an idempotent user-ID conflict target.

Review all RLS changes against the applied migration before deployment. An administrative SQL session can bypass RLS; test access with actual anon/authenticated browser sessions.

## Operations that remain out of scope

There is no trusted backend for purchases or inventory grants. All seeded catalogue items currently have zero demo price, and no UI operation can grant inventory. When ownership-gated items are introduced, enforce ownership in a trusted RPC/API/database transaction, not in this client.

Currency, wallets, transactions, purchases, XP/level progression, rewards, live battle entries, voting, scoring, moderation, chat, and multiplayer are not implemented by this integration. Do not trust a client-supplied balance, price, ownership claim, XP, level, vote, or battle result. Follows and likes are authenticated, but rate limiting and moderation for public communication must be in place before chat is introduced. Any future service-role key must live exclusively in a separately deployed server environment with authorization, validation, and transaction boundaries.

## Local and cloud data

Local storage is a convenience/demo fallback, not an authoritative record. On sign-in, cloud outfits are loaded separately from existing local drafts. No local outfit is silently uploaded or discarded; the player explicitly syncs each local draft. Avatar application from cloud is also explicit. Cloud request failures keep local drafts. On account change/sign-out, account-scoped in-memory rows are cleared; locally stored outfits remain on the device.
