# Storage Schema

NodeWarden's D1 schema has two sources:

- `migrations/0001_init.sql`: initial migration file.
- `src/services/storage-schema.ts`: runtime automatic initialization and schema completion.

They must stay in sync.

## Schema version

`src/services/storage.ts` contains:

```ts
const STORAGE_SCHEMA_VERSION_KEY = 'schema.version';
const STORAGE_SCHEMA_VERSION = '...';
```

When the Worker initializes, it reads `config.schema.version`. If the value differs, it runs `ensureStorageSchema()` and writes the new version.

When adding tables, columns, or indexes, bump `STORAGE_SCHEMA_VERSION`. Otherwise old instances will not rerun schema initialization.

## Main tables

| Table | Purpose |
| --- | --- |
| `config` | Runtime config, schema version, backup config, and run locks. |
| `users` | Users, master password verification hash, encrypted key, role, status, TOTP, API key. |
| `domain_settings` | User domain matching rules. |
| `user_revisions` | Per-user vault revision date. |
| `folders` | Folders. |
| `ciphers` | Cipher body and encrypted JSON. |
| `attachments` | Attachment metadata. |
| `sends` | Send records. |
| `refresh_tokens` | Refresh token hash and device binding. |
| `invites` | Invite codes. |
| `audit_logs` | Audit logs. |
| `devices` | Devices, session stamp, and device encryption key. |
| `trusted_two_factor_device_tokens` | Remembered-device token hashes. |
| `login_attempts_ip` | Login failures and temporary lockouts. |
| `used_attachment_download_tokens` | One-time attachment and Send file download token consumption. |

## Foreign keys and indexes

Vault core tables are isolated by user and have common indexes:

- `idx_ciphers_user_updated`
- `idx_ciphers_user_archived`
- `idx_ciphers_user_deleted`
- `idx_ciphers_user_deleted_updated`
- `idx_ciphers_user_folder`
- `idx_folders_user_updated`
- `idx_attachments_cipher`
- `idx_sends_user_updated`
- `idx_sends_user_deletion`

These indexes directly affect `/api/sync`, paginated lists, trash, archive, and bulk operation performance.

## D1 bind detail

D1 `.bind()` does not accept `undefined`. `StorageService.safeBind()` converts `undefined` to `null`, preventing runtime errors when clients submit unknown or omitted fields.

## Persistent data checklist

When adding a table or field:

1. Update `migrations/0001_init.sql`.
2. Update `src/services/storage-schema.ts`.
3. Bump `STORAGE_SCHEMA_VERSION`.
4. Decide whether it belongs in instance backups.
5. If backed up, update `backup-archive.ts`, `backup-import.ts`, and frontend backup types.
6. Decide whether `/api/sync` is affected.
7. Decide whether audit logs or rate limits are needed.

Do not mistake runtime tables for migratable data. `refresh_tokens`, `devices`, `trusted_two_factor_device_tokens`, `login_attempts_ip`, `used_attachment_download_tokens`, backup run locks, and audit logs are current-instance runtime state and do not enter instance backups by default.
