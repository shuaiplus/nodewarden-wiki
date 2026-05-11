# Architecture Overview

NodeWarden is a single-Worker application. The frontend, APIs, storage, and scheduled tasks are organized around Cloudflare bindings.

## Directory structure

```text
src/
  handlers/       API business handlers
  services/       D1, backup, storage, rate limit, domain rules, and shared services
  utils/          JWT, responses, TOTP, UUID, device parsing, and helpers
  durable/        Durable Object notification hub
  static/         Static global domain rule data
webapp/
  src/            Preact Web Vault
shared/
  backup-schema.ts
  app-version.ts
migrations/
  0001_init.sql   Initial D1 schema
wiki/
  VitePress documentation
```

## Request lifecycle

```text
src/index.ts
  normalizeRequestUrl()
  maybeServeAsset()
  ensureDatabaseInitialized()
  handleRequest()

src/router.ts
  CORS
  request size limits
  public route
  JWT_SECRET safety check
  access token verification
  user status check
  authenticated API rate limit
  authenticated route
```

Public routes include registration, prelogin, login, public Send, attachment short links, icons, and related endpoints. Authenticated routes require a Bearer token.

## Storage layer

Structured data is stored in D1:

- users
- user_revisions
- folders
- ciphers
- attachments
- sends
- refresh_tokens
- devices
- trusted_two_factor_device_tokens
- domain_settings
- invites
- config
- audit_logs
- login_attempts_ip
- used_attachment_download_tokens

Binary data is stored in R2/KV:

- Attachment bodies
- Send file bodies

## Notification layer

Durable Object `NotificationsHub` powers Web Vault events such as:

- Vault sync revision updates.
- Backup export progress.
- Remote backup progress.
- Backup restore progress.

This lets the Web Vault observe long-running task status without blind waiting.

The notification layer is described in [Realtime Notifications](/guide/architecture/realtime-notifications). It accelerates refresh and progress reporting; final data still comes from APIs and `/api/sync`.

## Frontend build

`webapp/` uses Vite and Preact. Build command:

```powershell
npm run build
```

The output is written to `dist/` and served by Worker assets.

Demo mode uses:

```powershell
npm run build:demo
```

## Scheduled tasks

Cloudflare cron calls the Worker scheduled handler every 5 minutes. It currently scans only backup schedules:

```text
src/index.ts -> scheduled() -> runScheduledBackupIfDue()
```

If database initialization fails, scheduled backup is skipped and logged.
