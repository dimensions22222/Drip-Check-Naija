# Backend security boundaries

The browser is an untrusted client. TypeScript checks, item filtering, hidden controls, and local storage do not authorize actions or protect game state.

## Public browser credentials

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are bundled for the browser. The anon/publishable key is public by design; row-level security is the authorization boundary. The client refuses known secret/service-role key forms. Never add a service-role key, database password, or server secret to source code, `.env.example`, or any `VITE_*` setting.

## Database authorization

- Player profiles, avatars, inventories, and outfits are private to `auth.uid()`.
- Profile owners can change username, bio, and country only. Column grants prevent browser edits to level and XP.
- The public catalogue is read-only and exposes active items only.
- Inventory is owner-readable. There are no browser inventory insert/update/delete grants or policies.
- Outfit writes are owner-only. A database trigger validates each equipped slug against an active catalogue row, matching slot, and character compatibility. This validation is enforced by PostgreSQL, not just the client.
- Profile creation on signup uses a security-definer trigger with a fixed search path and an idempotent user-ID conflict target.

Review all RLS changes against the applied migration before deployment. An administrative SQL session can bypass RLS; test access with actual anon/authenticated browser sessions.

## Operations that remain out of scope

There is no trusted backend for purchases or inventory grants. All seeded catalogue items currently have zero demo price, and no UI operation can grant inventory. When ownership-gated items are introduced, enforce ownership in a trusted RPC/API/database transaction, not in this client.

Currency, wallets, transactions, purchases, XP/level progression, rewards, battle entries, voting, scoring, moderation, and multiplayer are not implemented by this integration. Do not trust a client-supplied balance, price, ownership claim, XP, level, vote, or battle result. Any future service-role key must live exclusively in a separately deployed server environment with authorization, validation, and transaction boundaries.

## Local and cloud data

Local storage is a convenience/demo fallback, not an authoritative record. On sign-in, cloud outfits are loaded separately from existing local drafts. No local outfit is silently uploaded or discarded; the player explicitly syncs each local draft. Avatar application from cloud is also explicit. Cloud request failures keep local drafts. On account change/sign-out, account-scoped in-memory rows are cleared; locally stored outfits remain on the device.
