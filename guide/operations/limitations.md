# Limits and Boundaries

NodeWarden targets lightweight self-hosting and compatibility with common official client workflows. It is not a full Bitwarden Enterprise server. Confirm these boundaries before deployment.

## Cloudflare platform boundaries

NodeWarden runs on Cloudflare Workers and is affected by platform limits:

- JSON API body size is limited by `request.maxBodyBytes` in `src/config/limits.ts`.
- Attachment and Send file size depends on both NodeWarden limits and Cloudflare storage limits.
- KV mode has a smaller single-object limit and is better for no-card setups and small attachments. Use R2 for large attachments.
- Very large imports may be limited by Worker execution time, client timeouts, or D1 batch SQL limits. Split imports when needed.
- Long-running work should use background flows and progress notifications, not one long open HTTP request.

## Bitwarden features not implemented

NodeWarden does not currently implement:

- Organizations
- Collections and collection member permissions
- Enterprise policies
- SSO
- SCIM
- Directory sync
- Organization event logs
- Enterprise administrator password reset
- Email-sent verification, invitation, or password hint flows (related API routes may return explicit **unsupported** responses)

Some related APIs return empty lists so personal vault flows can continue. That does not mean the feature is available.

## Partially supported features

| Feature | Current boundary |
| --- | --- |
| Login 2FA | User-level **TOTP**, **YubiKey OTP**, **passkey 2FA**, remembered devices, and recovery codes. Not every official enterprise 2FA provider. |
| Passkey login | Full account-level WebAuthn/FIDO2 login and optional vault unlock (PRF). See [Passkey Login](/guide/security/passkey-login). |
| Login requests | Approve/deny passwordless and cross-device flows; see [Login Requests](/guide/core/login-requests). Not full Bitwarden organization admin auth. |
| Notifications | Durable Object notification center; clients should still treat `/api/sync` as the final consistency source. |
| API key login | Personal API key `client_credentials` login; secrets stored as hashes server-side. API key authenticates the client but does not replace the master password for vault unlock. |
| Extended cipher types | Bank account, driver's license, passport, SSH key, FIDO2 fields in ciphers; EncString validation applies. |
| Cipher TOTP | Bitwarden-aligned TOTP storage and `steam://` URIs in login URIs. |
| Website icons | Always enabled; proxies upstream sources with privacy limits. See [Website Icons](/guide/core/website-icons). No `WEBSITE_ICONS_ENABLED` env toggle. |
| Remote backup | WebDAV and S3-compatible storage (R2, B2, Tigris presets); reliability depends on the provider. Import lock and ZIP checksum on full restore. |
| Fill-assist | `POST /fill-assist` for client autofill assist; does not bypass vault unlock. |

## Security boundaries

- `JWT_SECRET` must be stable and strong. Missing, example, or too-short secrets block registration or authenticated APIs.
- `users.master_password_hash` is only a server-side login verification value, not a vault decryption key. A forgotten master password cannot be recovered by editing the database.
- Password hints are returned by lookup APIs. Do not put the master password, recovery code, API key, or anything that directly unlocks the vault into the hint.
- Backup target WebDAV/S3 secrets must use the backup settings encryption envelope, not ordinary plaintext config export.
- Offline or offsite backup is still necessary. Self-hosting does not remove the need for backup.

## Change boundaries

- When adding persistent data, check schema, backup, import/restore, and sync responses together.
- When adding client compatibility fields, follow actual official-client requests and `/api/sync` parsing results.
- When adding security config, decide whether it belongs in Cloudflare Secrets, encrypted D1 config, or non-persistent runtime state.