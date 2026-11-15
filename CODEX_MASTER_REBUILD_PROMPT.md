# DRIP CHECK NAIJA --- MASTER CODEX REBUILD PROMPT

**Goal:** Rebuild DRIP CHECK NAIJA from a clean foundation as a
polished, browser-only Nigerian social fashion game.\
**Tagline:** Your style. Your city. Your crown.\
**Product source:** DRIP_CHECK_NAIJA_Product_Blueprint.docx.\
**Visual references:** the female and male character sheets and the
game-layout screenshot in `reference-images/`.

## 1. Instructions to Codex

Act as a senior product engineer, frontend/game engineer, backend
architect and 2D avatar pipeline engineer. Build the actual application
in this repository, not a mockup or disconnected demo.

First inspect the existing repository, assets, scripts and environment
files. Identify user work and secrets that must not be destroyed.
Rebuild the weak prototype rather than preserving its placeholder
avatar. Do not delete credentials, user data or unrelated files. Create
a short plan, then execute it. Keep the project runnable throughout.

Every visible control must work. Do not claim a feature is complete if
it is only a placeholder. Use typed reusable modules, meaningful
loading/empty/error states, responsive layouts and accessible controls.
Run tests, type checks and a production build; fix failures. If external
credentials are required, provide `.env.example` placeholders and a
local/demo fallback. Never invent credentials or put secrets in browser
code.

## 2. Product vision

DRIP CHECK NAIJA is a Nigerian-inspired, browser-first social fashion
game. Players create digital characters, style them with clothing and
accessories, enter themed fashion battles, vote on other players' looks,
earn rewards and build a public style reputation. It must feel like a
social gaming community, not merely a dress-up website.

Audience: Nigerians worldwide, African fashion and gaming enthusiasts,
Gen Z/young adults, campus communities and fashion enthusiasts.

Brand personality: playful, competitive, expressive, youthful without
looking childish, Nigerian without stereotypes, stylish but welcoming,
culturally aware and friendly. Use Nigerian slang naturally and
sparingly.

Slogan: **YOUR STYLE. YOUR CITY. YOUR CROWN.**\
Supporting lines: "No be everybody get drip." / "Dress sharp. Battle
hard." / "Na who wear am better?"

Core product principle: every player should have a reason to return,
something to customize, someone to compete against and something worth
sharing.

## 3. Platform and stack

This is a **web-browser-only app**, mobile-first for affordable Android
phones and ordinary mobile networks, with desktop support. Make it
installable as a PWA if practical. Do not create native mobile or
desktop apps.

Recommended stack: - Frontend: React, TypeScript, Vite, React Router,
Tailwind CSS or CSS Modules/design tokens. - Client state: Zustand where
useful; server state: TanStack Query. - Validation: Zod. - 2D social
world: Phaser 3. - Fashion showcase / Studio: a separate layered 2D
avatar renderer, not a top-down Phaser sprite. - Backend: Node.js +
TypeScript using Express or Fastify, organized as a modular monolith. -
Database: PostgreSQL via Supabase. - Authentication: Supabase Auth. -
Realtime: Supabase Realtime for lightweight presence only where
needed. - Asset storage: Cloudflare R2 or equivalent. - Hosting:
Cloudflare Pages or equivalent. - Tests: Vitest and Playwright.

Suggested structure:

``` text
drip-check-naija/
  apps/
    web/src/{app,components,features,pages,game,avatar,hooks,stores,styles}/
    server/src/{modules, middleware,config}/
  packages/{shared,validation,game-assets}/
  supabase/{migrations,seed.sql}
  public/{sprites,backgrounds,icons,audio}
  docs/
  tests/
  .env.example
  README.md
```

Keep the architecture modular, but do not over-engineer microservices.

## 4. Unique brand identity

**Do not copy Lagos Life/VATAR branding, UI styling or palette.** Use
this DRIP CHECK NAIJA palette:

  Token               Hex         Purpose
  ------------------- ----------- -------------------------------
  Deep Aubergine      `#24172F`   Main background
  Electric Lavender   `#A78BFA`   Active states and key accents
  Tangerine           `#FF8A5B`   Primary CTA and highlights
  Mint Green          `#72E0C1`   Success and online status
  Warm Cream          `#FFF4E6`   Main text / light surfaces
  Ink Black           `#252334`   Dark panels and outlines
  Soft Lilac          `#DCD0FF`   Secondary surfaces

