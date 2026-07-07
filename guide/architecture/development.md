# Development Conventions

If you have not yet identified which files a change touches, start with the [Change Map](/guide/architecture/change-map). This page lists commands and local rules; cross-layer impact should be reasoned from the change map.

## npm scripts and `scripts/`

| npm script | Purpose | Underlying script / notes |
| --- | --- | --- |
| `dev` / `dev:kv` | Local Worker + webapp | `wrangler dev` with `wrangler.toml` or `wrangler.kv.toml`. |
| `dev:demo` | Demo webapp only | Vite on port 5174, `demo` mode. |
| `build` | Production frontend | Vite → `dist/` for Worker assets. |
| `build:demo` | Demo static site | Vite demo build + `scripts/pages-spa-redirects.cjs`. |
| `deploy` / `deploy:kv` | Publish Worker | `deploy:kv` runs `scripts/ensure-kv.cjs` first. |
| `deploy:demo` | Pages demo | `build:demo` then `wrangler pages deploy`. |
| `domains:sync` | Refresh Bitwarden global domains | `scripts/sync-global-domains.mjs` (`--ref` optional). |
| `i18n` / `i18n:validate` | Locale completeness | `scripts/i18n-validate.cjs` (uses `i18n-utils.cjs`). |

There is no `sync-upstream` npm script; fork sync is a GitHub/git operation.

## Recommended checks

Backend or shared code:

```powershell
npx tsc -p tsconfig.json --noEmit
npm run build
```

Frontend copy or i18n:

```powershell
npm run i18n:validate
npx tsc -p webapp/tsconfig.json --noEmit
npm run build
```

Wiki:

```powershell
cd nodewarden-wiki
npm run build
```

## High-risk areas

Keep changes especially careful around:

- `src/handlers/ciphers.ts`
- `src/handlers/sync.ts`
- `src/services/storage-cipher-repo.ts`
- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `src/services/backup-settings-crypto.ts`
- `src/handlers/identity.ts`
- `src/handlers/accounts.ts`
- `src/services/storage-schema.ts`

## i18n principle

Frontend locale files are complete independent bundles, not English plus incremental overrides. Add new copy to every locale and run i18n validation.

## Backup change principle

Backup export and import are a contract. For persistent data, do not update only export or only import. At minimum, check:

- Payload types
- SQL queries
- Manifest table counts
- Content validation
- Shadow-table import
- Frontend count types

## Cipher field principle

Do not delete unknown fields casually. Official clients may already depend on them. Cipher logic should continue to:

- Preserve unknown fields.
- Override server-owned fields.
- Normalize critical encrypted fields for compatibility.
- Filter clearly broken data before sync.
