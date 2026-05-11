# Change Map

This page is for maintainers and contributors. Before changing NodeWarden, first identify what the user action is, then follow the request, storage, sync, backup, frontend state, and automation boundaries together.

## Classify the change

| Change type | Main entry | Check together |
| --- | --- | --- |
| Login, registration, master password, API key | `src/handlers/identity.ts`, `src/handlers/accounts.ts`, `src/services/auth.ts` | `securityStamp`, refresh tokens, devices, official-client response fields, Web Vault `app-auth.ts`. |
| Ciphers, folders, sync | `src/handlers/ciphers.ts`, `src/handlers/folders.ts`, `src/handlers/sync.ts` | Revision date, `cipherToResponse()`, unknown field passthrough, import/export, `/api/sync` cache, frontend decryption. |
| Attachments | `src/handlers/attachments.ts`, `src/services/blob-store.ts` | D1 metadata, R2/KV blob, short tokens, one-time download `jti`, backup attachment restore. |
| Send | `src/handlers/sends*.ts`, `src/services/storage-send-repo.ts` | Public access token, password verification, file blob, access count, deletion date, backup boundary. |
| Domain rules | `src/handlers/domains.ts`, `src/services/domain-rules.ts` | Static rule files, user exclusions, D1 `domain_settings`, global domain sync Action. |
| Website icons | `src/router-public.ts`, `webapp/src/components/vault/WebsiteIcon.tsx` | Upstream order, fallback, cache TTL, frontend lazy loading and error cache. |
| Realtime notifications | `src/durable/notifications-hub.ts`, `src/handlers/notifications.ts`, `webapp/src/App.tsx` | SignalR handshake, user DO, device targeting, vault sync and backup progress. |
| Backup center | `src/handlers/backup.ts`, `src/services/backup-*.ts`, `shared/backup-schema.ts` | Run lock, settings encryption envelope, ZIP manifest, remote attachment index, shadow-table import, audit log. |
| Database schema | `migrations/0001_init.sql`, `src/services/storage-schema.ts`, `src/services/storage.ts` | Schema version, backup export/import, frontend types, automatic initialization for old instances. |
| Frontend page or flow | `webapp/src/App.tsx`, `webapp/src/components/*`, `webapp/src/lib/api/*` | Routes, mobile, dark theme, i18n, React Query refresh, background preload. |
| Copy and language | `webapp/src/lib/i18n/*` | Every locale must be complete; run `npm run i18n:validate`. |

If a change crosses persistent data, official-client responses, or backup restore, do not patch only one layer. Many NodeWarden bugs are of the form “saved but not synced”, “synced but not backed up”, or “works in the Web Vault but not in official clients”.

## How one user operation flows

A typical authenticated Web Vault operation flows through:

```text
frontend component
  -> webapp/src/lib/api/*
  -> src/router.ts
  -> src/router-authenticated.ts or router-admin*.ts
  -> src/handlers/*
  -> src/services/*
  -> D1 / R2 / KV / Durable Object
  -> response
  -> React Query invalidate/refetch or local state update
```

Official clients do not use Web Vault components, but they hit the same Worker APIs. Fixing only `webapp/` does not prove official clients work. Returning a field from a handler does not prove frontend decryption, caching, and mobile state are correct.

## Persistent data checklist

When adding or changing persistent data, check in this order:

1. Does `migrations/0001_init.sql` need a table, column, or index?
2. Does `src/services/storage-schema.ts` include matching idempotent SQL?
3. Did `STORAGE_SCHEMA_VERSION` in `src/services/storage.ts` get bumped?
4. Does a `src/services/storage-*-repo.ts` file own reading and writing it?
5. Should `src/services/backup-archive.ts` export it?
6. Should `src/services/backup-import.ts` import it, validate it, and restore it through shadow tables?
7. Do `shared/backup-schema.ts` or frontend backup types need updates?
8. Should `/api/sync` or a frontend query include it?
9. Should an audit log be written, or should the data be deliberately excluded from instance backups?

Runtime data does not enter backups by default. Refresh tokens, device sessions, login failure limits, one-time download tokens, backup run locks, and audit logs are not migratable vault data.

## Automation boundaries

| Automation | Trigger | Changes | Should not change |
| --- | --- | --- | --- |
| `Sync upstream` | Daily schedule or manual commit/tag | Syncs fork `main` to upstream release or target commit. Manual mode may force-push. | Should not let upstream overwrite `.github/workflows/sync-upstream.yml`. |
| `Sync Bitwarden global domains` | Weekly schedule or manual `bitwarden_ref` | `src/static/global_domains.bitwarden.json`, `src/static/global_domains.bitwarden.meta.json`. | `src/static/global_domains.custom.json`. |
| `Security Scan` | push, PR, manual | Generates scan reports and artifacts. | Does not edit business code. |
| `npm run build` | Local or deployment | Generates `dist/` frontend assets. | Does not prove D1 schema has executed on a remote instance. |
| `cd wiki && npm run build` | Local documentation verification | Generates VitePress output. | Does not prove the main app build passes. |

Contributor PRs should distinguish generated files, project-owned files, and user data stored in D1.

## What to run after changes

| Change | Suggested checks |
| --- | --- |
| Backend, shared types, schema | `npx tsc -p tsconfig.json --noEmit`, `npm run build`. |
| Frontend components, routes, styles | `npx tsc -p webapp/tsconfig.json --noEmit`, `npm run build`, and desktop/mobile inspection. |
| i18n | `npm run i18n:validate`, then `npm run build`. |
| wiki | Run `npm run build` inside `wiki`. |
| Backup restore | Think through local export, remote backup, hash verification, fresh instance, and replace-existing branches. |
| Official-client compatibility | Check `/identity/connect/token`, `/api/sync`, and attachment/Send direct upload response shapes. |

Run the checks that cover the contract changed by the patch.

## What good wiki pages should explain

A good NodeWarden wiki page should answer:

- Where users operate the feature.
- Which API requests are made.
- Which handlers and services own the behavior.
- Whether data is stored in D1, R2/KV, Durable Object, or static files.
- Whether revision date, `securityStamp`, refresh tokens, audit logs, or backup runtime state change.
- Which files contributors should change and which files are generated.
- Which GitHub Actions or scripts update files automatically.
- What users see on failure and where maintainers should debug.

Writing “feature supported” is not enough. The wiki should explain why the feature is designed this way and what moves together when it changes.