Create central design tokens for colours, typography, spacing, radius,
shadows and z-index. Use a premium, youthful fashion-game aesthetic,
rounded cards, clear contrast, crisp typography, restrained
gradients/glows and legible mobile layouts. Use Space Grotesk or similar
for headings and Inter or similar for body text. Do not scatter raw hex
values through components.

## 5. Main navigation and screens

Implement: 1. **Landing/Login:** product introduction, sign-up and
sign-in. 2. **Home/Dashboard:** greeting, avatar preview,
server-provided currency balances, featured battle/countdown, daily
challenge and recent activity. 3. **Studio:** character selection,
layered avatar customization, multiple outfit presets,
poses/backgrounds. 4. **Battles:** active/upcoming/completed themes,
submission, anonymous voting and results. 5. **Fashion Mall:** category
filters, item preview, rarity, price, unlock conditions and
server-validated purchases. 6. **Wardrobe:** owned items and saved
outfits; equip, rename, duplicate and delete presets. 7. **Profile:**
avatar, handle, bio, rank, trophies, showcase and battle history. 8.
**Social:** follows, likes, discovery and shareable profiles. Private
messaging and unrestricted chat are post-MVP. 9. **Drip City:** small
optional top-down 2D plaza with keyboard/touch movement, mall, arena,
event area, emotes and preset messages.

Use responsive desktop navigation and accessible mobile
navigation/bottom bar.

## 6. Avatar Studio --- highest priority

Replace the existing placeholder avatar completely. The user supplied: -
A female anime-inspired character sheet: shoulder-length dark bob, large
expressive eyes, friendly rounded face, layered oversized streetwear
top, cargo trousers and chunky sneakers. - A male anime-inspired
character sheet: spiky dark hair, large expressive eyes, friendly face,
layered oversized streetwear, cargo trousers and chunky sneakers. - A
screenshot showing the desired broad game/studio layout.

Use these as close visual references for the character design language,
not as flattened in-game images. Create original DRIP CHECK NAIJA
character art in one consistent universe: polished anime-inspired 2D
art, clean outlines, smooth cel shading, consistent head/body
proportions, clothing folds, shoes and hands. Do not produce 3D models,
generic emoji avatars or pixel art.

### Character selection

Show two full-body character cards: FEMALE and MALE. Selecting one loads
its own asset set. Switching characters must not overwrite the other
character's outfit.

### Layered art pipeline

Build independent transparent SVG/PNG layers on a common artboard with
fixed anchors and a strict draw order. Do not hardcode one monolithic
SVG or use a single flattened image.

Suggested layers: 1. Base body/skin. 2. Legs and arms (split where
necessary for overlap). 3. Face and facial details. 4. Back hair. 5.
Bottoms or dress. 6. Shoes. 7. Top/outerwear. 8. Front hair/fringe. 9.
Accessories/effects.

Each asset needs metadata: `id`, `name`, `slot`,
`characterCompatibility`, `assetPath`, `thumbnailPath`, `rarity`,
`unlockMethod`, `colourVariants`, `layerOrder`, `assetVersion`. Clothing
must align and layer correctly without distorting unrelated body parts.

If an image-generation/asset tool is available to Codex, create the
actual original character assets. If not, create a documented asset
specification and coherent temporary vector assets; clearly label
temporary art and do not pretend rough placeholders are
production-quality. Keep the renderer ready for final art replacement.

### Customization

Appearance: skin tones, body types/proportions, hairstyles, hair
colours, facial features, eye styles and expressions.

Clothing: T-shirts, layered long sleeves, hoodies, jackets, trousers,
cargo pants, shorts, skirts and dresses.

Footwear: sneakers, boots and slides.

Accessories: chains, necklaces, earrings, watches, caps, glasses and
bags.

Target 40--60 compatible starter wardrobe pieces, prioritizing quality
and mix-and-match compatibility. Blueprint target ranges: 6--10
hairstyles, 10--15 tops, 8--12 bottoms/dresses, 6--8 shoes and 8--12
accessories.

Every control must change the actual rendered layer. No label-only fake
interactions.

