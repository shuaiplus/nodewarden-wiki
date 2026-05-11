# API Reference

This page summarizes the main HTTP APIs for debugging client compatibility, frontend calls, and reverse proxy issues. Exact behavior still follows `src/router*.ts` and the corresponding handlers.

## Public APIs

Public APIs do not require a Bearer token, but sensitive paths still use rate limits, same-origin checks, or one-time token validation.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/web-bootstrap`, `/web-bootstrap` | Web Vault startup config and risk warnings. |
| `GET` | `/config`, `/api/config`, `/api/version` | Bitwarden-compatible config and version. |
| `POST` | `/identity/accounts/prelogin`, `/identity/accounts/prelogin/password` | Read KDF parameters before login. |
| `POST` | `/identity/connect/token` | Password, refresh token, and API key login; also carries the Send V2 `send_access` grant. |
| `POST` | `/identity/connect/revocation`, `/identity/connect/revoke` | Revoke refresh tokens. |
| `POST` | `/api/accounts/register` | First registration or invite registration. |
| `POST` | `/api/accounts/password-hint` | Same-origin password hint lookup. |
| `POST` | `/identity/accounts/recover-2fa`, `/api/accounts/recover-2fa` | Disable TOTP with a recovery code. |
| `GET` | `/api/devices/knowndevice` | Official-client known-device check. |
| `PUT`, `POST` | `/api/devices/identifier/{id}/clear-token` | Login-preflight compatible clear-token path; returns empty 200. |
| `GET` | `/icons/{hostname}/icon.png` | Website icon proxy. See [Website Icons](/guide/core/website-icons). |
| `POST`, `GET` | `/notifications/hub/negotiate`, `/notifications/hub` | Notification negotiate and WebSocket. |

## Accounts and authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `PUT` | `/api/accounts/profile` | Get or update profile. |
| `POST`, `PUT` | `/api/accounts/password`, `/api/accounts/change-password` | Change master password and refresh `securityStamp`. |
| `POST` | `/api/accounts/keys` | Save account key material. |
| `GET`, `PUT`, `POST` | `/api/accounts/totp` | Get or change user-level TOTP status. |
| `POST` | `/api/accounts/totp/recovery-code`, `/api/two-factor/get-recover` | Get or rotate TOTP recovery code. |
| `GET` | `/api/accounts/revision-date` | Return account revision date. |
| `POST` | `/api/accounts/verify-password` | Verify master password hash. |
| `PUT`, `POST` | `/api/accounts/verify-devices` | Toggle device verification. |
| `POST` | `/api/accounts/api-key`, `/api/accounts/api_key` | View or create personal API key. |
| `POST` | `/api/accounts/rotate-api-key`, `/api/accounts/rotate_api_key` | Rotate personal API key and clear old refresh tokens. |

## Vault

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/sync` | Official-client full sync entrypoint. |
| `GET`, `POST` | `/api/ciphers`, `/api/ciphers/create` | Get or create ciphers. |
| `GET`, `PUT`, `POST`, `DELETE` | `/api/ciphers/{id}` | Get, update, or delete a cipher. |
| `PUT` | `/api/ciphers/{id}/delete` | Soft delete to trash. |
| `DELETE` | `/api/ciphers/{id}/delete` | Permanently delete. |
| `PUT` | `/api/ciphers/{id}/restore` | Restore from trash. |
| `PUT`, `POST` | `/api/ciphers/{id}/archive`, `/api/ciphers/{id}/unarchive` | Archive or unarchive. |
| `PUT`, `POST` | `/api/ciphers/{id}/partial` | Partial update. |
| `POST`, `PUT` | `/api/ciphers/move` | Bulk move to folder. |
| `POST` | `/api/ciphers/delete`, `/api/ciphers/delete-permanent`, `/api/ciphers/restore` | Bulk soft delete, permanent delete, or restore. |
| `PUT`, `POST` | `/api/ciphers/archive`, `/api/ciphers/unarchive` | Bulk archive or unarchive. |
| `POST` | `/api/ciphers/import` | Import vault data. |
| `GET`, `POST` | `/api/folders` | Get or create folders. |
| `GET`, `PUT`, `DELETE` | `/api/folders/{id}` | Get, update, or delete folder. |
| `POST` | `/api/folders/delete` | Bulk delete folders. |

