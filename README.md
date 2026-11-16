# DRIP CHECK NAIJA

Your style. Your city. Your crown.

This is a browser-first React + TypeScript fashion-game foundation. It runs without credentials in local demo mode, with persistent local outfit presets.

## What works now

- Mobile-first navigation, dashboard, Studio, Battles, Wardrobe, Profile and Drip City teaser
- Layered avatar Studio with independent hairstyles, hair colours, expressions, skin tones, tops, bottoms, sneakers, chains, earrings, glasses, watches and bags
- Separate femme and masc configurations, front/side/back views and four facial expressions
- Item metadata with compatibility rules; changing an item changes only that layer
- Reset, randomize, named outfit save/load/rename/delete, separated by character and persisted in local storage
- Demo battle entry state plus one-vote UI state; the player entry cannot be voted for
- Supabase migration, seed catalog, RLS baseline and documented trust boundaries

## Run

Requirements: Node.js 20.19+ or 22.12+ and npm.

1. Run npm install.
2. Run npm run dev.
3. Open the URL printed by Vite.

For production, run npm run build then npm run preview.

Copy .env.example to .env.local only when connecting Supabase. Vite variables must contain only the public URL and anon key. Never expose service-role keys.

## Important boundaries

The demo uses browser storage, so it is intentionally not authoritative. Currency, ownership, purchases, submissions, votes, rewards and final scoring must be implemented via server-side handlers/RPCs. The migration disables direct browser writes for those sensitive tables.

The character art is temporary vector artwork, not final production-quality art. The renderer and catalog are ready to receive final transparent SVG/PNG layers; see docs/ASSET_PIPELINE.md.

## Deployment

Deploy the generated dist directory to Cloudflare Pages, Netlify, or another static host. Add a separate trusted API/server runtime before enabling economic or competitive gameplay. Apply supabase/migrations and supabase/seed.sql through the Supabase CLI or dashboard first.

## Known limitations / next work

- No Supabase client or authentication flow is connected until public environment values are supplied.
- Battle voting, wallet values and submissions are demo-only UI states; trusted operations are not yet implemented.
- The legacy Phaser component remains in the repository but is not loaded; Drip City is deliberately deferred until the core online loops are connected.
- Install dependencies before running type-check/build; this workspace currently does not contain node_modules.
