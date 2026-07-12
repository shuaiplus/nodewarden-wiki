# Project Overview

NodeWarden is a Bitwarden-compatible server running on Cloudflare Workers. It is not a full clone of the official Bitwarden server. Instead, it puts a personal vault, an original Web Vault, attachments, Send, import and export, a backup center, and administration features into a lightweight deployment model.

You can think of it in three layers:

- **Server compatibility layer**: Provides the official-client APIs needed for `/identity/*`, `/api/sync`, `/api/ciphers/*`, attachments, Send, prelogin, token refresh, login requests, fill-assist, and related flows.
- **Web Vault**: The `webapp/` directory is an original frontend. It does not depend on the official Bitwarden Web Vault, and it supports vault management, import and export, the backup center, device and security settings, and administrator pages.
- **Cloudflare runtime layer**: The Worker handles APIs and static assets, D1 stores structured data, R2 or KV stores attachments and Send files, and a Durable Object powers realtime notifications.

## Who it is for

NodeWarden is for people who want a self-hosted vault, low operating cost, and a deployment model built around Cloudflare Workers. It is especially suitable for personal, family, and small-team instances.

It is not for scenarios that require enterprise organizations, collection permissions, SSO, SCIM, directory sync, or official commercial support. NodeWarden does not currently implement Bitwarden's organization and collection permission model, so it should not be treated as a replacement for Bitwarden Enterprise.

## Difference from Vaultwarden

Vaultwarden is a mature Rust server designed for traditional servers, Docker, databases, and self-managed reverse proxies. NodeWarden takes a different route: it prioritizes Cloudflare Workers, keeps deployment lighter, reduces the operations surface, and builds the backup center, Web Vault, and Cloudflare storage support directly into the project.

## Current feature overview

| Feature | Status | Notes |
| --- | --- | --- |
| Official client login | Supported | Password login, refresh tokens, API key login, passkey login. |
| Login requests | Supported | Approve passwordless or cross-device login on another device. See [Login Requests](/guide/core/login-requests). |
| `/api/sync` | Supported | Returns profile, folders, ciphers (including extended types), domains, sends, and decryption options expected by clients. |
| Web Vault | Supported | Original UI; device management under Settings → Security; fullscreen toggle. |
| Password security check | Supported | Web Vault only: manual exposed / reused / weak scan with HIBP k-anonymity. See [Password Security Check](/guide/security/password-security). |
| TOTP (vault + 2FA) | Supported | User-level 2FA; cipher TOTP including `steam://`; QR upload in the Web Vault. |
| Two-step providers | Supported | TOTP, YubiKey OTP, passkey 2FA, recovery codes, remembered devices. |
| Attachments | Supported | R2 preferred, KV optional; KV objects limited by Cloudflare's 25 MiB object limit. |
| Send | Supported | Text Send, file Send, password-protected Send, public access tokens, access-count control. |
| Import and export | Supported | Bitwarden JSON, CSV (multiline/custom fields), ZIP, NodeWarden extended formats. |
| Cloud backup center | Supported | WebDAV and S3-compatible storage (including R2, B2, Tigris presets), schedules, retention, remote browse, restore with checksum verification. |
| Multi-user | Supported | First user becomes administrator; later users usually register by invitation. |
| Website icons | Supported | Always on; proxied icons for the Web Vault list. |
| PWA / offline | Supported | Installable Web Vault with offline-oriented flows. |
| Organizations and collections | Not supported | `collections` returns an empty array; no organization permission model. |

## Design principles

NodeWarden follows several long-term principles:

- **Compatibility first**: Official clients may submit fields the server does not yet understand. Cipher data tries to preserve unknown fields so client upgrades do not cause the server to erase data.
- **Layered secret handling**: `JWT_SECRET`, backup target passwords, S3 secrets, and similar values are not treated as ordinary plaintext settings.
- **Backup allowlists**: Instance backups export only explicitly allowed tables and fields. Runtime locks, temporary tokens, audit logs, and other live-state data are not carried into backups.
- **Explainable failures**: Restore failures, attachment recovery, missing `JWT_SECRET`, KV large-file limits, and similar cases try to produce clear errors.

## Reading path

If you only want to deploy and use NodeWarden, start with:

- [Start Here](/guide/start)

If you already run an instance and need maintenance material, use:

- [Operate NodeWarden](/guide/operate)

If you plan to change code, review technical behavior, or contribute patches, use:

- [Contribute to NodeWarden](/guide/contribute)