## Attachments and Send

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/ciphers/{id}/attachment/v2`, `/api/ciphers/{id}/attachment` | Create attachment metadata and upload token. |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/ciphers/{id}/attachment/{attachmentId}` | Download, upload, or delete attachment. |
| `POST`, `PUT` | `/api/ciphers/{id}/attachment/{attachmentId}/metadata` | Update attachment metadata. |
| `POST` | `/api/ciphers/{id}/attachment/{attachmentId}/delete` | Compatible delete path. |
| `GET` | `/api/attachments/{cipherId}/{attachmentId}?token=...` | Tokenized public attachment download. |
| `POST`, `PUT` | `/api/ciphers/{id}/attachment/{attachmentId}?token=...` | Tokenized public attachment upload. |
| `GET`, `POST` | `/api/sends` | Get or create Send. |
| `GET`, `PUT`, `DELETE` | `/api/sends/{id}` | Get, update, or delete Send. |
| `POST` | `/api/sends/file/v2` | Create file Send metadata and upload token. |
| `GET`, `POST`, `PUT` | `/api/sends/{id}/file/{fileId}` | Get upload URL or upload Send file. |
| `POST`, `PUT` | `/api/sends/{id}/file/{fileId}?token=...` | Tokenized public Send file upload. |
| `PUT`, `POST` | `/api/sends/{id}/remove-password`, `/api/sends/{id}/remove-auth` | Remove Send password or access auth. |
| `POST` | `/api/sends/delete` | Bulk delete Send. |
| `POST` | `/api/sends/access`, `/api/sends/access/{id}` | Public Send access. |
| `POST` | `/api/sends/access/file/{id}`, `/api/sends/{id}/access/file/{fileId}` | Public file Send access. |
| `GET` | `/api/sends/{id}/{fileId}` | Public file Send download. |

## Domain rules and devices

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `PUT`, `POST` | `/api/settings/domains`, `/settings/domains` | Get or save user domain match rules. |
| `GET`, `DELETE` | `/api/devices` | List devices or delete all current-user devices. |
| `GET`, `DELETE` | `/api/devices/authorized` | List or clear remembered 2FA devices. |
| `DELETE` | `/api/devices/authorized/{id}` | Revoke one remembered device. |
| `GET`, `DELETE` | `/api/devices/{id}` | Get or delete one device. |
| `PUT` | `/api/devices/{id}/name` | Update device display name. |
| `GET` | `/api/devices/identifier/{id}` | Query by device identifier. |
| `PUT`, `POST` | `/api/devices/{id}/keys`, `/api/devices/identifier/{id}/keys` | Update device encryption key. |
| `PUT`, `POST` | `/api/devices/identifier/{id}/token` | Update device push token. |
| `PUT`, `POST` | `/api/devices/identifier/{id}/web-push-auth` | Update Web Push auth data. |
| `PUT`, `POST` | `/api/devices/identifier/{id}/clear-token` | Clear device token. |
| `POST` | `/api/devices/{id}/retrieve-keys` | Compatible device key retrieval path. |
| `POST`, `DELETE` | `/api/devices/{id}/deactivate` | Deactivate device. |
| `POST` | `/api/devices/update-trust`, `/api/devices/untrust` | Update or revoke device trust. |

## Administrator APIs

Administrator APIs require the current user to be an admin.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/users` | User list. |
| `GET`, `POST`, `DELETE` | `/api/admin/invites` | List, create, or clear invites. |
| `DELETE` | `/api/admin/invites/{code}` | Revoke one invite. |
| `PUT`, `POST` | `/api/admin/users/{id}/status` | Enable or ban a user. |
| `DELETE` | `/api/admin/users/{id}` | Delete user and associated attachments and Send files. |
| `POST` | `/api/admin/backup/export`, `/api/admin/backup/import` | Export or import instance backup. |
| `GET` | `/api/admin/backup/blob` | Download attachment blobs during full local export so the frontend can repackage ZIP. |
| `GET`, `PUT` | `/api/admin/backup/settings` | Get or save backup center settings. |
| `GET`, `POST` | `/api/admin/backup/settings/repair` | Check or repair backup settings encryption status. |
| `POST` | `/api/admin/backup/run` | Run remote backup immediately. |
| `GET` | `/api/admin/backup/remote` | Browse remote backup list. |
| `GET` | `/api/admin/backup/remote/download` | Download remote backup. |
| `GET` | `/api/admin/backup/remote/integrity` | Check remote backup integrity. |
| `DELETE` | `/api/admin/backup/remote/file` | Delete remote backup file. |
| `POST` | `/api/admin/backup/remote/restore` | Restore from remote backup. |

## Compatibility placeholders

NodeWarden does not implement the full organization, collection, and enterprise policy model. Read paths such as `/api/collections`, `/api/organizations`, `/api/policies`, and `/api/auth-requests` return empty lists or empty structures so personal vault workflows can continue.
