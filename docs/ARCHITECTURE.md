# Architecture and trust boundaries

The avatar catalog holds typed wearable metadata and independent character-compatible selections. The avatar renderer composes layers in a fixed z-order. The app shell runs in local/demo mode without credentials; when configured, a typed Supabase client provides email Auth, owner-scoped profiles/avatars/outfits, public active catalogue reads, and owner-only inventory reads. Cloud outfits are cached separately from local drafts and never replace them on sign-in.

The Supabase schema keeps RLS enabled. Browser clients can read only their own profile, avatar, inventory and outfits; active catalogue rows are public and read-only. Outfit item IDs are checked by a database trigger against active catalogue slugs, slots, and character compatibility. Profile column grants exclude level and XP. No service-role key belongs in Vite variables.

No trusted game backend, economy, inventory grants, purchases, battle submission, voting, scoring, rewards, social features, or moderation operations are implemented. Future sensitive mutations must run in trusted server-side RPC/API transactions with ownership checks and validation. The client must never submit a balance, price, result, or arbitrary asset URL as authority.
