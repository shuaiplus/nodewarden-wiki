# Backend Routes and Services

The backend is a Cloudflare Worker, not a traditional long-running server. The main structure is: `index.ts` handles entry and initialization, routers handle authentication and dispatch, handlers implement protocol behavior, and services own reusable logic and persistence boundaries.

## Request entry

`src/index.ts`:

- Registers the `NotificationsHub` Durable Object.
- Separates static assets from API requests.
- Normalizes paths for hash routes, duplicate slashes, and client path differences.
- Runs D1 schema initialization.
- Passes API requests to `handleRequest()`.
- Starts scheduled backup scans in the scheduled handler.

If database initialization fails, normal APIs return an error and scheduled backup is skipped, avoiding writes against an incomplete schema.

## Router layers

| File | Responsibility |
| --- | --- |
| `src/router.ts` | Main gateway: CORS, body limits, public routes, `JWT_SECRET` check, Bearer token verification, rate limits, authenticated routes. |
| `src/router-public.ts` | Prelogin and public APIs: config, token, registration, password hint, public Send, attachment short tokens, icons, and notification negotiate. |
| `src/router-authenticated.ts` | Logged-in APIs: account, vault, folders, attachments, Send, domain rules, devices, and admin dispatch. |
| `src/router-devices.ts` | Device list, device keys, remembered devices, trust state, and official-client compatible device paths. |
| `src/router-admin.ts` | Users, invites, user status, and user deletion. |
| `src/router-admin-backup.ts` | Backup export, import, remote backup, remote browse, integrity check, and restore. |

Important boundaries:

- Public routes do not require Bearer tokens, but login, registration, and password-hint paths still have origin checks or rate limits.
- Missing, example, or too-short `JWT_SECRET` blocks authenticated APIs.
- Attachments, Send files, and backup import use separate large-file limits rather than the normal JSON API size limit.
- Vault import and attachment upload during import can use `X-NodeWarden-Import: 1` to avoid normal authenticated API rate limits.
- Unimplemented organization, collection, and policy APIs return empty compatible structures, not usable enterprise features.

## Handler layer

`src/handlers/` is the protocol behavior layer. It should parse requests, call business services, and assemble responses. Shared storage, crypto, signing, and backup rules should not be scattered across multiple handlers.

| Area | Main files |
| --- | --- |
| Accounts and auth | `accounts.ts`, `identity.ts`, `devices.ts` |
| Vault | `sync.ts`, `ciphers.ts`, `folders.ts`, `domains.ts` |
| Files | `attachments.ts`, `sends*.ts` |
| Administration | `admin.ts`, `backup.ts` |
| Notifications | `notifications.ts` |

Vault handlers must treat official-client compatibility carefully: unknown field preservation, `EncString` shape, revision updates, stale update protection, and `/api/sync` output belong together.

Device handlers serve both the Web Vault and official clients. `knowndevice` is a public prelogin check. Device list, trust state, device key, push token, and clear-token paths are authenticated, and several exist to match different official-client versions.

## Service layer

`src/services/` contains reusable logic and persistence boundaries:

| Service | Responsibility |
| --- | --- |
| `auth.ts` | Access tokens, refresh tokens, API keys, and `securityStamp` checks. |
| `storage*.ts` | D1 aggregate service, repositories, schema initialization, cleanup, and revision updates. |
| `blob-store.ts` | R2/KV blob read, write, and delete abstraction. |
| `ratelimit.ts` | Public and authenticated API rate-limit budgets. |
| `domain-rules.ts` | Global and custom equivalent-domain rule merge. |
| `backup-*.ts` | Backup ZIP, restore, config normalization, encryption envelope, and remote upload. |

`src/config/limits.ts` is the shared source for cross-layer limits. Confirm token TTLs, request sizes, attachment and Send limits, pagination limits, rate budgets, sync cache, and Bitwarden compatibility versions there rather than duplicating numbers in the wiki or UI.

## Change rules

- For a new API, decide whether it is public, authenticated, or admin.
- For a persistent field, check schema, backup, sync, import/export, and frontend types.
- For a client compatibility field, verify `/identity/*` and `/api/sync`; do not only fix the Web Vault.
- For a long-running task, prefer the notification hub and progress events.
