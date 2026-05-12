# Operate NodeWarden

This path is for people who already have a NodeWarden instance and need to keep it stable.

## Maintenance path

1. [Updates and Maintenance](/guide/deployment/update) - update your fork without breaking schema, secrets, or global domain rules.
2. [Configuration and Secrets](/guide/deployment/configuration) - keep `JWT_SECRET`, bindings, and backup target settings stable.
3. [Limits and Boundaries](/guide/operations/limitations) - understand Cloudflare limits, storage choices, and intentionally unsupported features.

## Backup and restore path

1. [Backup Overview](/guide/backup/overview) - understand local export, remote backup, verification, retention, and locks.
2. [Backup Scope](/guide/backup/scope) - check which tables and fields are included in instance backups.
3. [Settings Encryption](/guide/backup/settings-crypto) - understand how remote backup credentials are protected.
4. [Remote Backup Flow](/guide/backup/remote-flow) - follow scheduled and manual WebDAV or S3-compatible backups.
5. [Restore and Validation](/guide/backup/restore) - validate backup ZIP files and restore into a safe target instance.

## Incident path

- [Troubleshooting](/guide/operations/troubleshooting) covers everyday failures.
- [Backup Incidents](/guide/operations/backup-incidents) covers damaged remote backups, partial attachment restores, deleted remote attachment folders, and changed `JWT_SECRET`.
