# Architecture and trust boundaries

The avatar catalog holds typed wearable metadata and independent character-compatible selections. The avatar renderer composes layers in a fixed z-order. The app shell is the local/demo UI. Local storage is a demo fallback only; it is not a source of truth for rewards, ownership, voting, or results.

The Supabase schema keeps RLS enabled. Browser clients may read public catalog/battle data and their own profile, inventory, outfits, vote history and ledger entries. Mutations that award currency, fulfil purchases, validate outfit ownership, submit battle entries, or cast votes must run in a server-side RPC/API with the service role, transaction boundaries, deadline checks, one-entry and one-vote enforcement, and self-vote rejection. No service-role key belongs in Vite variables.

Next server modules: Auth, Players, Inventory, Wardrobe, Battles, Voting, Economy, Social, Events, and Moderation. The client must submit item IDs only; it must never submit a balance, price, result, or arbitrary asset URL.
