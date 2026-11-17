# DRIP CHECK NAIJA

Your style. Your city. Your crown.

This is a browser-first React + TypeScript fashion-game foundation. It runs without credentials in local demo mode, with persistent local outfit presets. An optional Supabase integration provides email authentication and owner-scoped profiles, avatars, catalogue, inventory reads and outfits.

## What works now

- Mobile-first navigation, dashboard, Studio, Battles, Wardrobe, Profile and Drip City teaser
- Layered avatar Studio with independent hairstyles, hair colours, expressions, skin tones, tops, bottoms, sneakers, chains, earrings, glasses, watches and bags
- Fashion Mall with Studio-category filters, item search, newest/price sorting, cloud ownership states, and a reversible preview on the current avatar
- Player Inventory with verified cloud-owned items, category/search filters, equip and unequip actions wired to the persistent local Studio look
- Separate femme and masc configurations, front/side/back views and four facial expressions
- Item metadata with compatibility rules; changing an item changes only that layer
- Reset, randomize, named outfit save/load/rename/delete, separated by character and persisted in local storage
- Optional Supabase email sign-up/sign-in, confirmation messaging, session restoration and sign-out
- Owner-scoped cloud profile/avatar/outfits, public active catalogue reads and owner-only inventory reads
- Explicit per-outfit local-to-cloud sync; local outfits are not silently imported or discarded
- Demo battle entry state plus one-vote UI state; the player entry cannot be voted for
- Supabase migration, seed catalog, RLS baseline and documented trust boundaries

## Run

Requirements: Node.js 20.19+ or 22.12+ and npm.

1. Run npm install.
2. Run npm run dev.
3. Open the URL printed by Vite.

For production, run npm run build then npm run preview.

Copy `.env.example` to `.env.local` only when connecting Supabase. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project URL and an anon/publishable key. Restart Vite after changing them. The app rejects service-role/secret keys; never expose them in Vite variables.

## Important boundaries

The app stays usable without Supabase credentials. Browser storage is intentionally not authoritative. Currency, ownership grants, purchases, submissions, votes, rewards and final scoring must be implemented via trusted server-side handlers/RPCs. RLS protects the cloud data; see [docs/BACKEND_SECURITY.md](./docs/BACKEND_SECURITY.md).

Without valid Supabase settings, the Mall uses the local sample catalogue for temporary try-ons and the Inventory clearly reports demo mode with no permanently owned items. Local Studio looks and saved outfits remain available. With Supabase configured, the public active catalogue is loaded from `fashion_items`; a signed-in player's items are loaded from `player_inventory`. The database must have the migrations and seed applied as described in [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md).

Purchases are intentionally disabled. This project has no verified server-side purchase endpoint, wallet validation, or atomic inventory grant; catalogue prices are display data only. The browser never deducts currency or inserts into `player_inventory`, and no wallet balance is shown as real.

Apply the ordered migrations and configure Auth before using a connected project. Setup, confirmation redirects, RLS verification and current connectivity status are documented in [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md). This repository has not been linked to a Supabase project and no remote migrations have been applied.

The character art is temporary vector artwork, not final production-quality art. The renderer and catalog are ready to receive final transparent SVG/PNG layers; see docs/ASSET_PIPELINE.md.

## Deployment

Deploy the generated dist directory to Cloudflare Pages, Netlify, or another static host. Add a separate trusted API/server runtime before enabling economic or competitive gameplay. Apply `supabase/migrations` and `supabase/seed.sql` through the Supabase CLI or dashboard first.

## Known limitations / next work

- Auth and cloud reads/writes require public Supabase URL/key values and the migrations/seed to be applied.
- Battle voting, wallet values and submissions are demo-only UI states; trusted operations are not yet implemented.
- The legacy Phaser component remains in the repository but is not loaded; Drip City is deliberately deferred until the core online loops are connected.
- The browser catalogue is free/demo content. Inventory grants and item ownership checks for paid/locked content are not implemented.
