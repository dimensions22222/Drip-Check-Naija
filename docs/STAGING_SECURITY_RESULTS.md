# Staging Security Results

## Overall status

**NOT READY FOR PRIVATE BETA**

Static repository review and read-only staging checks passed only for configuration shape and database publication. Live authenticated RLS and realtime authorization tests were not possible in this pass.

No secrets or test credentials are recorded here.

## Confirmed configuration result

| Area | Result | Status |
|---|---|---|
| Project | `projectx` / `fmfhadxoqhixcaqpkgos` | PASS |
| Project status | `ACTIVE_HEALTHY` | PASS |
| Project URL | Exact staging URL in `.env.local` | PASS |
| Browser key | Publishable key format; no secret key | PASS |
| Key exact match | Dashboard publishable key differed in case from `.env.local`; corrected | PASS after fix |
| Realtime publication | `public.city_chat_messages` is in `supabase_realtime` | PASS |
| Repository migrations | Realtime and migration history visible in the staging database | PASS |

## Security findings

### Realtime channels are not private by configuration

- **Severity:** Release blocker
- **Result:** FAIL until live verification and server authorization are added
- **Evidence:** Drip City creates `drip-city:<roomId>` channels without `config: { private: true }`. The migration does not add Realtime authorization policies for `realtime.messages`.
- **Impact:** Direct SDK users may attempt to subscribe or broadcast on known room topic names if channel access is not otherwise restricted.
- **Fix applied:** None; the README already identifies private-channel authorization as a release blocker.
- **Required fix:** Define authenticated/private Realtime channel authorization for room topics and movement/presence events. Keep room isolation and reject mismatched public IDs server-side. Live testing must confirm anonymous subscribers and cross-room subscribers fail.

### Chat and moderation SQL exists but is untested live

- **Severity:** High until verified
- **Result:** NOT TESTED
- **Evidence:** The migration defines authenticated RLS policies and security-definer moderation/chat functions, including room validation and rate limiting.
- **Required verification:** Use separate browser sessions and attempt direct inserts/updates/deletes, unauthorized RPC calls, blocked/muted reads, and report modification.

### Direct profile and data writes

- **Severity:** High until verified
- **Result:** NOT TESTED
- **Evidence:** Repository and migration files contain owner-scoped policies and revoke/grant boundaries. SQL existence alone does not prove the public browser behavior.
- **Required verification:** Attempt reads and writes with two authenticated sessions, including private outfits, private avatars, inventory, profile XP/level, follows, likes, showcases, and reports.

## Manual authorization checks

Run these checks with real staging accounts only:

1. In an anonymous browser, open DevTools and attempt `supabase.channel('drip-city:<valid-room>').subscribe()` after the app has loaded. It must not receive presence or movement.
2. With Account A, attempt to subscribe to room B while room B is not the active room. It must not receive room B movement or chat.
3. With Account A, attempt to send a movement/broadcast payload whose `publicId` belongs to Account B. The server or application must reject or ignore it.
4. With Account A, direct-insert a `city_chat_messages` row and verify it is denied.
5. With Account B, update or delete Account A's outfit, avatar, inventory row, chat row, or report and verify denial.
6. With Account A, attempt to raise its `xp` or `level` through a direct table update and verify denial.
7. Test blocked/muted behavior in both directions.

## Remaining dashboard configuration

Configure in the `projectx` dashboard:

- Add `http://localhost:5173/**` to Auth redirect URLs.
- Set the Site URL to `http://localhost:5173` for local testing.
- Add each approved deployment origin with `/**`.
- Verify email provider and confirmation policy.
- Add and test server-side private Realtime channel authorization.
- Do not add service-role keys to Vite variables or `.env.local`.

## Private beta readiness

**NOT READY**
