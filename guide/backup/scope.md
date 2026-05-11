# Backup Scope

The backup system uses allowlisted export and allowlisted import. The goal is not convenience; it is to avoid migrating obsolete fields, sensitive runtime state, temporary locks, or tokens that should not move to a new instance.

## Included data

Instance backups export these tables or fields:

| Table | Content |
| --- | --- |
| `config` | Regular config rows and portable `backup.settings.v1`. |
| `users` | Users, master password verification hashes, encrypted user keys, encrypted private keys, public keys, KDF, role, status, TOTP data, and related fields. |
| `domain_settings` | User equivalent domains, custom domain rules, and excluded global domain rules. |
| `user_revisions` | Per-user sync revision dates. |
| `folders` | Folders. |
| `ciphers` | Cipher bodies, encrypted fields, archive/delete status, and unknown compatibility fields. |
| `attachments` | Attachment metadata. |
| Attachment bodies | Exported or remotely referenced only when attachments are included. |

## Excluded data

These values do not enter instance backups:

| Data | Why it is excluded |
| --- | --- |
| `backup.runner.lock.v1` | Runtime lock that only means a task is currently running. |
| `users.api_key` | Old sensitive field explicitly excluded to avoid restoring old keys. |
| `refresh_tokens` | Login sessions should not be restored across instances. |
| `trusted_two_factor_device_tokens` | Remembered-device tokens belong to current device trust state. |
| `devices` | Device sessions and trusted state should not migrate with backups. |
| `invites` | Invite codes are administrative operations, not vault data. |
| `audit_logs` | Audit logs are not part of the current backup format. |
| `login_attempts_ip` | Rate limit and lockout state is runtime state. |
| `used_attachment_download_tokens` | One-time attachment token consumption records. |
| `sends` | Current instance-level backups do not export Send. |
| Send file bodies | Current instance-level backups do not export Send files. |

If you rely on Send for long-term sharing, handle it separately. Instance backup primarily protects accounts, vault items, folders, attachments, domain rules, and backup settings.

## Are attachments backed up

Attachments have two parts:

- D1 `attachments` table: attachment ID, `cipher_id`, encrypted file name, size, encrypted key.
- R2/KV blob: the actual binary file.

If "include attachments" is not selected, the backup exports `attachments` as an empty set so restore does not leave dangling records pointing at missing files.

If "include attachments" is selected, the backup records attachment metadata and blob references. During restore, if a file is missing or cannot be written to target storage, that attachment is skipped and its row is removed from the restored shadow table. The database is not left with broken attachment records.

## Special handling for `config`

The `config` table is not exported wholesale. Export filters:

- Skip empty keys.
- Skip `backup.runner.lock.v1`.
- Export only the portable part of `backup.settings.v1`, not the current instance's runtime ciphertext.

This is what allows backup settings to be restored across instances.

## Code change checklist

If future changes add persistent tables or fields, check:

- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `webapp/src/lib/api/backup.ts`
- `migrations/0001_init.sql`
- `src/services/storage-schema.ts`

Changing the database schema without changing backup means the new data can never be restored from backup.
