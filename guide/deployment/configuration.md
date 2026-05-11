# Configuration and Secrets

NodeWarden configuration has two categories: deployment bindings and runtime data. Deployment bindings are provided by Cloudflare. Most runtime data is stored in the D1 `config` table.

## Store `JWT_SECRET` as a Secret

Production deployments must store `JWT_SECRET` as a Cloudflare Secret:

```powershell
npx wrangler secret put JWT_SECRET
```

Do not put it in:

- `wrangler.toml`
- `.dev.vars`
- GitHub Actions logs
- README screenshots
- Any file that can be committed to the repository

Changing `JWT_SECRET` has a large blast radius:

- Existing access tokens become invalid.
- Attachment upload and download short tokens become invalid.
- Send file upload and download short tokens become invalid.
- Send access tokens become invalid.
- Backup settings runtime encryption envelopes can no longer be decrypted directly and must be reactivated or repaired by an administrator.

Do not regenerate `JWT_SECRET` during project updates. Treat it like a database password and keep it stable.

## The server rejects weak `JWT_SECRET`

Both `src/router.ts` and `src/handlers/accounts.ts` check `JWT_SECRET`:

- Missing: rejected.
- Equal to the example `Enter-your-JWT-key-here-at-least-32-characters`: rejected.
- Fewer than 32 characters: rejected.

A weak secret is not only a warning. It blocks registration or authenticated API requests from continuing.

## D1 `config` table

The `config` table stores internal project configuration, such as:

- `registered`: whether first registration has completed.
- `schema.version`: the current D1 schema version.
- `backup.settings.v1`: encrypted backup center settings.
- `backup.runner.lock.v1`: a temporary backup or restore runtime lock.

`backup.runner.lock.v1` is not included in instance backups. It only indicates that a task is currently running.

## Backup target settings

The backup center supports up to 24 targets. Each target includes:

- Name
- Type: `webdav` or `s3`
- Whether attachments are included
- Remote path
- Schedule enabled flag
- Start time
- Timezone
- Interval in hours
- Retention count
- Runtime status

`s3` is the canonical name. If an older config still contains `e3`, `src/services/backup-config.ts` maps it to `s3` for compatibility.

## Local development variables

Local development can use `.dev.vars`, but never commit real secrets. Example values are only placeholders for the expected shape and must not be used in production.

```ini
JWT_SECRET=Enter-your-real-random-secret-here
```

## Configuration change principles

- Secret-like settings should use Cloudflare Secrets or project-level encrypted envelopes.
- Runtime locks and temporary status should not enter backups.
- When adding persistent config, decide whether it should be backed up, then update `backup-archive.ts` and `backup-import.ts` accordingly.