### Views and expressions

Support front, back and side views, plus normal, happy, serious and
surprised expressions. Preserve identity, outfit, proportions and
alignment across views. Add subtle optional blinking/breathing/idle
motion and respect reduced-motion settings.

### Studio layout

Desktop: left character/category navigation; centre large preview with
view/expression controls; right item grid, colours and details; bottom
Reset, Randomize and Save Outfit actions.

Mobile: keep preview prominent; use horizontally scrollable category
tabs and bottom sheets/panels; large touch targets; no hover-only
interactions.

Actions: save/load outfit, rename preset, reset edits, randomize
compatible owned items, switch character, view and expression. Keep
separate configurations for male/female. Support local demo saving when
backend is not configured; sync authenticated saved outfits to the
backend.

## 7. Fashion Battles

Battles are the core loop; build them before a large social world.

Loop: discover themed challenge → style with owned items → submit before
deadline → vote on competing outfits → battle closes → results/rewards →
share and enter another battle.

Example themes: Lagos Nightlife, Old Money, Detty December, Traditional
Wedding, Streetwear King/Queen, University Freshman, Afrobeats
Superstar, Naija 2000s, Sunday Best, Festival Ready.

Requirements: - Rotating themes with clear descriptions and deadlines. -
One eligible outfit per player per battle in MVP. - Asynchronous pools;
players need not be online together. - Anonymous/randomized outfit
voting. - Hide vote totals until battle closes. - Results, rewards and
share card after close. - Server validates deadline, eligibility and
owned items.

Starting scoring hypothesis from the blueprint: community preference
70%, theme relevance 20%, creativity 10%. Make it configurable and
transparent; review after beta.

Anti-manipulation: no self-voting, one valid vote per voter per
battle/assigned set, randomize entry order, hide live totals, rate-limit
and flag suspicious patterns, do not let follower count affect score,
and provide reporting.

## 8. Mall, wardrobe and virtual economy

Currencies: - **Drip Coins:** everyday cosmetics, earned through
activity, battles, achievements and events. - **Drip Gems:** optional
premium cosmetics/special collections, only after payment design is
validated.

Blueprint reward values are illustrative placeholders, not final economy
settings: daily login 50 coins; daily challenge 100; battle entry 30;
battle win 150; vote 10; weekly achievement 300. Make values
configurable and balance earn/spend rates.

Paid cosmetics must never create competitive advantage. No real payment
integration in initial MVP unless deliberately configured and tested.
Payment confirmation and wallet crediting must be server-side.

Use an immutable wallet transaction ledger. Balances may be
cached/derived only if reconciled. Wallet changes and purchase
fulfillment must use database transactions. Never trust client-supplied
balances or purchase confirmations.

## 9. Backend and data model

Use Supabase PostgreSQL + Auth, migrations and seed data from the
beginning.

Suggested tables: - `player_profiles`: user_id, username/handle, bio,
country, level, xp, created_at. - `avatars`: user_id, character_type,
skin_tone, body_type, face_config, hair_config. - `fashion_items`: id,
name, category, rarity, asset_path, price, metadata. -
`player_inventory`: id, user_id, item_id, acquired_at, source. -
`outfits`: id, user_id, name, equipped_items JSON, created_at,
updated_at. - `battles`: id, theme, brief, starts_at, ends_at, status,
rules. - `battle_entries`: id, battle_id, user_id, outfit_id,
submitted_at. - `votes`: id, battle_id, voter_id, entry_id,
category_scores, created_at. - `wallets`: user_id and optional cached
currency balances. - `transactions`: id, user_id, currency, amount,
type, reference, created_at. - `friendships`, `follows`, `achievements`,
`player_achievements`, `reports`.

Use UUIDs, foreign keys, indexes, check/unique constraints, RLS and
database transactions. Validate item ownership before outfit
submissions. Store outfit configurations as item IDs and slot names, not
arbitrary URLs. Keep wallet/voting operations behind trusted server-side
code.

Security: - Treat browser input as untrusted. - Server calculates
rewards, XP, balances, ownership and battle results. - Server validates
eligibility, deadlines and inventory ownership. - Rate-limit auth,
votes, submissions and social actions. - Validate/sanitize user text. -
Keep service-role keys and secrets off the frontend. - Add reporting,
blocking and moderation workflows. - Start with preset chat/emotes;
free-text chat is post-MVP. - Audit sensitive economy and moderation
actions. - Add `.env.example` placeholders only; never include real
secrets.

