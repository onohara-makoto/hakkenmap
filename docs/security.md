# Security: data isolation, storage and the AI endpoint

hakkenmap stores each user's finds (`public.observations`) and photos (Storage bucket `photos`).
Isolation between users is enforced **in the database** by Postgres Row Level Security, not by the UI.
The demo (`/demo`) never touches the database, so no policy is relaxed for it.

## Tables and policies

| Object | RLS | Who can do what |
|---|---|---|
| `public.observations` | on | SELECT / INSERT / UPDATE / DELETE only where `auth.uid() = user_id`. UPDATE reuses the same check for the new row, so a record cannot be reassigned to another user. |
| `public.users` | on | Profiles are readable by everyone; INSERT / UPDATE only your own row. |
| `public.photos` | on | Only rows whose parent observation you own. (Table is currently unused.) |
| `public.api_usage_daily` | on | SELECT your own row. Writes only through `increment_identify_usage()`. |
| `storage.objects` (bucket `photos`) | on | INSERT / SELECT / DELETE only when the first folder of the path equals `auth.uid()`. The bucket is **private**; photos are shown through short-lived signed URLs. |

All SQL lives in [`supabase/migrations/`](../supabase/migrations). The first five files were
reconstructed from the production database because they were originally run from the SQL editor.

### `increment_identify_usage(p_user_id, p_daily_limit)`

`SECURITY DEFINER` function used by `/api/identify` for the daily quota. It raises `forbidden` unless
`p_user_id = auth.uid()`, so one user cannot consume or read another user's quota. `EXECUTE` is
granted to `authenticated` only.

## Verifying isolation

[`supabase/tests/rls_test.sql`](../supabase/tests/rls_test.sql) creates two users inside a
transaction and checks, as user B, that B cannot read, update, delete, reassign or list user A's
records and photos, cannot spend A's quota, and that anonymous visitors see nothing. It ends with
`ROLLBACK`.

```bash
# Local Supabase (Docker) — this is what CI runs
supabase init --force && supabase db start
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
```

To check the production database without leaving data behind, run only the `DO $$ … $$` block in the
SQL editor after replacing the final `raise notice 'RLS OK…'` with `raise exception 'RLS OK…'`.
The block then always aborts, so all test rows are rolled back; the message `RLS OK` means every
check passed, any other message names the failed check.

`scripts/verify-rls.mjs` does the same through the public API with two real test users
(needs `SUPABASE_SERVICE_ROLE_KEY`; the users are deleted afterwards).

## AI identification endpoint (`POST /api/identify`)

| Check | Response |
|---|---|
| Not signed in | `401 unauthenticated` (checked before the body is read) |
| Body not multipart / no image / not JPEG, PNG, WebP or HEIC by magic bytes | `400 invalid_image` |
| Larger than 8 MB (by `Content-Length` or actual size) | `413 image_too_large` |
| More than 20 calls per user per day (JST) | `429 rate_limited` + `Retry-After` |
| Gemini overloaded / timed out (20 s) | `503 ai_unavailable` |
| Gemini error or unparsable answer | `502 ai_error` |

Only images that pass validation count toward the quota. The Gemini key is read from
`GEMINI_API_KEY` on the server and is never sent to the browser. The browser shrinks photos to
1600 px before sending, and maps every failure (including HTML error pages from a proxy and network
errors) to a message the user can act on; the button stays available for a retry.

## Photos

* Paths are `<user_id>/<observation_id>.<ext>`. The observation id is generated in the browser
  before saving and reused on retry, so retries never create a second record or a second file.
* If the record cannot be saved after the photo upload, the photo is deleted once the app has
  confirmed the record does not exist.
* Deleting a record also deletes its photo. If that fails, the record is still deleted and the
  file is left for `scripts/cleanup-orphan-photos.mjs` (dry run by default, `--delete` to remove,
  ignores files younger than 24 h).
* Signed URLs are issued when finds are loaded (24 h validity) instead of being stored in the
  database. Records saved before this change are read through their old URL's path, so they keep
  working after the old 365-day URLs expire.

## Known gaps

* Leaked-password protection (Supabase Auth → Policies) is off. Sign-in is Google OAuth only, so
  the impact is low, but it can be enabled in the dashboard.
* The rate limit is per user, not per IP; it limits cost, not sign-up abuse.
