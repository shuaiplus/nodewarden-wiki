# Cloudflare Settings

NodeWarden's default deployment target is Cloudflare Workers. The repository builds the frontend into `dist/`, and the Worker serves both APIs and static assets.

## Runtime structure

```text
Browser / official client
        |
        v
Cloudflare Worker
  |-- Static assets via ASSETS -> dist/
  |-- API routes -> src/router.ts
  |-- D1 -> users, ciphers, folders, attachment metadata, Send, config
  |-- R2/KV -> attachment and Send file bodies
  |-- Durable Object -> frontend realtime notifications
```

`src/index.ts` first tries to serve frontend assets through `ASSETS`. Requests under `/api/`, `/identity/`, `/icons/`, `/notifications/`, `/.well-known/`, `/config`, and similar API paths are handled by the Worker API.

## `wrangler.toml` bindings

The default `wrangler.toml` uses these bindings:

```toml
name = "nodewarden"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[assets]
binding = "ASSETS"
directory = "./dist"
not_found_handling = "single-page-application"
run_worker_first = false

[triggers]
crons = [ "*/5 * * * *" ]

[[d1_databases]]
binding = "DB"
database_name = "nodewarden-db"

[[durable_objects.bindings]]
name = "NOTIFICATIONS_HUB"
class_name = "NotificationsHub"

[[r2_buckets]]
binding = "ATTACHMENTS"
bucket_name = "nodewarden-attachments"
```

`crons = [ "*/5 * * * *" ]` wakes the scheduled handler every 5 minutes. Whether a backup actually runs depends on the backup target timezone, start time, interval, and last run time.

## Required resources

| Binding | Required | Purpose |
| --- | --- | --- |
| `DB` | Yes | D1 database for structured data. |
| `JWT_SECRET` | Yes | Used by JWTs, attachment short links, Send short links, and backup settings runtime encryption. |
| `NOTIFICATIONS_HUB` | Yes | Realtime sync and backup progress notifications for the Web Vault. |
| `ASSETS` | Yes | Frontend static assets. |
| `ATTACHMENTS` | Recommended | R2 storage for attachments and Send files. |
| `ATTACHMENTS_KV` | Optional | KV fallback storage for attachments and Send files. |

## Automatic database initialization

NodeWarden does not require you to run SQL manually. When the Worker handles its first request, it calls:

- `src/index.ts` -> `ensureDatabaseInitialized()`
- `src/services/storage.ts` -> `initializeDatabase()`
- `src/services/storage-schema.ts` -> `ensureStorageSchema()`

The initializer creates the `config` table first, then reads `config.schema.version`. If the version changed, it runs idempotent SQL and writes the new version back.

After an update, existing instances automatically fill in missing tables, columns, and indexes as long as the schema version was changed correctly.

## R2 deployment

R2 is the recommended mode. It has a wider large-file path and keeps attachment and Send file bodies out of D1.

Use `wrangler.toml`, bind an R2 bucket named `ATTACHMENTS`, and deploy with:

```powershell
npm run deploy
```

The default attachment soft limit is controlled by NodeWarden config and is currently 100 MB. This is independent from D1 because the binary body is stored in R2.

## KV deployment

KV mode is useful when you want a no-card setup or only small attachments. Use `wrangler.kv.toml`, bind `ATTACHMENTS_KV`, and deploy with:

```powershell
npm run deploy:kv
```

KV single-object limits apply. NodeWarden caps attachment and Send file bodies to 25 MiB in KV mode.

## Durable Object migrations

Realtime notifications use `NotificationsHub`. If Cloudflare asks you to apply a Durable Object migration, make sure the binding and migration class name still match the project config.

Without the Durable Object binding, core vault APIs can still exist, but realtime Web Vault refreshes, device status, and backup progress notifications will break.