Backend modules: Auth, Players, Inventory, Wardrobe, Battles, Voting,
Economy, Social, Events and Moderation.

## 10. Drip City

Build only after Studio and battles work. Make one compact top-down
Phaser 3 plaza with a fashion mall, battle arena, event area and meeting
point. Desktop uses WASD/arrow keys; mobile uses virtual joystick/touch
controls. Add basic emotes/preset messages. Nearby-player presence is
optional and must not block local play. Use separate top-down sprites
for movement; never reuse the fashion showcase sheet as a top-down
sprite. Do not build a giant open world or complex real-time multiplayer
before validating retention.

## 11. Performance, accessibility and responsive UX

Mobile-first for ordinary Android phones and mobile networks. Load core
app and Studio before optional world assets. Compress sprites, lazy-load
optional screens, use thumbnails in grids and full assets only in active
preview. Avoid heavy animation/bundles. Provide large touch targets,
keyboard accessibility, visible focus, good contrast, reduced-motion
support, mobile joystick and graceful demo/offline messaging. Test
phone, tablet and desktop sizes.

## 12. MVP build order

Follow this order: 1. Foundation: repo, design system, database, auth,
profiles, responsive navigation. 2. Avatar Studio: layered renderer,
starter wardrobe, selection and saved outfits. 3. Fashion Battles:
themes, submissions, voting, scoring and winners. 4. Rewards/Social:
coins, XP, mall, profiles, follows/likes and basic leaderboards. 5. Game
World: one compact plaza, movement, mobile joystick, emotes and
lightweight presence. 6. Launch prep: mobile testing, security,
performance, bug fixes and closed beta.

Core order: **Avatar Studio → Wardrobe and saving → Fashion Battles →
Voting and scoring → Rewards → Profiles and sharing → Small social plaza
→ Expansion.**

Do not attempt advanced social features before the creative and battle
loops work.

## 13. Tests and acceptance criteria

Test: - Avatar layer composition and z-order. - Switching characters
without overwriting the other outfit. - Garment changes update only the
correct layer. - Save/restore outfits and presets. - Incompatible item
rejection. - Auth/session handling. - Battle submission
deadline/eligibility. - Self-vote and duplicate-vote prevention. -
Scoring. - Wallet ledger rules. - Server authorization and RLS where
test setup permits.

Browser acceptance: 1. New user reaches Studio in local demo mode if
auth is unconfigured. 2. User selects male/female. 3. Full-body
character renders on phone and desktop. 4. User changes hair, top,
bottom, shoes and accessories. 5. Front/back/side and expressions work
when assets exist. 6. Changing one layer does not distort unrelated
layers. 7. Outfit presets save, reload and switch. 8. Battles show
seeded demo themes. 9. Voting prevents self-votes and duplicates. 10.
Client cannot grant currency, item ownership or final battle results.
11. App builds and key flows pass tests.

First milestone is a playable Studio: a new user reaches it, previews
combinations without reload, saves/reloads an outfit and can use it on
desktop and narrow mobile.

## 14. Deliverables

Deliver: 1. Working rebuilt repository. 2. Responsive React/TypeScript
browser app. 3. Layered Avatar Studio with male/female selection, views,
expressions and outfit saving. 4. Working navigation and seeded/demo
content for unconnected screens. 5. Supabase migrations, RLS policies
and seed data. 6. Backend modules for trusted operations. 7.
`.env.example` with placeholders only. 8. README with
install/run/test/build/deploy instructions. 9. `docs/ASSET_PIPELINE.md`
documenting artboards, anchors, layer order, naming and adding items.
10. `docs/ARCHITECTURE.md` documenting modules and trust boundaries. 11.
Tests for critical game rules and user flows. 12. Final report
separating implemented, demo-only, credential-dependent and future
features; include build/test results and known limitations.

Do not claim the whole product is complete merely because the frontend
compiles. Start by inspecting the repository, then rebuild the
foundation and implement the Avatar Studio first. Continue through the
MVP in the order above while keeping the app runnable.
