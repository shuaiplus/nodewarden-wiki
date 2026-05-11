# Send and Public Access

Send creates temporary shares. NodeWarden supports text Send and file Send.

When maintaining Send, keep two paths separate: authenticated users manage their own Sends, while public visitors only receive short-lived access capability. Public access must not reuse account access tokens, and it must not bypass disabled state, expiration, deletion date, or access-count limits.

## Data structure

Structured Send data is stored in the D1 `sends` table:

- `id`
- `user_id`
- `type`
- `name`
- `notes`
- `data`
- `key`
- `password_hash`
- `password_salt`
- `password_iterations`
- `auth_type`
- `emails`
- `max_access_count`
- `access_count`
- `disabled`
- `hide_email`
- `expiration_date`
- `deletion_date`

File Send binary content is stored in R2/KV with this key:

```text
sends/<sendId>/<fileId>
```

## What happens on create

When the Web Vault creates a Send, the frontend first generates Send-specific key material. It encrypts that material with the user's vault key and stores it in the `key` field. The server stores encrypted `name`, `notes`, text or file metadata, and the encrypted Send key. It does not know plaintext content.

Text Send flow:

```text
SendsPage.tsx
  -> webapp/src/lib/api/send.ts createSend()
  -> POST /api/sends
  -> src/handlers/sends-private.ts handleCreateSend()
  -> D1 sends
```

File Send adds a blob upload step:

```text
POST /api/sends/file/v2
  -> create D1 sends row and return short upload URL
PUT/POST /api/sends/{sendId}/file/{fileId}?token=...
  -> verify upload token
  -> write R2/KV sends/{sendId}/{fileId}
```

That means a file Send has two required parts: the D1 Send record and the file body in R2/KV. Restoring only one side is incomplete.

## Public access token

Public access does not expose the account token. The server generates a short-lived token of type `send_access`, valid for 5 minutes by default.

File upload and download also use independent short tokens signed by `JWT_SECRET`, similar to attachments.

Current public access supports no extra authentication and password authentication. Email authentication fields can be stored for compatibility, but public access returns unsupported and does not send email verification codes.

Main public paths:

```text
/send/{accessId}/{key}              -> frontend public page
POST /api/sends/access/{accessId}   -> validate Send accessibility and password
POST /api/sends/{id}/access/file/{fileId}
GET  /api/sends/{id}/{fileId}?t=... -> short-token file download
```

`accessId` is a public ID derived from the Send UUID. The key part in the URL is frontend decryption material, not a server login credential. The server uses it only for password hash derivation or to let the frontend decrypt content.

## Access count

`StorageService.incrementSendAccessCount()` increments access count atomically. If a Send has `max_access_count`, access fails after the limit is reached.

File download tokens include `jti`. The server reuses `used_attachment_download_tokens` and prefixes Send file download `jti` values with `send:` to avoid collisions with attachment downloads.

## Deletion date

Send has a deletion date. Current config limits the furthest deletion date to 31 days so public shares do not become permanent risks.

Accessibility checks include:

- `disabled`
- `max_access_count`
- `expiration_date`
- `deletion_date`
- Whether the file blob exists
- Whether the password is correct

After the deletion date, D1 rows and blobs are not necessarily removed immediately, but public access fails. Any future automatic cleanup must handle both D1 `sends` rows and `sends/<sendId>/<fileId>` blobs.

## Backup boundary

Current instance-level backups do not export the `sends` table or Send file bodies. The backup section documents this boundary separately.

This is intentional. Send is a temporary sharing feature, not long-term vault data. Backing it up raises additional questions: should public links be restored, should access counts be restored, should expired Sends be restored, and should file bodies remain public across instances? The current version chooses not to back up Send to avoid reactivating old sharing links after restore.

Changing this boundary would require updating:

- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `shared/backup-schema.ts`
- `wiki/guide/backup/scope.md`
- Frontend backup counts and restore result display
