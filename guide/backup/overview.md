# Backup Overview

NodeWarden's backup center is more than a database download. It combines instance backups, remote storage, attachment reuse, encrypted backup target secrets, upload verification, pre-restore validation, and run locks into one workflow.

## Two backup modes

| Type | Entry | Purpose |
| --- | --- | --- |
| Local instance export | Manual export in the backup center | Downloads a `nodewarden_backup_*.zip` for offline storage or manual migration. |
| Remote scheduled backup | WebDAV / S3 target | Uploads ZIP files automatically and prunes old backups according to retention rules. |

If a local export includes attachments, the frontend downloads the ZIP, fetches attachment blobs, and repackages a complete ZIP. Remote backups store attachment blobs separately in the remote `attachments/` directory so repeated backups do not reupload the same large files. The ZIP contains a reference manifest.

## Supported remote targets

- WebDAV
- S3-compatible storage

Some older UI labels or configs may have used E3. Current code uses `s3`, and old `e3` input is mapped to `s3` for compatibility.

An instance can store up to 24 backup targets. The default schedule is UTC, 03:00, every 24 hours, retaining 30 backups. Each target can configure enabled state, path, attachment option, schedule, and retention independently.

## Backup ZIP contents

The base ZIP contains:

```text
manifest.json
db.json
```

A complete local export with attachments also contains:

```text
attachments/<cipherId>/<attachmentId>.bin
```

Remote backups usually do not put attachment bodies into every ZIP. They store blobs at:

```text
attachments/<cipherId>/<attachmentId>
attachments/.nodewarden-attachment-index.v1.json
```

The ZIP manifest records each attachment blob name, size, and cipher/attachment ownership.

## Why remote attachments are separate

If every backup ZIP contained every attachment, large vaults would reupload the same files again and again. NodeWarden remote backups maintain a remote attachment index:

- Build a local manifest listing required attachment blobs.
- Read remote `attachments/.nodewarden-attachment-index.v1.json`.
- Skip blobs that already exist with the same size.
- Upload only missing or size-mismatched blobs.
- Upload the new backup ZIP last.

In normal daily backups, only `db.json` and new attachments change.

## Upload verification

After uploading a remote backup ZIP, NodeWarden does not immediately mark it successful. It:

1. Uploads the backup ZIP.
2. Downloads the same remote ZIP.
3. Checks that the hash prefix in the file name matches the first 5 characters of the ZIP SHA-256.
4. Checks that downloaded size equals uploaded size.
5. Deletes the remote ZIP and retries on failure, up to 3 attempts.

This catches truncated, overwritten, or unexpected remote upload results.

## Run lock

Backup and restore operations are not queued. `backup.runner.lock.v1` is a lease lock in the D1 `config` table that prevents overlapping backup or restore tasks.

- Manual runs return 409 if the lock is occupied.
- Scheduled runs silently skip if the lock is occupied.
- The lock has a 10-minute lease and is extended by heartbeat while the task runs.
- The lock is not exported to backups.

## Recommended setup

For a personal instance:

- Configure at least one remote backup target.
- Back up every 24 hours.
- Retain 30 backups.
- Include attachments.
- Run a manual backup before every major update.

If you have many attachments, use stable and inexpensive S3-compatible storage. WebDAV is convenient when you already have a NAS or cloud-drive ecosystem.
