# DRIP CHECK NAIJA — Browser Starter

A browser-first prototype scaffold based on the uploaded DRIP CHECK NAIJA Product Blueprint.

## Included in this starter

- React + TypeScript + Vite application shell
- Responsive dark fashion-game interface
- Avatar Studio with selectable skin tone, hair, tops, bottoms, shoes and accessories
- Local browser saving for the current outfit (`localStorage`)
- Phaser 3 Drip City starter plaza with WASD / arrow-key movement
- Placeholder Battles, Wardrobe and Profile screens
- Mobile-responsive layout

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A modern browser (Chrome, Edge, Firefox or Safari)

## Run locally

1. Extract this ZIP.
2. Open a terminal in the `drip-check-naija-starter` folder.
3. Install packages:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The production files are created in `dist/`. Deploy that folder to Cloudflare Pages, Netlify or another static host.

## Project structure

```text
drip-check-naija-starter/
├── public/
├── src/
│   ├── components/
│   │   └── PhaserWorld.tsx
│   ├── game/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Important: prototype boundaries

This is a runnable frontend starter, not a finished online game. It does **not** yet include:
- Real user registration or login
- Supabase database, authentication or realtime configuration
- Server-authoritative inventory, currency, voting or rewards
- Real multiplayer presence or chat
- Production avatar artwork / layered sprite assets
- Payment integration, moderation tools or anti-cheat

The starter saves the outfit only in the current browser. Do not use client-side state as the authority for player balances, item ownership, votes or battle results.

## Recommended next development stages

1. Replace the illustrative SVG avatar with a consistent layered sprite pipeline.
2. Add Supabase Auth and PostgreSQL tables with Row Level Security.
3. Implement outfit ownership and saved outfit records.
4. Implement battle themes, submissions, anonymous voting and server-side scoring.
5. Add a trusted backend for rewards and the immutable wallet transaction ledger.
6. Expand Drip City with map tiles, animated character sprites and mobile touch controls.
7. Add moderation, testing, monitoring and production deployment.

## Blueprint alignment

The project follows the blueprint's recommended first milestone: React + TypeScript + Vite, a responsive application shell, a layered-avatar preview, selectable outfit parts, saving/reloading in the browser, and desktop/mobile layouts. The avatar artwork in this starter is deliberately illustrative; replace it with production art before launch.
