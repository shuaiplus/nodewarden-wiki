# FAQ

## Can I change `JWT_SECRET` casually?

No. Changing it invalidates old tokens and breaks backup settings runtime decryption. Production instances should keep it as a long-lived Cloudflare Secret.

## Can I recover a forgotten master password by editing the database?

No. `master_password_hash` is only for login verification, not vault decryption. Editing the database cannot decrypt the existing vault.

## Does backup include Send?

Current instance backups do not export the `sends` table or Send files. They mainly back up users, ciphers, folders, domain rules, attachments, and backup settings.

## Why are attachment files missing from remote backup ZIPs?

Remote backups store attachment bodies separately in the remote `attachments/` directory so attachments can be reused incrementally. The ZIP manifest records references. Restore reads those blobs as needed.

For a complete local export, if attachments are selected, the frontend fetches blobs and repackages a ZIP that includes attachment files.

## Why do large attachments fail in KV mode?

Cloudflare KV has a single-object size limit. NodeWarden caps attachment and Send files to 25 MiB in KV mode. Use R2 for large attachments.

## Do updates require manual SQL?

Usually no. The Worker automatically runs idempotent schema initialization based on `config.schema.version`.

## Why is the first user an administrator?

During first registration, if the `users` table is empty, the server assigns the first user `admin` role and writes `registered=true`.

## Should I report NodeWarden issues to Bitwarden?

No. NodeWarden is an independent project and is not affiliated with Bitwarden. Report NodeWarden issues in the NodeWarden project.
