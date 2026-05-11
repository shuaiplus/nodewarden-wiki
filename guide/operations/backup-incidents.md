# Backup Incidents

## Remote backup says success but you suspect corruption

Use remote integrity check in the backup center. The server downloads the remote ZIP and compares it with the hash prefix in the file name.

If the hash does not match, do not delete old backups immediately. Download the suspicious file, save it locally, then run a new manual backup.

## Backup settings need repair after restore

This usually means the restored instance has a different `JWT_SECRET`, so the runtime envelope cannot be decrypted. Open the backup center and let the administrator re-save backup settings from the portable part.

After repair, NodeWarden regenerates runtime ciphertext using the current `JWT_SECRET`.

## Some attachments fail to restore

Restore results return a skipped list. Common causes:

- Remote `attachments/` directory is missing a blob.
- KV mode sees an attachment larger than 25 MiB.
- Target instance has no R2/KV binding.
- Writing to R2/KV failed.

The server removes failed attachments from the restored `attachments` table, so ciphers do not reference files that do not exist.

## Remote `attachments/` directory was deleted

Remote ZIP files usually contain only `manifest.json` and `db.json`; historical attachments depend on the remote `attachments/` directory. If it was deleted:

1. Do not clean old ZIP files.
2. Check whether you have a complete local export ZIP.
3. If the current instance still has attachments, immediately run a remote backup with attachments included to reupload remaining blobs.
4. Attachments that are missing remotely and no longer exist in the current instance can only be recovered from other backups.

## `JWT_SECRET` was changed by mistake

Impact:

- Logged-in sessions become invalid.
- Attachment and Send short links become invalid.
- Backup settings runtime decryption fails.

Recovery:

1. If you know the old `JWT_SECRET`, restore it.
2. If you do not know it, open the backup center and re-save backup targets.
3. Ask users to log in again.
4. Run a new manual backup.
