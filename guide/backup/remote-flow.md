# Remote Backup Flow

Remote backups are scheduled by `src/handlers/backup.ts`, and transfer adapters live in `src/services/backup-uploader.ts`.

## Scheduled scan

Cloudflare cron enters the scheduled handler every 5 minutes. The server:

1. Initializes the database.
2. Acquires the backup run lock.
3. Reads backup settings.
4. Finds targets due in the current time window.
5. Runs backup for each due target.

Due state is calculated from:

- `schedule.enabled`
- `schedule.timezone`
- `schedule.startTime`
- `schedule.intervalHours`
- `runtime.lastAttemptAt`

The scheduling window defaults to 5 minutes. The code also checks whether a backup slot was missed between the previous scan and the current scan, reducing missed runs caused by Worker cron delay.

## Execution steps

Remote backup runs in this order:

1. Mark `lastAttemptAt` and local date.
2. Build backup ZIP.
3. If attachments are included, sync remote attachment blobs first.
4. Upload ZIP.
5. Download the ZIP and verify hash and size.
6. Delete old ZIP files according to retention.
7. Write `lastSuccessAt`, file name, size, and remote path.
8. Write audit log.

On failure, it writes:

- `runtime.lastErrorAt`
- `runtime.lastErrorMessage`
- `admin.backup.remote.manual.failed` or `admin.backup.remote.scheduled.failed` audit action

## WebDAV transfer

WebDAV uses:

- `MKCOL` to create directories.
- `PUT` to upload files.
- `PROPFIND` to list directories.
- `GET` to download.
- `DELETE` to delete.
- `HEAD` to check existence.

WebDAV paths are normalized and reject `.` and `..` to avoid path traversal.

## S3-compatible transfer

S3 uses AWS Signature V4 signing. Upload, download, list, and delete requests are signed with access key and secret key.

Config fields include:

- endpoint
- bucket
- region, default `auto`
- accessKeyId
- secretAccessKey
- rootPath

S3 object paths are built from `rootPath` plus the relative path.

## Attachment index

Remote attachment index file:

```text
attachments/.nodewarden-attachment-index.v1.json
```

Approximate shape:

```json
{
  "version": 1,
  "blobs": {
    "cipherId/attachmentId": {
      "sizeBytes": 1234,
      "updatedAt": "2026-05-10T00:00:00.000Z"
    }
  }
}
```

If the index does not exist, some WebDAV services may return 404, 403, 530, or non-standard "not found" text. NodeWarden treats those cases as an empty index so the first backup can continue.

## Retention

`retentionCount` controls how many ZIP files are kept. Pruning handles only `.zip` files under the backup root. It does not clean `attachments/` because attachment blobs are shared by multiple ZIP files. Deleting them casually can break historical backups.

If pruning fails, the backup itself can still succeed and records `pruneError`.
