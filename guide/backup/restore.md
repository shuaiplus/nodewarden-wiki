# Restore and Validation

The restore flow has one core goal: validate first, replace second, and never let attachment failures pollute the database.

## Supported restore sources

- Upload a local backup ZIP.
- Select a ZIP from a remote WebDAV or S3 target.

Remote restore can browse remote directories in the backup center. Only `.zip` files can be selected. The server rejects empty paths, directory paths, and non-ZIP paths.

## File name hash verification

Backup file names look like:

```text
nodewarden_backup_20260510_031500_abc12.zip
```

The last 5 characters are the first 5 characters of the ZIP SHA-256. During import, the server recalculates the hash and rejects by default if it does not match.

Administrators can choose to allow a hash mismatch, but the decision is written to the audit log as `checksumMismatchAccepted`.

## ZIP parsing

`parseBackupArchive()` checks:

- ZIP total size must not exceed the current limit.
- Unzipped total size must not exceed the current limit.
- Entry count must not be too high.
- `manifest.json` and `db.json` must exist.
- Manifest `formatVersion` must be supported.
- `db.json` must be valid JSON.
- If attachments are inline in the ZIP, every required attachment file must exist.

## Content validation

`validateBackupPayloadContents()` checks:

- Users must have `id` and `email`.
- User IDs must be unique.
- Config keys cannot be empty.
- Revisions must point to existing users.
- Domain settings must point to existing users, and each user can have at most one row.
- Folders must point to existing users, and folder IDs must be unique.
- Ciphers must point to existing users.
- Cipher `folder_id` must exist when present.
- Attachments must point to existing ciphers.
- Each attachment must have a corresponding file or remote blob reference.

## Fresh instance protection

By default, restore requires the target instance to have no vault or Send data. The server checks:

- `ciphers`
- `folders`
- `attachments`
- `sends`

If data already exists and replace-existing is not selected, restore returns a conflict.

## Shadow table restore

Restore does not directly delete official tables and insert backup rows. The flow is:

1. Delete old shadow tables.
2. Create shadow tables from the current official table `CREATE SQL`.
3. Insert backup rows into shadow tables.
4. Validate shadow table row counts.
5. Restore attachment blobs.
6. Remove rows for attachments that failed to restore from the shadow table.
7. Validate shadow table row counts again.
8. Clear official tables.
9. Insert shadow table contents into official tables.
10. Delete shadow tables.

If restore fails before the replacement phase, official data has not been cleared.

## Attachment recovery policy

Attachment recovery adapts to the target storage:

- R2: write directly.
- KV: skip attachments larger than 25 MiB.
- No attachment storage: skip all attachments.

When attachments are skipped, the server returns a skipped list and removes those rows from the restored `attachments` table so the frontend does not show non-existent files.

## Cleanup after replace restore

If replace-existing is selected, after restore succeeds NodeWarden compares attachment blob keys before and after restore. Blobs from the old vault that are no longer referenced are cleaned up to avoid orphan storage.

Cleanup failure does not roll back database restore, but NodeWarden still attempts it.
