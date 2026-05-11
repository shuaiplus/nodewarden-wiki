# Updates and Maintenance

NodeWarden updates focus on keeping code, the D1 schema, frontend assets, and `JWT_SECRET` stable.

## What fork users should do

If you forked the repository, click this on GitHub:

```text
Sync fork -> Update branch
```

Then wait for Cloudflare to redeploy. After deployment, the first Worker request checks the D1 schema version. If the version changed, runtime schema initialization runs automatically.

Users usually do not need to run SQL manually. The real checks are:

- Cloudflare bindings still exist, such as `DB`, `JWT_SECRET`, `NOTIFICATIONS_HUB`, `ATTACHMENTS`, or `ATTACHMENTS_KV`.
- `JWT_SECRET` was not regenerated.
- Deployment logs do not show D1 initialization failures.
- A verifiable backup exists before a major update.

## Automatic upstream sync

The repository includes a GitHub Actions workflow for syncing upstream. You can enable it in your fork:

```text
Actions -> Sync upstream -> Enable workflow
```

After it is enabled, the workflow runs on its configured schedule.

`.github/workflows/sync-upstream.yml` has two modes:

| Mode | Trigger | Behavior |
| --- | --- | --- |
| Scheduled | Daily cron | Reads the latest upstream release tag and merges it into `main` if the fork does not already contain that commit. |
| Manual | Actions page | If `target_commit` is provided, checks out that commit or tag. If it is empty, uses the latest `upstream/main`. |

Manual mode can upgrade or roll back, so the workflow force-pushes `main`. Use it only when you know the target commit.

After sync, the workflow restores its own `.github/workflows/sync-upstream.yml` so it is not overwritten by upstream. It does not update user D1 data and does not generate backups.

## Global domain rule sync

Global equivalent domain rules have a separate Action: `.github/workflows/sync-global-domains.yml`.

It updates only:

- `src/static/global_domains.bitwarden.json`
- `src/static/global_domains.bitwarden.meta.json`

It also checks that `src/static/global_domains.custom.json` did not change. NodeWarden-specific global rules should be added by a manual PR to `global_domains.custom.json`, not mixed into generated Bitwarden sync output.

See [Domain Rules](/guide/core/domain-rules) for details.

## Updates do not require manual migrations

The D1 schema initializer is idempotent and runs at runtime. `src/services/storage.ts` contains `STORAGE_SCHEMA_VERSION`. When that version changes, the Worker reruns SQL from `src/services/storage-schema.ts`.

You need to watch for:

- Database initialization failures in deployment logs.
- New bindings required by the new version.
- Whether the original `JWT_SECRET` is still present.

If you are contributing schema changes, update all of these together:

- `migrations/0001_init.sql`
- `src/services/storage-schema.ts`
- `STORAGE_SCHEMA_VERSION` in `src/services/storage.ts`

If the new data is persistent, also check `backup-archive.ts`, `backup-import.ts`, and frontend backup types. Otherwise the data may be writable but not restorable from backups.

## Back up before updating

Before updating, run a manual instance export in the backup center. Vault data is more valuable than the deployment itself, so make sure you have a verifiable restore point.

If remote scheduled backups are enabled, it is still wise to run one manually and confirm success. Remote backups record the last success time, file name, size, path, and error details.

## What not to do

- Do not delete the D1 database and redeploy unless you are ready to restore from backup.
- Do not reset `JWT_SECRET`.
- Do not edit `backup.settings.v1` as plain JSON. It may be an encrypted envelope.
- Do not manually clean the remote `attachments/` directory unless you have confirmed that no backup ZIP references those blobs.
- Do not submit long-term rule changes by editing generated files such as `src/static/global_domains.bitwarden.json`.
