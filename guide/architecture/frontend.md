# Frontend Architecture

NodeWarden's Web Vault is an original Vite + Preact application inside the repository. It does not depend on the official Bitwarden Web Vault. It covers vault management, Send, import/export, the backup center, device management, administrator pages, and demo mode.

## Stack

| Dependency | Purpose |
| --- | --- |
| `preact` | Component runtime. |
| `@tanstack/react-query` | Remote data fetching, caching, and refresh. |
| `wouter` | Lightweight routing. |
| `lucide-preact` | Icons. |
| `@zip.js/zip.js`, `fflate` | Import/export and backup ZIP handling. |
| `qrcode-generator` | TOTP QR codes. |
| `tailwindcss`, `postcss`, CSS | Styling build. |

The build entry is `webapp/vite.config.ts`. Production output goes to root `dist/` and is then served by Worker assets.

## App control layer

`webapp/src/App.tsx` is the frontend control layer. It owns session state, login/register, lock/unlock, global queries, notification connection, administrator capability, backup capability, and main route dispatch.

After the main UI becomes usable, `app-preload.ts` warms some lazy resources and locale chunks in the background to reduce later page-switch latency.

Web Vault login uses `X-NodeWarden-Web-Session: 1`. The server puts the refresh token into an HttpOnly cookie. The frontend stores only email, auth mode, and unlock session state, avoiding plaintext refresh tokens in localStorage.

## Page layers

| Area | Main components |
| --- | --- |
| Authentication | `AuthViews.tsx` |
| App shell | `AppAuthenticatedShell.tsx`, `AppMainRoutes.tsx` |
| Vault | `VaultPage.tsx`, `components/vault/*` |
| Send | `SendsPage.tsx`, `PublicSendPage.tsx` |
| Settings and security | `SettingsPage.tsx`, `SecurityDevicesPage.tsx` |
| Administration and backup | `AdminPage.tsx`, `BackupCenterPage.tsx`, `components/backup-center/*` |
| Other tools | `DomainRulesPage.tsx`, `ImportPage.tsx`, `NotFoundPage.tsx` |

Large pages should keep using feature-domain subcomponents. The goal is to reduce cognitive load and render cost, not to create tiny wrapper components for their own sake.

## Data and API flow

Components should prefer helpers under `webapp/src/lib/api/` instead of scattered handwritten `fetch` paths.

Typical flow:

```text
component event -> action/hook -> lib/api/* -> authedFetch/session refresh
  -> Worker API -> React Query invalidate/refetch -> UI update
```

Session logic is mostly around `app-auth.ts`, `app-support.ts`, and `crypto.ts`. Vault decryption logic is mostly in `vault-decrypt.ts`, `decrypt-cipher.ts`, `vault-worker.ts`, and `vault-cache.ts`.

## Routes and permissions

The frontend supports regular paths and some hash-route compatibility. Main routes include:

| Route | Page |
| --- | --- |
| `/login`, `/register`, `/lock`, `/recover-2fa` | Login, registration, lock, and 2FA recovery. |
| `/vault`, `/vault/totp` | Vault and authenticator code view. |
| `/sends` | Send management. |
| `/send/{id}` | Public Send access, optionally with key. |
| `/settings`, `/settings/account`, `/settings/domain-rules` | Settings home, account settings, and domain rules. |
| `/security/devices` | Device management. |
| `/backup` | Backup center, administrator only. |
| `/admin` | Users and invites, administrator only. |
| `/backup/import-export` and old aliases | Import/export tools. |

When adding a page, check:

- Whether it is accessible before login.
- Whether it requires admin permission after login.
- Mobile title, navigation, and back path.
- Unknown path behavior through `NotFoundPage.tsx`.
- Public Send route conflicts with authenticated routes.

Mobile `/settings` is the settings entry page. Desktop tends to go directly to account settings. Verify both viewport types.

## i18n

`webapp/src/lib/i18n.ts` is the language loading entry. Locale files must be complete independent bundles, not incremental overlays on English.

Rules:

- Persist the selected language locally.
- Local selection wins over browser language.
- Load language packs on demand and hard-fallback to English on failure.
- Add new copy to every locale and run `npm run i18n:validate`.
- Do not call `t()` at module top level to build constants before async initialization.

Production builds split non-English locale packs into separate chunks. Adding a language requires updating the `Locale` type, available locale list, browser detection, dynamic loader, validation script, and complete locale file.

## Build strategy

`webapp/vite.config.ts` has two important strategies:

- Normal production builds write noindex robots; demo builds allow indexing.
- Main app pages are grouped into the `app-suite` chunk, while non-English locales are separate chunks, avoiding a first-screen load of every language and every large page.

## Styling and mobile

This frontend should feel like serious management software, not a marketing page. When maintaining it:

- Compress mobile form rhythm as a whole, not just one button.
- Avoid excessive empty space on settings, backup center, and detail pages on phones.
- Put secondary explanations behind disclosure or on-demand UI when appropriate.
- Check dark theme, error states, empty states, and loading states together.

## Change rules

- For new remote data, use React Query query/mutation paths and shared error handling.
- For new routes, check `App.tsx`, navigation, 404, and mobile titles.
- For large features, consider lazy loading or background preloading.
- For cipher shape changes, check encryption, decryption, import, export, sync, and official-client compatibility.
